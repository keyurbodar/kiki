import type { MemoryPageRow, MemoryScope, MemoryTopic } from "./types.ts";

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown) => (typeof value === "string" ? value : "");
const nullable = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;

const asList = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

/** The subtitle the list and detail show, taken from the memory's own body. */
const descriptionOf = (body: string) => {
  const [first = ""] = body.split(/(?<=\.)\s/);
  return first.trim();
};

const SCOPES: readonly MemoryScope[] = [
  "personal",
  "project-user",
  "project",
  "everywhere",
];

const isScope = (value: string): value is MemoryScope =>
  SCOPES.includes(value as MemoryScope);

const scopeOf = (row: Record<string, unknown>): MemoryScope => {
  const scope = text(row.scope);
  const kind = text(row.kind);
  if (isScope(scope)) return scope;
  if (kind === "project" || scope.startsWith("project")) {
    return scope.endsWith("-user") ? "project-user" : "project";
  }
  if (kind === "person" || scope === "organization") return "everywhere";
  return "personal";
};

/** One memory topic, from the volume file API or from the mock's memory row. */
export const memoryTopic = (value: unknown): MemoryTopic => {
  const row = record(value);
  const id = text(row.id);
  const body = text(row.body);
  const description = text(row.description);
  return {
    volumeId: text(row.volumeId) || id,
    path: text(row.path) || id,
    title: text(row.title),
    description: description === "" ? descriptionOf(body) : description,
    body,
    scope: scopeOf(row),
    source: nullable(row.sourceThreadId) ?? nullable(row.source),
    statedBy: nullable(row.authorId) ?? nullable(row.statedBy),
    lastConfirmed: nullable(row.updatedAt) ?? nullable(row.lastConfirmed),
    projectId: nullable(row.projectId),
    repositories: asList(row.repositories).filter(
      (entry): entry is string => typeof entry === "string",
    ),
    digest: text(row.digest),
    canWrite: row.canWrite !== false,
  };
};

/**
 * A page of memory topics. The list endpoint answers with an envelope
 * (`items`, `nextCursor`, `skipped`, `scanned`); a bare array is the whole
 * result.
 */
export const memoryPageRow = (value: unknown): MemoryPageRow => {
  if (Array.isArray(value)) {
    return {
      items: value.map(memoryTopic),
      nextCursor: null,
      skipped: 0,
      scanned: value.length,
    };
  }
  const page = record(value);
  const items = asList(page.items ?? page.entries ?? page.memories);
  return {
    items: items.map(memoryTopic),
    nextCursor: nullable(page.nextCursor),
    skipped: typeof page.skipped === "number" ? page.skipped : 0,
    scanned: typeof page.scanned === "number" ? page.scanned : items.length,
  };
};
