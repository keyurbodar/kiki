import { lexer, type Tokens } from "marked";
import remend, { type RemendHandler } from "remend";

/**
 * Block splitting for shared/markdown, ported from Capy's render pipeline.
 * Each top-level block renders and memoizes on its own, so a streaming message
 * only re-parses its last block. While streaming, the last block is repaired
 * with remend (unclosed emphasis, links, inline code, math, tables) before it
 * is parsed, and an unclosed code fence stays a live code block.
 */

export type MarkdownBlock =
  | { mode: "full"; raw: string; src: string }
  | { mode: "live"; raw: string; src: string; openMath: boolean }
  | {
      mode: "code";
      raw: string;
      src: string;
      language: string | undefined;
      complete: boolean;
    };

const DELIMITER_ROW = /^:?-{1,}:?$/;
const FENCE_OPEN = /^[ \t]{0,3}(`{3,}|~{3,})/;

const splitCells = (row: string) => {
  const trimmed = row.trim();
  const start = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
  return (start.endsWith("|") ? start.slice(0, -1) : start)
    .split("|")
    .map((cell) => cell.trim());
};

const isDelimiterRow = (cells: string[]) =>
  cells.length > 0 &&
  cells.every((cell) => cell.length > 0 && DELIMITER_ROW.test(cell));

const quotePrefix = (line: string) => {
  const prefix = line.match(/^(\s*(?:>\s*)*)/)?.[1] ?? "";
  return { prefix, body: line.slice(prefix.length) };
};

const joinCells = (row: string, cells: string[]) => {
  const trimmed = row.trim();
  const lead = trimmed.startsWith("|");
  const trail = trimmed.endsWith("|");
  const body = cells.join(" | ");
  if (!lead && !trail) return body;
  return `${lead ? "| " : ""}${body}${trail ? " |" : ""}`;
};

/** Completes a table header's delimiter row while it streams in. */
export const stabilizeStreamingTables: RemendHandler = {
  name: "stabilize-streaming-tables",
  priority: 90,
  handle: (text) => {
    const lines = text.split("\n");
    let fence: string | null = null;
    let fenceLength = 0;
    for (let i = 0; i < lines.length - 1; i += 1) {
      const open = FENCE_OPEN.exec(lines[i] ?? "");
      if (fence !== null) {
        const marker = open?.[1] ?? "";
        if (open && marker[0] === fence && marker.length >= fenceLength) {
          fence = null;
          fenceLength = 0;
        }
        continue;
      }
      if (open) {
        const marker = open[1] ?? "";
        fence = marker[0] ?? null;
        fenceLength = marker.length;
        continue;
      }
      const header = lines[i];
      const next = lines[i + 1];
      if (!header || next === undefined) continue;
      const head = quotePrefix(header);
      const delim = quotePrefix(next);
      if (
        /^[ \t|:-]*$/.test(delim.body) &&
        (delim.body === "" || head.prefix === delim.prefix) &&
        head.prefix.startsWith(delim.prefix.trimEnd()) &&
        i + 1 === lines.length - 1
      ) {
        const headCells = splitCells(head.body);
        const delimCells = splitCells(delim.body).filter((c) => c.length > 0);
        if (
          head.body.trim().startsWith("|") &&
          head.body.trim().endsWith("|") &&
          headCells.length >= 2 &&
          (i === 0 || lines[i - 1] === "") &&
          (!isDelimiterRow(delimCells) || delimCells.length < headCells.length)
        ) {
          lines[i + 1] = `${head.prefix}${joinCells(
            head.body,
            headCells.map(() => "---"),
          )}`;
        }
        continue;
      }
      if (
        !next ||
        head.prefix !== delim.prefix ||
        !head.body.includes("|") ||
        !delim.body.includes("|")
      )
        continue;
      const headCells = splitCells(head.body);
      const delimCells = splitCells(delim.body);
      if (
        headCells.length < 2 ||
        !isDelimiterRow(delimCells) ||
        delimCells.length >= headCells.length
      )
        continue;
      const filled = [
        ...delimCells,
        ...Array.from(
          { length: headCells.length - delimCells.length },
          () => "---",
        ),
      ];
      lines[i + 1] = `${delim.prefix}${joinCells(delim.body, filled)}`;
    }
    return lines.join("\n");
  },
};

const hasReferenceDefinition = (text: string) =>
  text.includes("]:") &&
  /^[ \t]{0,3}\[[^\]]+\]:[ \t]*(?:\S+|\r?\n[ \t]+\S+)/m.test(text);

const hasFootnote = (text: string) => /\[\^[\w-]{1,200}\]/.test(text);

/** Number of `$$` delimiters outside inline code. */
export const countDisplayMath = (text: string) => {
  const stripped = text.replace(/`[^`\n]*`/g, "").replace(/\\\$/g, "");
  let count = 0;
  for (let i = 0; i < stripped.length - 1; i += 1) {
    if (stripped[i] === "$" && stripped[i + 1] === "$") {
      count += 1;
      i += 1;
    }
  }
  return count;
};

