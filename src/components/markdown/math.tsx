import "katex/dist/katex.min.css";
import type { Root } from "hast";
import { useMemo } from "react";
import rehypeKatex from "rehype-katex";
import { unified } from "unified";
import { type MarkdownElementComponents, renderTree } from "./render";

const typesetter = unified().use(rehypeKatex, {
  errorColor: "var(--destructive)",
});

/** Lazily loaded: typesets a block's math with KaTeX, then renders it. */
export default function MarkdownMath({
  tree,
  components,
}: {
  tree: Root;
  components: MarkdownElementComponents;
}) {
  return useMemo(() => {
    const copy = structuredClone(tree);
    typesetter.runSync(copy);
    return renderTree(copy, components);
  }, [tree, components]);
}
