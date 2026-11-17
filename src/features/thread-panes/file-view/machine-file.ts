import {
  type FileContent,
  fileName,
  mediaKind,
  shouldGate,
} from "@/components/file-view";

export type MachineFileBlob = {
  content?: string;
  base64?: string;
  mediaType?: string;
  binary?: boolean;
  truncated?: boolean;
  sizeBytes?: number;
};

export type MachineFileRead = {
  content: MachineFileBlob | null;
  sha?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optional = <T>(value: unknown, guard: (value: unknown) => value is T) =>
  guard(value) ? value : undefined;

const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function decodeMachineFile(value: unknown): MachineFileRead | undefined {
  if (!isRecord(value) || !("content" in value)) return undefined;
  const sha = optional(value.sha, isString);
  if (value.content === null) return { content: null, sha };
  if (!isRecord(value.content)) return undefined;
  const blob = value.content;
  return {
    content: {
      content: optional(blob.content, isString),
      base64: optional(blob.base64, isString),
      mediaType: optional(blob.mediaType, isString),
      binary: optional(blob.binary, isBoolean),
      truncated: optional(blob.truncated, isBoolean),
      sizeBytes: optional(blob.sizeBytes, isNumber),
    },
    sha,
  };
}

export function contentFromBlob(
  blob: MachineFileBlob,
  sizeBytes: number,
  symlink: boolean,
  label: string,
): FileContent {
  if (symlink) return { kind: "symlink", target: blob.content ?? "" };
  const media =
    blob.base64 === undefined
      ? undefined
      : blob.mediaType?.startsWith("image/") === true
        ? "image"
        : blob.mediaType === "application/pdf"
          ? "pdf"
          : undefined;
  if (media === undefined)
    return blob.binary === true
      ? { kind: "no_preview" }
      : {
          kind: "text",
          text: blob.content ?? "",
          truncatedFrom: blob.truncated === true ? sizeBytes : undefined,
        };
  return {
    kind: "media",
    media,
    url: `data:${blob.mediaType};base64,${blob.base64}`,
    label,
  };
}

export const machineFileGated = (path: string, blob: MachineFileBlob) => {
  const name = fileName(path);
  return shouldGate(
    name,
    blob.sizeBytes ?? 0,
    mediaKind({ name, mediaType: blob.mediaType ?? "" }),
  );
};

export function machineFileMiss(path: string, device: boolean) {
  const foreign = device
    ? /^\/(?:workspace|home\/user)\//.test(path)
    : /^(?:[A-Za-z]:[\\/]|\\\\|\/Users\/)/.test(path);
  return foreign
    ? {
        line: "File is on another machine",
        sub: device
          ? "This path is from the cloud machine this thread used before"
          : "This path is from a device this thread used before",
      }
    : {
        line: "File isn't on this machine",
        sub: "It was deleted, moved, or written on another machine",
      };
}
