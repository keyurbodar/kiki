export type MediaKind =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "model"
  | "sheet"
  | "document";

export const isMarkdown = (name: string) =>
  /\.(?:md|mdx|markdown)$/i.test(name);
export const isSvg = (name: string) => /\.svg$/i.test(name);
export const isDelimited = (name: string) => /\.(?:csv|tsv)$/i.test(name);
export const isModel = (name: string) =>
  /\.(?:stl|obj|gltf|glb|ply|3mf|fbx|dae|gcode|gco|nc|ngc|step|stp|iges|igs|brep|brp)$/i.test(
    name,
  );
export const isHtml = (name: string) => /\.html?$/i.test(name);

export const hasRenderedView = (name: string) =>
  isMarkdown(name) || isSvg(name);

const mediaByExtension: Record<string, MediaKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  ico: "image",
  pdf: "pdf",
  mp4: "video",
  webm: "video",
  mov: "video",
  m4v: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  flac: "audio",
  stl: "model",
  obj: "model",
  glb: "model",
  gltf: "model",
  ply: "model",
  "3mf": "model",
  fbx: "model",
  dae: "model",
  gcode: "model",
  gco: "model",
  nc: "model",
  ngc: "model",
  step: "model",
  stp: "model",
  iges: "model",
  igs: "model",
  brep: "model",
  brp: "model",
  xlsx: "sheet",
  xlsm: "sheet",
  ods: "sheet",
  docx: "document",
};

const modelTypes = new Set([
  "model/stl",
  "model/obj",
  "model/gltf-binary",
  "model/gltf+json",
  "model/3mf",
  "model/vnd.collada+xml",
  "model/step",
  "model/iges",
  "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
  "application/sla",
]);

const sheetTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

export const fileExtension = (name: string) =>
  name.includes(".") ? name.split(".").at(-1) : undefined;

export function mediaKind({
  name,
  mediaType,
}: {
  name: string;
  mediaType: string;
}): MediaKind | undefined {
  if (isSvg(name)) return undefined;
  const type = mediaType.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  if (modelTypes.has(type)) return "model";
  if (sheetTypes.has(type)) return "sheet";
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "document";
  return mediaByExtension[fileExtension(name)?.toLowerCase() ?? ""];
}

export const textGateBytes = 1e6;
export const largeGateBytes = 64e6;
export const truncatedPreviewBytes = 2097152;

export const shouldGate = (
  name: string,
  sizeBytes: number,
  media: MediaKind | undefined,
) =>
  media === undefined
    ? sizeBytes > (isDelimited(name) ? largeGateBytes : textGateBytes)
    : media === "sheet" && sizeBytes > largeGateBytes;

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)) - 1,
    units.length - 1,
  );
  const value = bytes / 1024 ** (index + 1);
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export const fileName = (path: string) => path.split(/[\\/]/).at(-1) ?? path;

export const fileMeta = (name: string, sizeBytes: number) =>
  `${fileExtension(name) ?? "file"} · ${formatBytes(sizeBytes)}`;

export function crumbDirs(path: string, name: string) {
  const end = path.endsWith(name) ? path.lastIndexOf("/") : -1;
  return end === -1 ? [] : path.slice(0, end).split("/");
}

export function middleEllipsis(name: string, fits: (text: string) => boolean) {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";
  const tail = stem.slice(
    stem.length - Math.min(4, Math.floor(stem.length / 3)),
  );
  const head = stem.slice(0, stem.length - tail.length);
  const cut = (keep: number) =>
    `${head.slice(0, keep).trimEnd()}…${tail}${extension}`;
  const keep = [...Array(head.length).keys()]
    .map((index) => head.length - index)
    .find((length) => fits(cut(length)));
  return cut(keep ?? 1);
}
