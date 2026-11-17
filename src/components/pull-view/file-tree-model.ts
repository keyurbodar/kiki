export type DiffFile = {
  readonly path: string;
  readonly status: string;
  readonly additions: number;
  readonly deletions: number;
};

type Json = Readonly<Record<string, unknown>>;

export const toDiffFiles = (value: unknown): ReadonlyArray<DiffFile> => {
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Json;
  const files = Array.isArray(raw.files) ? raw.files : [];
  return files.flatMap((item: unknown) => {
    const file = (
      typeof item === "object" && item !== null ? item : {}
    ) as Json;
    if (typeof file.path !== "string") return [];
    return [
      {
        path: file.path,
        status: typeof file.status === "string" ? file.status : "modified",
        additions: typeof file.additions === "number" ? file.additions : 0,
        deletions: typeof file.deletions === "number" ? file.deletions : 0,
      },
    ];
  });
};
