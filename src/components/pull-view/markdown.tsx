import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { type ComponentProps, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);

const components = {
  p: (props: ComponentProps<"p">) => (
    <p className="my-2 first:mt-0 last:mb-0" {...props} />
  ),
  a: (props: ComponentProps<"a">) => (
    <a
      className="text-primary-text underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="my-2 list-disc pl-5 first:mt-0 last:mb-0" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="my-2 list-decimal pl-5 first:mt-0 last:mb-0" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li className="my-0.5" {...props} />,
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="rounded bg-secondary px-1 py-0.5 font-mono text-xs not-in-[pre]:whitespace-break-spaces"
      {...props}
    />
  ),
  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="my-2 overflow-x-auto rounded-(--radius-card) border-hairline border-border-1 bg-card p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  h1: (props: ComponentProps<"h1">) => (
    <h1 className="mt-4 mb-2 text-lg font-medium first:mt-0" {...props} />
  ),
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="mt-4 mb-2 text-base font-medium first:mt-0" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-3 mb-1.5 text-sm font-medium first:mt-0" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="my-2 border-l-hairline border-border-2 pl-3 text-muted-foreground-1"
      {...props}
    />
  ),
  hr: () => <hr className="my-3 border-border-1" />,
};

export type PullMarkdownProps = { text: string; className?: string };

export function PullMarkdown({ text, className }: PullMarkdownProps) {
  const content = useMemo(() => {
    const tree = processor.runSync(processor.parse(text));
    return toJsxRuntime(tree, { Fragment, jsx, jsxs, components });
  }, [text]);
  return (
    <div
      data-slot="pull-markdown"
      className={["min-w-0 text-sm text-foreground wrap-break-word", className]
        .filter(Boolean)
        .join(" ")}
    >
      {content}
    </div>
  );
}
