export const ARCHIVE_BROWSE_LIMIT = 64 * 1024 * 1024;
export const ARCHIVE_GATE_BYTES = 1_000_000;
export const ARCHIVE_MAX_ENTRIES = 10_000;
export const ARCHIVE_MEMBER_LIMIT = 32 * 1024 * 1024;

const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const LOCAL_FILE_HEADER = 0x04034b50;
const STORED = 0;
const DEFLATED = 8;
const ZIP64_MARKER = 0xffffffff;

export type ArchiveMember = {
  path: string;
  sizeBytes: number;
  compressedBytes: number;
  method: number;
  offset: number;
  unavailable?: string;
};

export type ZipDirectory =
  | { members: ArchiveMember[]; refused?: undefined }
  | { refused: string; members?: undefined };

export const isZipFile = (file: { name: string; mediaType: string }) =>
  /\.zip$/i.test(file.name) ||
  file.mediaType === "application/zip" ||
  file.mediaType === "application/x-zip-compressed";

export function memberProblem(
  path: string,
  flags: number,
  method: number,
  sizeBytes: number,
  compressedBytes: number,
  offset: number,
): string | undefined {
  if (path.includes("\0")) return "Path contains a NUL byte";
  if (/^(?:[\\/]|[A-Za-z]:)/.test(path)) return "Absolute path";
  if (path.split(/[\\/]/).includes("..")) return "Path escapes the archive";
  if (
    sizeBytes === ZIP64_MARKER ||
    compressedBytes === ZIP64_MARKER ||
    offset === ZIP64_MARKER
  )
    return "Zip64 members are not supported";
  if (flags & 1) return "Encrypted";
  if (method !== STORED && method !== DEFLATED)
    return `Unsupported compression method ${method}`;
  if (sizeBytes > ARCHIVE_MEMBER_LIMIT) return "Larger than 32 MB";
  return undefined;
}

export function readZipDirectory(bytes: Uint8Array): ZipDirectory {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floor = Math.max(0, bytes.byteLength - 22 - 65535);
  let end = -1;
  for (let index = bytes.byteLength - 22; index >= floor; index -= 1) {
    if (view.getUint32(index, true) === END_OF_CENTRAL_DIRECTORY) {
      end = index;
      break;
    }
  }
  if (end === -1) return { refused: "Not a zip archive" };
  const count = view.getUint16(end + 10, true);
  const size = view.getUint32(end + 12, true);
  const start = view.getUint32(end + 16, true);
  if (count === 0xffff || size === ZIP64_MARKER || start === ZIP64_MARKER)
    return { refused: "Zip64 archives are not supported" };
  if (count > ARCHIVE_MAX_ENTRIES)
    return {
      refused: `More than ${ARCHIVE_MAX_ENTRIES.toLocaleString("en-US")} entries`,
    };
  if (start + size > end)
    return { refused: "Central directory is out of bounds" };
  const decoder = new TextDecoder();
  const members: ArchiveMember[] = [];
  let cursor = start;
  for (let entry = 0; entry < count; entry += 1) {
    if (
      cursor + 46 > end ||
      view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_HEADER
    )
      return { refused: "Central directory is damaged" };
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedBytes = view.getUint32(cursor + 20, true);
    const sizeBytes = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const offset = view.getUint32(cursor + 42, true);
    const path = decoder.decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLength),
    );
    cursor += 46 + nameLength + extraLength + commentLength;
    if (path.endsWith("/")) continue;
    members.push({
      path,
      sizeBytes,
      compressedBytes,
      method,
      offset,
      unavailable: memberProblem(
        path,
        flags,
        method,
        sizeBytes,
        compressedBytes,
        offset,
      ),
    });
  }
  return { members };
}

