export const MIN_COMPACT_AT_TOKENS = 50_000;

export const formatTokens = (tokens: number) => tokens.toLocaleString("en-US");

export const compactAtRangeError = (windowTokens: number) =>
  `Enter between ${formatTokens(MIN_COMPACT_AT_TOKENS)} and ${formatTokens(windowTokens)} tokens`;

export type CompactAtInput =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; tokens: number };

export function parseCompactAt(
  input: string,
  windowTokens: number,
): CompactAtInput {
  const text = input.replace(/,/g, "").trim();
  if (text.length === 0) return { kind: "empty" };
  const tokens = Number(text);
  if (
    !Number.isInteger(tokens) ||
    tokens < MIN_COMPACT_AT_TOKENS ||
    tokens > windowTokens
  ) {
    return { kind: "invalid", message: compactAtRangeError(windowTokens) };
  }
  return { kind: "ok", tokens };
}

export const compactAtHint = (defaultTokens: number, windowTokens: number) =>
  `Default is ${formatTokens(Math.round(defaultTokens))}, up to ${formatTokens(Math.round(windowTokens))} tokens`;
