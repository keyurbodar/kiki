import type { Definition, Paragraph, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const parser = unified().use(remarkParse).use(remarkGfm);

const isBlank = (node: RootContent) =>
  node.type === "text" && node.value.trim() === "";

const isImageOnly = (node: RootContent): node is Paragraph =>
  node.type === "paragraph" &&
  node.children.every(
    (child) =>
      child.type === "image" ||
      child.type === "imageReference" ||
      isBlank(child),
  );

const isStrongOnly = (node: RootContent) => {
  if (node.type !== "paragraph") return false;
  const kept = node.children.filter((child) => !isBlank(child));
  return kept.length === 1 && kept[0]?.type === "strong";
};

const isLead = (node: RootContent) =>
  node.type === "heading" || isStrongOnly(node);

function blocks(text: string) {
  const tree: Root = parser.parse(text);
  return tree.children.map((node) => ({
    node,
    raw: text.slice(
      node.position?.start.offset ?? 0,
      node.position?.end.offset ?? text.length,
    ),
  }));
}

const withDefinitions = (section: string, definitions: Definition[], raws: Map<Definition, string>) => {
  const used = definitions.filter((d) =>
    section.toLowerCase().includes(`[${d.identifier}]`),
  );
  return used.length === 0
    ? section
    : `${section}\n\n${used.map((d) => raws.get(d)?.trim()).join("\n")}`;
};

/**
 * Splits an agent message into the sections that each get their own hover
 * footer: a heading or bold-only line leads into the block after it, runs of
 * image-only paragraphs stay together, rules are dropped, and link
 * definitions follow every section that uses them.
 */
export function splitSections(text: string): string[] {
  const sections: string[] = [];
  const definitions: Definition[] = [];
  const raws = new Map<Definition, string>();
  let lead = "";
  let afterImages = false;
  for (const { node, raw } of blocks(text)) {
    if (node.type === "definition") {
      definitions.push(node);
      raws.set(node, raw);
      continue;
    }
    if (afterImages && isImageOnly(node)) {
      sections[sections.length - 1] += `\n\n${raw.trim()}`;
      continue;
    }
    afterImages = false;
    if (node.type === "thematicBreak") continue;
    if (isLead(node)) {
      lead += `${raw.trim()}\n\n`;
      continue;
    }
    sections.push(`${lead}${raw.trim()}`);
    lead = "";
    afterImages = isImageOnly(node);
  }
  const result = [...sections, lead]
    .map((section) => section.trim())
    .filter((section) => section !== "")
    .map((section) => withDefinitions(section, definitions, raws));
  return result.length === 0 && text.trim() !== "" ? [text] : result;
}

/**
 * What the copy button copies for one section: the code of a lone code block,
 * the inside of a lone quote, otherwise the section's markdown.
 */
export function sectionCopyText(section: string): string {
  const parsed = blocks(section);
  const body = parsed.filter(
    ({ node }) => node.type !== "definition" && !isLead(node),
  );
  const only = body.length === 1 ? body[0] : undefined;
  if (only?.node.type === "code") return only.node.value;
  if (only?.node.type !== "blockquote") return section;
  const inner = only.raw
    .split("\n")
    .map((line) => line.replace(/^ {0,3}> ?/, ""))
    .join("\n");
  const definitions = parsed
    .filter(({ node }) => node.type === "definition")
    .map(({ raw }) => raw.trim());
  return definitions.length === 0
    ? inner
    : `${inner}\n\n${definitions.join("\n")}`;
}