function inflate(data: Uint8Array, cap: number): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const pump = (): Promise<Uint8Array> =>
    reader.read().then(({ done, value }) => {
      if (done) {
        const out = new Uint8Array(total);
        let at = 0;
        for (const chunk of chunks) {
          out.set(chunk, at);
          at += chunk.byteLength;
        }
        return out;
      }
      total += value.byteLength;
      if (total > cap) {
        void reader.cancel();
        return Promise.reject(new Error("Member inflates past the cap"));
      }
      chunks.push(value);
      return pump();
    });
  return pump();
}

export function readZipMember(
  bytes: Uint8Array,
  member: ArchiveMember,
): Promise<Uint8Array> {
  if (member.unavailable !== undefined)
    return Promise.reject(new Error(member.unavailable));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    member.offset + 30 > bytes.byteLength ||
    view.getUint32(member.offset, true) !== LOCAL_FILE_HEADER
  )
    return Promise.reject(new Error("Local header is damaged"));
  const dataStart =
    member.offset +
    30 +
    view.getUint16(member.offset + 26, true) +
    view.getUint16(member.offset + 28, true);
  const dataEnd = dataStart + member.compressedBytes;
  if (dataEnd > bytes.byteLength)
    return Promise.reject(new Error("Member data is out of bounds"));
  const data = bytes.subarray(dataStart, dataEnd);
  const checkSize = (out: Uint8Array) =>
    out.byteLength === member.sizeBytes
      ? out
      : Promise.reject(new Error("Member size does not match its header"));
  return member.method === STORED
    ? Promise.resolve(data).then(checkSize)
    : inflate(data, ARCHIVE_MEMBER_LIMIT).then(checkSize);
}

const mediaTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  flac: "audio/flac",
};

export const mediaTypeForPath = (path: string) =>
  mediaTypes[path.split(".").at(-1)?.toLowerCase() ?? ""] ??
  "application/octet-stream";

export const normalizeMemberPath = (path: string) => {
  const clean = path.replaceAll("\\", "/").replace(/^(?:[A-Za-z]:)?\/+/, "");
  return clean === "" ? path : clean;
};

export function indexMembers(members: ReadonlyArray<ArchiveMember>) {
  const byPath = new Map<string, ArchiveMember>();
  for (const member of members) {
    const path = normalizeMemberPath(member.path);
    if (!byPath.has(path)) byPath.set(path, member);
  }
  return byPath;
}

export type DirectoryEntry =
  | {
      kind: "folder";
      path: string;
      label: string;
      fileCount: number;
      totalBytes: number;
    }
  | { kind: "file"; path: string; label: string; sizeBytes: number };

export function listDirectory(
  files: ReadonlyArray<{ path: string; sizeBytes: number }>,
  directory: string,
): DirectoryEntry[] {
  const prefix = directory === "" ? "" : `${directory}/`;
  const folders = new Map<string, { fileCount: number; totalBytes: number }>();
  const entries: DirectoryEntry[] = [];
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      entries.push({
        kind: "file",
        path: file.path,
        label: rest,
        sizeBytes: file.sizeBytes,
      });
      continue;
    }
    const name = rest.slice(0, slash);
    const folder = folders.get(name) ?? { fileCount: 0, totalBytes: 0 };
    folder.fileCount += 1;
    folder.totalBytes += file.sizeBytes;
    folders.set(name, folder);
  }
  const collator = new Intl.Collator("en-US", {
    numeric: true,
    sensitivity: "base",
  });
  const folderEntries: DirectoryEntry[] = [...folders.entries()].map(
    ([name, folder]) => ({
      kind: "folder",
      path: `${prefix}${name}`,
      label: name,
      ...folder,
    }),
  );
  return [
    ...folderEntries.sort((a, b) => collator.compare(a.label, b.label)),
    ...entries.sort((a, b) => collator.compare(a.label, b.label)),
  ];
}

export function directoryTotals(
  files: ReadonlyArray<{ path: string; sizeBytes: number }>,
  directory: string,
) {
  const prefix = directory === "" ? "" : `${directory}/`;
  let fileCount = 0;
  let totalBytes = 0;
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    fileCount += 1;
    totalBytes += file.sizeBytes;
  }
  return { fileCount, totalBytes };
}
