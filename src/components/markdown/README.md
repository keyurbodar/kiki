# markdown

Capy's `shared/markdown` renderer (WP B6). One `<Markdown text=… />` renders agent messages, PR and issue bodies and drive previews, including while a message is still streaming.

## Pipeline

1. `blocks.ts` splits the source into top-level blocks with marked's lexer, as Capy does, so each block parses and memoizes on its own. While `streaming`, the last block is repaired with remend (unclosed emphasis, inline code, links as text, `$$`, open `<details>`, half-typed table headers) and an unclosed code fence stays a live code block. With `gallery`, runs of image-only paragraphs merge into one block.
2. `pipeline.ts` parses a block: remark-parse, remark-gfm (no single-tilde strikethrough), remark-math (display `$$` only), remark-rehype with raw HTML, rehype-raw and rehype-sanitize with Capy's schema. Then the hast passes: soft breaks (`breaks`), video paragraphs, galleries, plug-in `transforms`, `<details>` disclosures and pending math for an unclosed `$$`. Parsed trees are cached (LRU, 200 entries).
3. `render.tsx` turns hast into React with hast-util-to-jsx-runtime and Capy's element map: `pre` (code blocks, mermaid, custom fences, pending math), `code`, `a` (chips, non-interactive text, new-tab web links), `img`/`video`, `span` (chips, mentions), `table` (`markdown-table`), `details`/`summary` (Collapsible) and `div` (disclosure bodies, galleries). Blocks containing math render plain first and swap in KaTeX from the lazy `math.tsx` chunk.
4. `code-block.tsx` is `shared/markdown/code-block`: `markdown-code-header` with `markdown-code-language`, the wrap toggle (persisted under `capy-web:code-wrap`) and the copy button, over a body highlighted by shiki in a worker (`shiki.worker.ts`) with Capy's `capy-light`/`capy-dark` themes from `src/tokens/code-themes.ts`. Tokens carry `--shiki-light`/`--shiki-dark` and `markdown.css` picks one per mode. Without workers (tests) code stays plain text.

Styles in `markdown.css` are Capy's stylesheet rules; their raw values are tokens in `src/tokens/markdown.css`.

## Plug-in points

`MarkdownComponents` (in `components.tsx`) is how sibling packages plug in:

| key          | renders                                                        | owner                        |
| ------------ | -------------------------------------------------------------- | ---------------------------- |
| `mermaid`    | ````mermaid` fences (`{ text, complete }`)                     | mermaid unit                 |
| `fences`     | other fence languages by name (`{ text, language, complete }`) | visual unit, if it needs one |
| `gallery`    | image runs when `gallery` is on                                | gallery unit                 |
| `video`      | video paragraphs and video image links                         | video unit                   |
| `image`      | every other image                                              | lightbox unit                |
| `chip`       | anchors and spans with `data-chip` / `data-mention`            | markdown-chips               |
| `transforms` | hast passes run on each block (chip detection)                 | markdown-chips               |

Swap your own line in `defaultMarkdownComponents`, or scope an override with `<MarkdownComponentsProvider value={…}>`.

## Props

`text`, `streaming`, `tone` (`muted`), `variant` (`inline`), `size` (`sm`, `xs`, `inherit`), `weight` (`medium`), `interactive` (default true), `breaks`, `literalHtml`, `gallery`, plus any div prop. Without `text`, `Markdown` renders its children as a plain div.

## Not yet ported

Capy's paced reveal and fade-in of streamed text, Slack mention tokens, diff rendering of markdown (`data-md-*` change regions), file-path and drive-link resolution, and `summary` scroll anchoring.
