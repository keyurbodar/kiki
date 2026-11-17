import type {
  CatalogEntry,
  CompactAtEntry,
  ModelsRouting,
  ModelsSettings,
} from "./types.ts";

const dateKeys = new Set([
  "exhaustedUntil",
  "expiresAt",
  "resetsAt",
  "checkedAt",
  "at",
  "until",
]);

const revive = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(revive);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, field]) => {
      if (field === null) return [];
      if (dateKeys.has(key) && typeof field === "string")
        return [[key, new Date(field)]];
      return [[key, revive(field)]];
    }),
  );
};

const listOf = <A>(raw: unknown, key: string): ReadonlyArray<A> => {
  const value = revive(raw);
  if (Array.isArray(value)) return value as ReadonlyArray<A>;
  if (value !== null && typeof value === "object" && key in value)
    return (value as Record<string, ReadonlyArray<A>>)[key] ?? [];
  return [];
};

export const decodeRouting = (raw: unknown) => revive(raw) as ModelsRouting;

export const decodeSettings = (raw: unknown) =>
  (revive(raw) ?? {}) as ModelsSettings;

export const decodeCatalog = (raw: unknown) =>
  listOf<CatalogEntry>(raw, "models");

export const decodeCompactAt = (raw: unknown) =>
  listOf<CompactAtEntry>(raw, "models");
