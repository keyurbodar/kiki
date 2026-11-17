import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import type { Parents as MdastParents, Root as MdastRoot } from "mdast";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Capy's shared/markdown pipeline: remark-parse, remark-gfm, remark-math
 * (display math only), remark-rehype with raw HTML, rehype-raw, then
 * rehype-sanitize with Capy's schema. Post-parse hast passes reshape the tree
 * for the renderer (breaks, video paragraphs, galleries, details disclosures,
 * pending math). Math is typeset later by the lazy KaTeX renderer.
 */

const sanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [["className", /^language-/, "math-inline", "math-display"]],
    video: [["src", /^https?:\/\//]],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "video"],
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "drive"],
    src: [...(defaultSchema.protocols?.src ?? []), "capy-file"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath, { singleDollarTextMath: false })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, sanitizeSchema);

/** A hast pass run after the built-in ones (chip detection plugs in here). */
export type MarkdownTreeTransform = (tree: Root) => void;

export type PipelineOptions = {
  /** Soft line breaks render as <br>. */
  breaks?: boolean;
  /** Raw HTML renders as literal text. */
  literalHtml?: boolean;
  /** Image-only paragraphs collapse into one gallery. */
  gallery?: boolean;
  /** Inline variant: no video paragraphs. */
  inline?: boolean;
  /** The block ends inside an unclosed $$ while streaming. */
  openMath?: boolean;
  transforms?: readonly MarkdownTreeTransform[];
};

type Parent = Root | Element;

type Visitor<T> = (
  node: T,
  index: number,
  parent: Parent,
) => number | undefined;

/** Depth-first visit; a visitor may return the index to continue from. */
export function visitElements(tree: Parent, visitor: Visitor<Element>) {
  const walk = (parent: Parent) => {
    for (let i = 0; i < parent.children.length; ) {
      const child = parent.children[i] as RootContent;
      if (child.type !== "element") {
        i += 1;
        continue;
      }
      const next = visitor(child, i, parent);
      walk(child);
      i = typeof next === "number" ? next : i + 1;
    }
  };
  walk(tree);
}

export function visitText(tree: Parent, visitor: Visitor<Text>) {
  const walk = (parent: Parent) => {
    for (let i = 0; i < parent.children.length; ) {
      const child = parent.children[i] as RootContent;
      if (child.type === "element") walk(child);
      const next =
        child.type === "text" ? visitor(child, i, parent) : undefined;
      i = typeof next === "number" ? next : i + 1;
    }
  };
  walk(tree);
}

export const classList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

export const textContent = (node: Element): string =>
  node.children
    .map((child) =>
      child.type === "text"
        ? child.value
        : child.type === "element"
          ? textContent(child)
          : "",
    )
    .join("");

const isMathClass = (name: unknown) =>
  ["language-math", "math-display", "math-inline"].includes(String(name));

export const hasMath = (tree: Root) => {
  let found = false;
  visitElements(tree, (node) => {
    if (classList(node.properties.className).some(isMathClass)) found = true;
  });
  return found;
};

const KEEP_WHITESPACE = new Set([
  "blockquote",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
]);

function softBreaks(tree: Root) {
  visitText(tree, (node, index, parent) => {
    if (parent.type === "root") return;
    if (parent.tagName === "code" || parent.tagName === "pre") return;
    if (/^\s+$/.test(node.value) && KEEP_WHITESPACE.has(parent.tagName)) return;
    if (!node.value.includes("\n")) return;
    const parts: ElementContent[] = [];
    node.value.split("\n").forEach((line, i) => {
      if (i > 0)
        parts.push({
          type: "element",
          tagName: "br",
          properties: {},
          children: [],
        });
      if (line.length > 0) parts.push({ type: "text", value: line });
    });
    parent.children.splice(index, 1, ...parts);
    return index + parts.length;
  });
}

const VIDEO_FILE = /\.(?:mp4|m4v|mov|webm)$/i;

/** An https (or localhost) URL to a video file, else undefined. */
export function videoUrl(value: string): string | undefined {
  if (!URL.canParse(value)) return;
  const url = new URL(value);
  const secure =
    url.protocol === "https:" ||
    (url.protocol === "http:" && url.hostname === "localhost");
  if (!secure || url.username !== "" || url.password !== "") return;
  return VIDEO_FILE.test(url.pathname) ? url.href : undefined;
}

const meaningful = (children: ElementContent[]) =>
  children.filter((c) => c.type !== "text" || c.value.trim() !== "");

