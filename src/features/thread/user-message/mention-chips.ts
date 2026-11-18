import type { Element, ElementContent, Root } from "hast";
import type { ChipMention } from "@/components/markdown-chips";
import type { Mention } from "@/data/events";

/**
 * A message's composer mentions, rendered as chips inside its text.
 *
 * The stored text carries the mention's own characters, and the mention list
 * carries their ranges. Each range is swapped for an inert placeholder so the
 * markdown parser leaves it alone, then `mentionTransform` turns the
 * placeholder back into the chip span Capy's renderer paints.
 */

/**
 * Private-use markers, not control characters: CommonMark rewrites NUL to
 * U+FFFD while parsing, so a NUL placeholder never survives to the transform.
 */
const OPEN = "\ue000m";
const CLOSE = "\ue001";
const placeholder = /\ue000m(\d+)\ue001/g;

export type MentionChips = {
  /** The message text with each mention range replaced by its placeholder. */
  text: string;
  /** Chip label per placeholder index, painted as the chip's children. */
  labels: ReadonlyArray<string>;
  /** The chip each placeholder resolves through, keyed by placeholder index. */
  mentions: ReadonlyMap<number, ChipMention>;
};

const chipMention = (mention: Mention): ChipMention | undefined => {
  switch (mention.kind) {
    case "secret":
      return {
        kind: "secret",
        id: mention.id,
        label: mention.label,
        text: mention.text,
      };
    case "skill":
    case "device":
    case "slack_channel":
    case "user":
    case "file":
    case "task":
    case "thread":
    case "pr":
      return { kind: mention.kind, id: mention.id, label: mention.label };
    case "excerpt":
      return undefined;
  }
};

export const mentionChips = (
  text: string,
  mentions: ReadonlyArray<Mention>,
): MentionChips => {
  const ranges = mentions
    .flatMap((mention) => {
      const chip = chipMention(mention);
      return chip === undefined ? [] : [{ mention, chip }];
    })
    .filter(
      ({ mention }) =>
        mention.start >= 0 &&
        mention.end <= text.length &&
        mention.end > mention.start,
    )
    .toSorted((a, b) => a.mention.start - b.mention.start);
  const labels: string[] = [];
  const map = new Map<number, ChipMention>();
  let out = "";
  let cursor = 0;
  for (const { mention, chip } of ranges) {
    if (mention.start < cursor) continue;
    out += text.slice(cursor, mention.start);
    out += `${OPEN}${labels.length}${CLOSE}`;
    labels.push(text.slice(mention.start, mention.end));
    map.set(labels.length - 1, chip);
    cursor = mention.end;
  }
  out += text.slice(cursor);
  return { text: out, labels, mentions: map };
};

const chipSpan = (index: number, label: string): Element => ({
  type: "element",
  tagName: "span",
  properties: { dataMention: String(index) },
  children: [{ type: "text", value: label }],
});

/** Replaces each placeholder text run with the mention's chip span. */
export const mentionTransform =
  (chips: MentionChips) =>
  (tree: Root): void => {
    if (chips.labels.length === 0) return;
    const walk = (parent: Root | Element) => {
      const children: ElementContent[] = [];
      for (const child of parent.children) {
        if (child.type === "element") walk(child);
        if (child.type !== "text" || !child.value.includes(OPEN)) {
          children.push(child as ElementContent);
          continue;
        }
        let cursor = 0;
        placeholder.lastIndex = 0;
        for (const match of child.value.matchAll(placeholder)) {
          const index = Number(match[1]);
          const label = chips.labels[index];
          if (label === undefined) continue;
          const start = match.index ?? 0;
          if (start > cursor)
            children.push({
              type: "text",
              value: child.value.slice(cursor, start),
            });
          children.push(chipSpan(index, label));
          cursor = start + match[0].length;
        }
        if (cursor < child.value.length)
          children.push({ type: "text", value: child.value.slice(cursor) });
      }
      parent.children = children as typeof parent.children;
    };
    walk(tree);
  };
