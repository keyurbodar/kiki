export type ViewedFiles = {
  headSha: string | null;
  paths: ReadonlySet<string>;
};

type Fields = Readonly<Record<string, unknown>>;

const fieldsOf = (value: unknown): Fields | null =>
  typeof value === "object" && value !== null ? (value as Fields) : null;

export const normalizeViewedFiles = (value: unknown): ViewedFiles => {
  if (Array.isArray(value)) {
    const paths = value.flatMap((entry) => {
      const raw = fieldsOf(entry);
      return raw !== null && raw.viewed === true && typeof raw.path === "string"
        ? [raw.path]
        : [];
    });
    return { headSha: null, paths: new Set(paths) };
  }
  const raw = fieldsOf(value);
  const paths = Array.isArray(raw?.paths)
    ? raw.paths.filter((path): path is string => typeof path === "string")
    : [];
  return {
    headSha: typeof raw?.headSha === "string" ? raw.headSha : null,
    paths: new Set(paths),
  };
};

export const viewedPathsFor = (viewed: ViewedFiles, headSha: string) =>
  viewed.headSha === null || viewed.headSha === headSha ? viewed.paths : null;

export type PendingReview = { id: number; value: boolean; written: boolean };

export const settlePending = (
  pending: PendingReview | null,
  stored: boolean | null,
  waiting: boolean,
) =>
  pending !== null &&
  (stored === pending.value || (pending.written && !waiting))
    ? null
    : pending;
