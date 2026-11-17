export type SearchParams<Key extends string> = { [K in Key]?: string };

export function searchParams<const Key extends string>(keys: readonly Key[]) {
  return (search: Record<string, unknown>): SearchParams<Key> => {
    const parsed: SearchParams<Key> = {};
    for (const key of keys) {
      const value = search[key];
      if (value === undefined || value === null) continue;
      parsed[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
    return parsed;
  };
}
