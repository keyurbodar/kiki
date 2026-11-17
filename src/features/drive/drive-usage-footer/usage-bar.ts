import type { DriveStorage } from "@/data/api/schemas/drive";
import { formatBytes, formatUsedStorage } from "@/features/drive/lib/format";

export type DriveUsageFacts = Pick<DriveStorage, "usedBytes" | "limitBytes">;

export interface DriveUsageSegment {
  readonly key: string;
  readonly bytes: number;
}

export const usageFills = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
] as const;

export const fullUsageFills = [
  "bg-destructive",
  "bg-destructive/60",
  "bg-destructive",
  "bg-destructive/60",
  "bg-destructive/80",
] as const;

export const minimumSegmentShare = 0.004;

/** How Capy's usage footer lays out the storage bar for one drive. */
export function usageBar(
  facts: DriveUsageFacts,
  segments: ReadonlyArray<DriveUsageSegment>,
) {
  const ratio = facts.limitBytes === 0 ? 1 : facts.usedBytes / facts.limitBytes;
  const full = ratio >= 1;
  const nearlyFull = ratio >= 0.9;
  const denominator =
    facts.limitBytes === 0 ? facts.usedBytes || 1 : facts.limitBytes;
  const visible = segments.filter(
    (segment) => segment.bytes / denominator >= minimumSegmentShare,
  );
  const segmentBytes = visible.reduce((sum, segment) => sum + segment.bytes, 0);
  const scale =
    segmentBytes > facts.usedBytes ? facts.usedBytes / segmentBytes : 1;
  const restBytes = Math.max(0, facts.usedBytes - segmentBytes * scale);
  const width = (bytes: number) =>
    `${Math.min(100, (bytes / denominator) * 100)}%`;
  return {
    full,
    nearlyFull,
    visible,
    scale,
    restBytes,
    width,
    label: `${formatUsedStorage(facts.usedBytes, full)} of ${formatBytes(facts.limitBytes)}`,
  };
}

export const segmentFill = (index: number, full: boolean) =>
  full
    ? fullUsageFills[index % fullUsageFills.length]
    : (usageFills[index] ?? "bg-chart-other");