function videoParagraphs(tree: Root) {
  tree.children = tree.children.map((node) => {
    if (node.type !== "element" || node.tagName !== "p") return node;
    const children = meaningful(node.children);
    const only = children[0];
    if (children.length !== 1 || only?.type !== "element") return node;
    const src = only.tagName === "img" ? only.properties.src : undefined;
    const video = typeof src === "string" ? videoUrl(src) : undefined;
    if (video !== undefined)
      return {
        type: "element",
        tagName: "video",
        properties: { src: video, title: only.properties.alt, controls: true },
        children: [],
      };
    if (only.tagName !== "a") return node;
    const href = only.properties.href;
    const inner = meaningful(only.children);
    const imageLink =
      inner.length === 1 &&
      inner[0]?.type === "element" &&
      inner[0].tagName === "img";
    if (
      typeof href !== "string" ||
      (!imageLink && textContent(only).trim() !== href)
    )
      return node;
    const linked = videoUrl(href);
    return linked === undefined
      ? node
      : {
          type: "element",
          tagName: "video",
          properties: { src: linked, controls: true },
          children: [],
        };
  });
}

function gallery(tree: Root) {
  if (tree.children.some((n) => n.type === "element" && n.tagName === "video"))
    return;
  const images = tree.children.flatMap((node) =>
    node.type === "element" && node.tagName === "p"
      ? node.children.filter(
          (c): c is Element => c.type === "element" && c.tagName === "img",
        )
      : [],
  );
  if (images.length === 0) return;
  tree.children = [
    {
      type: "element",
      tagName: "div",
      properties: { dataMarkdownGallery: "" },
      children: images,
    },
  ];
}

function disclosures(tree: Root) {
  visitElements(tree, (node) => {
    if (node.tagName !== "details") return;
    const summary = node.children.find(
      (c): c is Element => c.type === "element" && c.tagName === "summary",
    );
    const body = node.children.filter((c) => c !== summary);
    node.children = [
      {
        type: "element",
        tagName: "summary",
        properties: { ...summary?.properties, dataDisclosureTrigger: true },
        children: summary?.children ?? [{ type: "text", value: "Details" }],
      },
      {
        type: "element",
        tagName: "div",
        properties: { dataDisclosureBody: "" },
        children: body,
      },
    ];
  });
}

/** The last math node of a block that ends inside $$ shows as pending source. */
function pendingMath(tree: Root) {
  let last: Element | undefined;
  visitElements(tree, (node) => {
    const names = classList(node.properties.className);
    if (names.includes("math-display") || names.includes("math-inline"))
      last = node;
  });
  if (!last) return;
  last.properties.className = classList(last.properties.className).filter(
    (name) =>
      typeof name === "string" &&
      name !== "math" &&
      name !== "math-display" &&
      name !== "math-inline" &&
      name !== "language-math",
  ) as string[];
  last.properties.dataMathPending = "";
}

function literalHtml(tree: MdastRoot) {
  const walk = (parent: MdastParents) => {
    parent.children.forEach((child, index) => {
      if (child.type === "html") {
        const text = {
          type: "text" as const,
          value: child.value,
          position: child.position,
        };
        const block =
          parent.type === "root" ||
          parent.type === "blockquote" ||
          parent.type === "listItem";
        parent.children[index] = (block
          ? { type: "paragraph", children: [text], position: child.position }
          : text) as unknown as typeof child;
        return;
      }
      if ("children" in child) walk(child);
    });
  };
  walk(tree);
}

const CACHE_LIMIT = 200;
const CACHE_MAX_SOURCE = 100_000;
const cache = new Map<string, Root>();

/** Parses one markdown block to a hast tree, memoized by source and options. */
export function parseMarkdown(
  src: string,
  options: PipelineOptions = {},
): Root {
  const key = [
    options.breaks,
    options.literalHtml,
    options.gallery,
    options.inline,
    options.openMath,
    options.transforms?.length ?? 0,
    src,
  ].join("|");
  const cached = cache.get(key);
  if (cached && options.transforms === undefined) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const mdast = processor.parse(src);
  if (options.literalHtml) literalHtml(mdast);
  const tree = processor.runSync(mdast) as Root;
  if (options.breaks) softBreaks(tree);
  if (!options.inline) videoParagraphs(tree);
  if (options.gallery) gallery(tree);
  for (const transform of options.transforms ?? []) transform(tree);
  disclosures(tree);
  if (options.openMath) pendingMath(tree);
  if (options.transforms === undefined && src.length <= CACHE_MAX_SOURCE) {
    cache.set(key, tree);
    while (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next();
      if (oldest.done) break;
      cache.delete(oldest.value);
    }
  }
  return tree;
}
