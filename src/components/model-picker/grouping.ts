export type ModelGrouping = "provider" | "route";

/**
 * Capy's picker remembers the axis you grouped by, and the phone drawer is the
 * same picker: one key, so a choice made at 390 is still there at 1440.
 */
export const groupingStorageKey = "capy-web:model-picker-lab:grouping";

export const isGrouping = (value: unknown): value is ModelGrouping =>
  value === "provider" || value === "route";