const openDetails = (text: string) => {
  const stripped = text
    .replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1[ \t]*$/gm, "")
    .replace(/`[^`\n]*`/g, "");
  return (
    (stripped.match(/<details(?:\s[^>]*)?>/gi)?.length ?? 0) -
    (stripped.match(/<\/details\s*>/gi)?.length ?? 0)
  );
};

const hasOpenMath = (block: MarkdownBlock | undefined) =>
  block?.mode === "full" && countDisplayMath(block.raw) % 2 === 1;

const hasOpenDetails = (block: MarkdownBlock | undefined) =>
  block?.mode === "full" && openDetails(block.raw) > 0;

const fenceLanguage = (lang: string | undefined) =>
  lang?.trim().split(/\s+/, 1)[0] || undefined;

const withoutFirstLine = (text: string) => {
  const index = text.indexOf("\n");
  return index < 0 ? "" : text.slice(index + 1);
};

/** True when a fenced code token has no closing fence yet. */
export const isFenceOpen = (raw: string) => {
  const marker = raw.match(FENCE_OPEN)?.[1];
  if (!marker) return false;
  const lines = raw.trimEnd().split("\n");
  return (
    lines.length < 2 ||
    !new RegExp(`^ {0,3}${marker[0]}{${marker.length},}[\\t ]*$`).test(
      lines.at(-1) ?? "",
    )
  );
};

/** Repairs the live tail of a streaming message so it parses as intended. */
export const repairStreaming = (raw: string): MarkdownBlock => ({
  mode: "live",
  raw,
  src:
    remend(raw, {
      linkMode: "text-only",
      handlers: [stabilizeStreamingTables],
    }) + "\n</details>".repeat(Math.max(openDetails(raw), 0)),
  openMath: countDisplayMath(raw) % 2 === 1,
});

export function splitBlocks(text: string, streaming: boolean): MarkdownBlock[] {
  if (hasReferenceDefinition(text) || hasFootnote(text))
    return streaming
      ? [repairStreaming(text)]
      : [{ mode: "full", raw: text, src: text }];
  const tokens = lexer(text);
  const lastIndex = streaming
    ? tokens.findLastIndex((token) => token.type !== "space")
    : tokens.length;
  if (streaming && lastIndex < 0) return [repairStreaming(text)];
  const blocks: MarkdownBlock[] = [];
  for (let i = 0; i < lastIndex; i += 1) {
    const token = tokens[i];
    if (!token || token.type === "space") continue;
    let raw = token.raw;
    while (tokens[i + 1]?.type === "space" && i + 1 < lastIndex) {
      i += 1;
      raw += tokens[i]?.raw ?? "";
    }
    const previous = blocks.at(-1);
    if (previous && (hasOpenMath(previous) || hasOpenDetails(previous))) {
      previous.raw += raw;
      previous.src = previous.raw;
    } else if (token.type === "code") {
      const code = token as Tokens.Code;
      blocks.push({
        mode: "code",
        raw,
        src: code.text,
        language: fenceLanguage(code.lang),
        complete: true,
      });
    } else {
      blocks.push({ mode: "full", raw, src: raw });
    }
  }
  const last = tokens[lastIndex];
  if (!streaming || !last) return blocks;
  let tail = tokens
    .slice(lastIndex)
    .map((token) => token.raw)
    .join("");
  const previous = blocks.at(-1);
  if (hasOpenMath(previous) || hasOpenDetails(previous)) {
    blocks.pop();
    tail = (previous?.raw ?? "") + tail;
    return [...blocks, repairStreaming(tail)];
  }
  if (last.type !== "code") return [...blocks, repairStreaming(tail)];
  const code = last as Tokens.Code;
  const language = fenceLanguage(code.lang);
  return isFenceOpen(code.raw)
    ? [
        ...blocks,
        {
          mode: "code",
          raw: tail,
          src: withoutFirstLine(code.raw),
          language,
          complete: false,
        },
      ]
    : [
        ...blocks,
        { mode: "code", raw: tail, src: code.text, language, complete: true },
      ];
}

/** "start-end" source line range of each block, 1-based. */
export function blockLines(text: string, blocks: MarkdownBlock[]): string[] {
  const countLines = (s: string) => s.split("\n").length - 1;
  let offset = 0;
  let line = 1;
  return blocks.map((block) => {
    const found = text.indexOf(block.raw, offset);
    const start = found === -1 ? offset : found;
    line += countLines(text.slice(offset, start));
    const first = line;
    line += countLines(block.raw);
    offset = start + block.raw.length;
    return `${first}-${first + countLines(block.raw.trimEnd())}`;
  });
}

const IMAGE_LINE = /^(?:\s*!\[[^\]\n]*\]\([^)\n]*\))+\s*$/;

const splitImageRuns = (block: MarkdownBlock): MarkdownBlock[] | undefined => {
  if (block.mode !== "full" || !block.raw.includes("\n![")) return;
  const tokens = lexer(block.raw).filter((t) => t.type !== "space");
  const paragraph = tokens[0];
  if (tokens.length !== 1 || paragraph?.type !== "paragraph") return;
  const runs = (
    block.raw.match(/[^\n]*\n?/g)?.filter((l) => l !== "") ?? []
  ).reduce<{ raw: string; images: boolean }[]>((acc, line) => {
    const images = IMAGE_LINE.test(line);
    const last = acc.at(-1);
    if (last?.images === images) last.raw += line;
    else acc.push({ raw: line, images });
    return acc;
  }, []);
  if (runs.length < 2 || runs[0]?.images) return;
  const imageCount = runs
    .filter((run) => run.images)
    .reduce((sum, run) => sum + run.raw.split("![").length - 1, 0);
  const paragraphImages = (paragraph as Tokens.Paragraph).tokens.filter(
    (t) => t.type === "image",
  ).length;
  if (
    paragraphImages !== imageCount ||
    runs
      .filter((run) => !run.images)
      .some((run) =>
        lexer(run.raw)
          .filter((t) => t.type !== "space")
          .some((t) => t.type !== "paragraph"),
      )
  )
    return;
  return runs.map((run) => ({
    mode: "full",
    raw: run.raw,
    src: run.images ? run.raw : run.raw.replace(/(?: {2,}|\\)(\n?)$/, "$1"),
  }));
};

export type KeyedBlock = {
  block: MarkdownBlock;
  key: number;
  gallery: boolean;
};

/**
 * Gives each block a stable key and, with galleries on, merges consecutive
 * image-only paragraphs into one gallery block.
 */
export function keyBlocks(
  blocks: MarkdownBlock[],
  gallery: boolean,
): KeyedBlock[] {
  return blocks
    .flatMap((block, index) => {
      const runs = gallery ? splitImageRuns(block) : undefined;
      return runs === undefined
        ? [{ block, key: index }]
        : runs.map((run, i) => ({ block: run, key: index + i / runs.length }));
    })
    .reduce<KeyedBlock[]>((acc, { block, key }) => {
      const images =
        gallery && block.mode === "full" && IMAGE_LINE.test(block.src);
      const last = acc.at(-1);
      if (images && last?.gallery) {
        const raw = last.block.raw + block.raw;
        acc[acc.length - 1] = {
          ...last,
          block: { ...last.block, raw, src: raw } as MarkdownBlock,
        };
        return acc;
      }
      acc.push({ block, key, gallery: images });
      return acc;
    }, []);
}
