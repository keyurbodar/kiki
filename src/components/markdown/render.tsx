import type { Element, Root } from "hast";
import { type Components, toJsxRuntime } from "hast-util-to-jsx-runtime";
import {
  type ComponentProps,
  createContext,
  lazy,
  memo,
  type ReactNode,
  Suspense,
  useContext,
  useId,
  useMemo,
} from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import type { MarkdownBlock } from "./blocks";
import { CodeBlock } from "./code-block";
import {
  defaultMarkdownComponents,
  type MarkdownComponents,
} from "./components";
import { MarkdownTable } from "./parts";
import {
  classList,
  hasMath,
  type PipelineOptions,
  parseMarkdown,
  textContent,
  videoUrl,
} from "./pipeline";

export type MarkdownElementComponents = Partial<Components>;

type WithNode<T> = T & { node?: Element };

const MarkdownMath = lazy(() => import("./math"));

export function renderTree(tree: Root, components: MarkdownElementComponents) {
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components,
    passNode: true,
  });
}

const isMathClass = (name: unknown) =>
  ["language-math", "math-display", "math-inline"].includes(String(name));

function fencedCode(pre: Element | undefined) {
  const code = pre?.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "code",
  );
  if (!code) return;
  const language = classList(code.properties.className)
    .find((name) => typeof name === "string" && name.startsWith("language-"))
    ?.toString()
    .slice("language-".length);
  return {
    text: textContent(code).replace(/\n$/, ""),
    language,
    mathPending: code.properties.dataMathPending !== undefined,
  };
}

type MarkdownRender = { plugins: MarkdownComponents; interactive: boolean };

export const MarkdownRenderContext = createContext<MarkdownRender>({
  plugins: defaultMarkdownComponents,
  interactive: true,
});

function Pre({ node, children }: WithNode<ComponentProps<"pre">>) {
  const { plugins } = useContext(MarkdownRenderContext);
  const key = useId();
  const code = fencedCode(node);
  if (!code) return <pre>{children}</pre>;
  if (code.mathPending || code.language === "math")
    return (
      <pre data-math-pending="">
        <code>{code.text}</code>
      </pre>
    );
  if (code.language === "mermaid")
    return <plugins.mermaid text={code.text} complete />;
  const Fence = code.language ? plugins.fences[code.language] : undefined;
  if (Fence && code.language)
    return <Fence text={code.text} language={code.language} complete />;
  return (
    <CodeBlock
      text={code.text}
      language={code.language}
      complete
      blockKey={key}
    />
  );
}

function Code({ node, ...props }: WithNode<ComponentProps<"code">>) {
  const pending =
    classList(node?.properties.className).some(isMathClass) ||
    node?.properties.dataMathPending !== undefined;
  return <code {...props} data-math-pending={pending ? "" : undefined} />;
}

