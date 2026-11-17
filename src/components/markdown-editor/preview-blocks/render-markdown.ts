import "katex/dist/katex.min.css";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, {
  defaultSchema,
  type Options as SanitizeSchema,
} from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export const PREVIEW_SANITIZE_SCHEMA: SanitizeSchema = {
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

const pipeline = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath, { singleDollarTextMath: false })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, PREVIEW_SANITIZE_SCHEMA)
  .use(rehypeKatex)
  .freeze();

export const renderMarkdown = (source: string): ReactNode =>
  toJsxRuntime(pipeline.runSync(pipeline.parse(source)), {
    Fragment,
    jsx,
    jsxs,
  });
