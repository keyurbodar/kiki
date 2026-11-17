const charsPerToken = 4;

/** Capy's token estimate for a character count. */
export const tokensOf = (chars: number) => Math.round(chars / charsPerToken);

/** Capy's compact token count: 950, 1.2k, 25k, 1.5M. */
export const formatTokens = (count: number) =>
  count >= 1e6
    ? `${Number((count / 1e6).toFixed(1))}M`
    : count >= 1e4
      ? `${Math.round(count / 1e3)}k`
      : count >= 1e3
        ? `${Number((count / 1e3).toFixed(1))}k`
        : String(count);

/** Percent of the context window the tokens take. */
export const windowShare = (tokens: number, contextWindow: number) =>
  contextWindow === 0 ? 0 : (tokens / contextWindow) * 100;