function Anchor({ node, children, ...props }: WithNode<ComponentProps<"a">>) {
  const { plugins, interactive } = useContext(MarkdownRenderContext);
  const chip = node?.properties.dataChip;
  const href = props.href;
  if (typeof chip === "string" && typeof href === "string")
    return (
      <plugins.chip
        kind={chip}
        href={href}
        anchorProps={props}
        interactive={interactive}
      >
        {children}
      </plugins.chip>
    );
  if (!interactive) return <span>{children}</span>;
  if (typeof href !== "string" || !URL.canParse(href))
    return <span title={href}>{children}</span>;
  if (!/^https?:\/\//.test(href)) return <a {...props}>{children}</a>;
  return (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Image({ node: _node, ...props }: WithNode<ComponentProps<"img">>) {
  const { plugins } = useContext(MarkdownRenderContext);
  const video = typeof props.src === "string" ? videoUrl(props.src) : undefined;
  if (video !== undefined)
    // biome-ignore lint/a11y/useMediaCaption: agent-posted recordings carry no caption track
    return <plugins.video src={video} title={props.alt} controls />;
  return <plugins.image {...props} />;
}

function Video({ node: _node, ...props }: WithNode<ComponentProps<"video">>) {
  const { plugins } = useContext(MarkdownRenderContext);
  return <plugins.video {...props} />;
}

function Span({
  node: _node,
  children,
  ...props
}: WithNode<ComponentProps<"span">>) {
  const { plugins, interactive } = useContext(MarkdownRenderContext);
  const attributes = props as Record<string, unknown>;
  const mention = attributes["data-mention"];
  if (typeof mention === "string")
    return (
      <plugins.chip kind="mention" value={mention} interactive={interactive}>
        {children}
      </plugins.chip>
    );
  const kind = attributes["data-chip"];
  const value = attributes["data-chip-value"];
  const label = attributes["data-chip-label"];
  if (typeof kind === "string" && typeof value === "string")
    return (
      <plugins.chip
        kind={kind}
        value={value}
        label={typeof label === "string" ? label : undefined}
        interactive={interactive}
      />
    );
  return <span {...props}>{children}</span>;
}

function Table({
  node: _node,
  children,
  ...props
}: WithNode<ComponentProps<"table">>) {
  return (
    <MarkdownTable>
      <table {...props}>{children}</table>
    </MarkdownTable>
  );
}

function Details({ node, children }: WithNode<ComponentProps<"details">>) {
  return (
    <Collapsible
      defaultOpen={node?.properties.open !== undefined}
      data-markdown-disclosure=""
    >
      {children}
    </Collapsible>
  );
}

function Summary({ node, children }: WithNode<ComponentProps<"summary">>) {
  if (node?.properties.dataDisclosureTrigger !== true)
    return <span>{children}</span>;
  return (
    <CollapsibleTrigger>
      <span>{children}</span>
    </CollapsibleTrigger>
  );
}

function Div({
  node: _node,
  children,
  ...props
}: WithNode<ComponentProps<"div">>) {
  const { plugins } = useContext(MarkdownRenderContext);
  const attributes = props as Record<string, unknown>;
  if (attributes["data-disclosure-body"] !== undefined)
    return (
      <CollapsiblePanel data-markdown-disclosure-body="">
        {children}
      </CollapsiblePanel>
    );
  if (attributes["data-markdown-gallery"] !== undefined)
    return <plugins.gallery>{children}</plugins.gallery>;
  return <div {...props}>{children}</div>;
}

/** The hast element map Capy's renderer passes to hast-util-to-jsx-runtime. */
export const markdownElements = {
  pre: Pre,
  code: Code,
  a: Anchor,
  img: Image,
  video: Video,
  span: Span,
  table: Table,
  details: Details,
  summary: Summary,
  div: Div,
} as MarkdownElementComponents;

function renderParsed(tree: Root): ReactNode {
  const plain = renderTree(tree, markdownElements);
  if (!hasMath(tree)) return plain;
  return (
    <Suspense fallback={plain}>
      <MarkdownMath tree={tree} components={markdownElements} />
    </Suspense>
  );
}

export type MarkdownBlockViewProps = {
  block: MarkdownBlock;
  blockKey: string;
  lines: string;
  inline: boolean;
  options: PipelineOptions;
  plugins: MarkdownComponents;
};

/** One top-level block, memoized so streaming only re-renders the tail. */
export const MarkdownBlockView = memo(function MarkdownBlockView({
  block,
  blockKey,
  lines,
  inline,
  options,
  plugins,
}: MarkdownBlockViewProps) {
  const base = lines.split("-")[0];
  const parsed = useMemo(
    () =>
      block.mode === "code"
        ? undefined
        : parseMarkdown(block.src, {
            ...options,
            inline,
            openMath: block.mode === "live" && block.openMath,
            transforms:
              plugins.transforms.length > 0 ? plugins.transforms : undefined,
          }),
    [block, options, inline, plugins.transforms],
  );
  if (block.mode === "code" && inline)
    return <code data-markdown-inline-code="">{block.src}</code>;
  if (block.mode === "code") {
    const Fence =
      block.language === "mermaid"
        ? undefined
        : block.language
          ? plugins.fences[block.language]
          : undefined;
    return (
      <div data-markdown-block="" data-md-new={lines}>
        {block.language === "mermaid" ? (
          <plugins.mermaid text={block.src} complete={block.complete} />
        ) : Fence && block.language ? (
          <Fence
            text={block.src}
            language={block.language}
            complete={block.complete}
          />
        ) : (
          <CodeBlock
            text={block.src}
            language={block.language}
            complete={block.complete}
            blockKey={blockKey}
          />
        )}
      </div>
    );
  }
  return (
    <div data-markdown-block="" data-md-new={lines} data-md-base={base}>
      {parsed ? renderParsed(parsed) : null}
    </div>
  );
});
