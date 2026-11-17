export const matchesQuery = (
  query: string,
  ...fields: ReadonlyArray<string | null | undefined>
) => {
  const needle = query.trim().toLowerCase();
  return (
    needle === "" ||
    fields.some((field) => field?.toLowerCase().includes(needle) === true)
  );
};

export const visibleEntries = <A>(
  entries: ReadonlyArray<A>,
  page: number,
  pageSize: number | undefined,
): { visible: ReadonlyArray<A>; hasMore: boolean } => {
  if (pageSize === undefined) return { visible: entries, hasMore: false };
  const limit = page * pageSize;
  return {
    visible: entries.slice(0, limit),
    hasMore: entries.length > limit,
  };
};

export const entriesEmptyText = (label: string, query: string) =>
  query.trim() === "" ? `No ${label.toLowerCase()}` : "No matches";

export const untitledThread = "Untitled thread";
