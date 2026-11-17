import type { AnnouncementDefinition } from "@/components/release";

export type AnnouncementRow = {
  key: string;
  publishedAt: string;
  seen: boolean;
  platforms: ReadonlyArray<string>;
};

export type AnnouncementItem = AnnouncementDefinition & {
  key: string;
  publishedAt: string;
};

const asRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "object" || value === null) return [];
  const list = (value as { announcements?: unknown }).announcements;
  return Array.isArray(list) ? list : [];
};

const stringOr = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export function announcementRows(value: unknown): AnnouncementRow[] {
  return asRows(value).flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const row = entry as Record<string, unknown>;
    const key = stringOr(row.key);
    if (key === undefined) return [];
    const state =
      typeof row.state === "object" && row.state !== null
        ? (row.state as Record<string, unknown>)
        : row;
    const platforms = Array.isArray(row.platforms)
      ? row.platforms.map(String)
      : [];
    return [
      {
        key,
        publishedAt: stringOr(row.publishedAt) ?? stringOr(row.createdAt) ?? "",
        seen:
          stringOr(state.seenAt) !== undefined ||
          stringOr(row.seenAt) !== undefined,
        platforms,
      },
    ];
  });
}

export function announcementsFor(
  value: unknown,
  definitions: Readonly<Record<string, AnnouncementDefinition>>,
  dismissed: ReadonlySet<string>,
  platforms: ReadonlyArray<string>,
): AnnouncementItem[] {
  return announcementRows(value).flatMap((row) => {
    const definition = definitions[row.key];
    if (definition === undefined) return [];
    if (row.seen || dismissed.has(row.key)) return [];
    if (
      row.platforms.length > 0 &&
      !row.platforms.some((platform) => platforms.includes(platform))
    )
      return [];
    return [{ key: row.key, publishedAt: row.publishedAt, ...definition }];
  });
}
