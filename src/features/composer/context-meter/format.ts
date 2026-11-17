import type { ContextUsage } from "@/data/events/events";

export type ContextSegmentKey = NonNullable<
  ContextUsage["segments"]
>[number]["key"];

export type MeterTone =
  | "primary"
  | "neutral"
  | "warning"
  | "danger"
  | "success"
  | "info"
  | "purple"
  | "orange"
  | "pink";

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Capy's token count format: exact under 1,000, compact above (48.2K). */
export const formatTokens = (tokens: number) =>
  tokens < 1e3 ? `${tokens}` : compactFormat.format(tokens);

export const contextRingRadius = 6;
export const contextRingCircumference = 2 * Math.PI * contextRingRadius;

export const usedFraction = (usage: {
  usedTokens: number;
  budgetTokens: number;
}) =>
  usage.budgetTokens > 0
    ? Math.min(usage.usedTokens / usage.budgetTokens, 1)
    : 0;

export type UsageLevel = "neutral" | "warning" | "danger";

export const usageLevel = (fraction: number): UsageLevel =>
  fraction >= 1 ? "danger" : fraction >= 0.9 ? "warning" : "neutral";

export const segmentTone: Record<ContextSegmentKey, MeterTone> = {
  system: "neutral",
  tools: "purple",
  rules: "success",
  skills: "orange",
  mcp: "pink",
  environment: "info",
  conversation: "primary",
};

export const segmentLabel: Record<ContextSegmentKey, string> = {
  system: "System prompt",
  tools: "Native tools",
  rules: "Rules",
  skills: "Skills",
  mcp: "Codemode catalog",
  environment: "Environment",
  conversation: "Conversation",
};

export type MeterSegment = { fraction: number; tone: MeterTone };

/** Segments for the bar: one per breakdown key, or a single level-toned fill. */
export const meterSegments = (
  usage: Pick<ContextUsage, "usedTokens" | "budgetTokens" | "segments">,
): MeterSegment[] => {
  const fraction = usedFraction(usage);
  if (usage.segments === undefined || usage.segments.length === 0)
    return [{ fraction, tone: usageLevel(fraction) }];
  return usage.segments.map((segment) => ({
    fraction: usage.budgetTokens > 0 ? segment.tokens / usage.budgetTokens : 0,
    tone: segmentTone[segment.key],
  }));
};

/** Clamps segments so they never overflow the track, in order. */
export const layoutSegments = (segments: ReadonlyArray<MeterSegment>) => {
  let remaining = 1;
  return segments.map((segment) => {
    const width = Math.max(0, Math.min(remaining, segment.fraction));
    remaining -= width;
    return { width, tone: segment.tone };
  });
};
