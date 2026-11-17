import type { DriveEntry, FileContent, MachineFile } from "./logic";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const record = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const text = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const parseFileContent = (value: unknown): FileContent | null => {
  if (value === null) return null;
  const content = record(value);
  return {
    content: text(content.content),
    contentBase64: text(content.base64) ?? text(content.contentBase64),
    binary: content.binary === true,
    truncated: content.truncated === true,
    sizeBytes: number(content.sizeBytes ?? content.size),
    mediaType: text(content.mediaType) ?? "",
  };
};

/** Decodes files.read; a missing or unusable content block renders the miss state. */
export const parseMachineFile = (value: unknown): MachineFile => {
  const file = record(value);
  return {
    path: text(file.path) ?? "",
    sha: text(file.sha) ?? text(file.oid) ?? null,
    content: parseFileContent(file.content),
  };
};

export const parseDriveEntries = (value: unknown): DriveEntry[] => {
  const root = record(value);
  const items = Array.isArray(root.items) ? root.items : [];
  return items.flatMap((item) => {
    const entry = record(item);
    const path = text(entry.path);
    return path === undefined ? [] : [{ path }];
  });
};

export const parseWriteResult = (value: unknown): string | undefined => {
  const result = record(value);
  return text(result.sha) ?? text(result.oid);
};
