import type { Mention } from "@/data/events";

/** Mention id prefix Capy gives the excerpt a reply carries. */
export const REPLY_PREFIX = "reply:";

const EXCERPT_RE =
  /<excerpt\s+source="([^"]*)"(?:\s+lang="([^"]*)")?\s*(?:\/>|>\n?([\s\S]*?)\n?<\/excerpt>)(?:\s*<comment on="excerpt">\n?([\s\S]*?)\n?<\/comment>)?/;

const escapeAttr = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

export type Excerpt = {
  source: string;
  language?: string;
  text: string;
  comment: string;
};

export function formatExcerpt(excerpt: Excerpt): string {
  const attrs = `source="${escapeAttr(excerpt.source)}"${
    excerpt.language === undefined || excerpt.language === ""
      ? ""
      : ` lang="${escapeAttr(excerpt.language)}"`
  }`;
  const body =
    excerpt.text === ""
      ? `<excerpt ${attrs} />`
      : `<excerpt ${attrs}>\n${excerpt.text}\n</excerpt>`;
  return excerpt.comment === ""
    ? body
    : `${body}\n<comment on="excerpt">\n${excerpt.comment}\n</comment>`;
}

const excerptText = (wire: string) => {
  const match = EXCERPT_RE.exec(wire);
  return match === null || match.index !== 0 ? wire : (match[3] ?? "");
};

const inlinePlain = (text: string) =>
  text
    .split(/(`+)(.+?)\1/)
    .flatMap((part, i) =>
      i % 3 === 1
        ? []
        : i % 3 === 2
          ? [part.trim()]
          : [
              part
                .replace(/<((?:https?|mailto):[^>\s]+|[^@>\s]+@[^>\s]+)>/gi, "$1")
                .replace(/<\/?[a-z][^>]*>/gi, " ")
                .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
                .replace(/!?\[([^\]]*)\]\[[^\]]*\]/g, "$1")
                .replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, "$2")
                .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "$1")
                .replace(/(^|[^\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, "$1$2")
                .replace(/(^|[^\w_])_(?=\S)(.+?)(?<=\S)_(?![\w_])/g, "$1$2")
                .replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, "$1"),
            ],
    )
    .join("");

const isTableRule = (line: string) =>
  line.includes("|") &&
  /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(line.trim());

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => inlinePlain(cell.replace(/\\\|/g, "|")));

const linePlain = (line: string) =>
  /^([-*_])(\s*\1){2,}\s*$|^=+\s*$/.test(line)
    ? ""
    : inlinePlain(
        line
          .replace(/^((#{1,6}|[-*+]|\d+[.)])\s+)?(\[[ xX]\]\s+)?/, "")
          .replace(/\s+#+\s*$/, ""),
      );

const withoutDefinitions = (text: string) =>
  text
    .split("\n")
    .filter((line) => !/^ {0,3}\[[^\]]+\]:\s/.test(line))
    .join("\n");

/** Flattens quoted markdown to one plain line, the way the reply quote shows it. */
export function quotePlainText(markdown: string): string {
  const lines = withoutDefinitions(markdown)
    .split("\n")
    .map((line) => line.replace(/^\s*(>\s?)*\s*/, ""));
  type State = { fence?: string; table: boolean; parts: string[] };
  return lines
    .reduce<State>(
      (state, line, i) => {
        const fence = /^(`{3,}|~{3,})/.exec(line)?.[1];
        if (state.fence === undefined) {
          if (fence !== undefined) return { ...state, fence, table: false };
          if (isTableRule(line)) return { ...state, table: true };
          if (line.includes("|") && (state.table || isTableRule(lines[i + 1] ?? ""))) {
            return { ...state, table: true, parts: [...state.parts, ...tableCells(line)] };
          }
          return { ...state, table: false, parts: [...state.parts, linePlain(line)] };
        }
        if (
          fence !== undefined &&
          fence[0] === state.fence[0] &&
          fence.length >= state.fence.length &&
          line.slice(fence.length).trim() === ""
        ) {
          return { ...state, fence: undefined };
        }
        return { ...state, parts: [...state.parts, line] };
      },
      { fence: undefined, table: false, parts: [] },
    )
    .parts.join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ParsedReply = {
  rowId: string;
  section: number;
  quote: string;
  text: string;
  mentions: Mention[];
};

/** Splits a reply's leading excerpt mention off the message text. */
export function parseReply(
  text: string,
  mentions: readonly Mention[],
): ParsedReply | undefined {
  const reply = mentions.find(
    (m) =>
      m.kind === "excerpt" &&
      m.id.startsWith(REPLY_PREFIX) &&
      m.start === 0 &&
      text.slice(0, m.end) === m.text,
  );
  if (reply === undefined) return undefined;
  const rest = text.slice(reply.end).replace(/^\n+/, "");
  const shift = text.length - rest.length;
  const sep = reply.id.lastIndexOf(":");
  return {
    rowId: reply.id.slice(REPLY_PREFIX.length, sep),
    section: Number(reply.id.slice(sep + 1)),
    quote: quotePlainText(excerptText(reply.text)),
    text: rest,
    mentions: mentions
      .filter((m) => m !== reply)
      .map((m) => ({ ...m, start: m.start - shift, end: m.end - shift })),
  };
}

const QUOTE_LABEL_MAX = 48;

/** Prepends a reply excerpt to an outgoing message, the inverse of parseReply. */
export function buildReply<T extends { text: string; mentions: readonly Mention[] }>(
  message: T,
  target: { eventId: string; rowId: string; section: number; text: string },
): T & { mentions: Mention[] } {
  const wire = formatExcerpt({
    source: `Reply to message ${target.eventId}, section ${target.section + 1}`,
    text: target.text,
    comment: "",
  });
  const lead = `${wire}\n\n`;
  const plain = quotePlainText(target.text);
  return {
    ...message,
    text: `${lead}${message.text}`,
    mentions: [
      {
        kind: "excerpt",
        id: `${REPLY_PREFIX}${target.rowId}:${target.section}`,
        label:
          plain.length > QUOTE_LABEL_MAX
            ? `${plain.slice(0, QUOTE_LABEL_MAX - 1)}…`
            : plain,
        start: 0,
        end: wire.length,
        text: wire,
      },
      ...message.mentions.map((m) => ({
        ...m,
        start: m.start + lead.length,
        end: m.end + lead.length,
      })),
    ],
  };
}
