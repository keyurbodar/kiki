import type { BrowserFile } from "./file-index";
import { baseName } from "./file-index";

export type PreviewSize = "shelf" | "index" | "list";

export type PreviewContentValue =
  | { kind: "markdown"; text: string }
  | { kind: "code"; text: string; cacheKey: string }
  | { kind: "image"; url: string }
  | { kind: "placeholder"; label: string; sub?: string };

export type FileKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "model"
  | "sheet"
  | "document";

const kindByExtension: Readonly<Record<string, FileKind>> = {
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

const modelMediaTypes = new Set([
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

const sheetMediaTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

export function fileKind({
  name,
  mediaType,
}: {
  name: string;
  mediaType: string;
}): FileKind | undefined {
  if (/\.svg$/i.test(name)) return undefined;
  const type = mediaType.toLowerCase();
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("video/")) return "video";
  if (mediaType.startsWith("audio/")) return "audio";
  if (mediaType === "application/pdf") return "pdf";
  if (modelMediaTypes.has(mediaType)) return "model";
  if (sheetMediaTypes.has(type)) return "sheet";
  if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "document";
  return kindByExtension[name.split(".").at(-1)?.toLowerCase() ?? ""];
}

const snippetBytes = 8192;
const maxInlineTextBytes = 65536;
const maxInlineImageBytes = 2097152;

const binaryExtensions = new Set(
  "zip.tar.gz.tgz.bz2.xz.7z.rar.exe.dll.so.dylib.bin.wasm.o.a.woff.woff2.ttf.otf.eot.db.sqlite.parquet.arrow.pb.pkl.npy.npz.doc.docx.xls.ppt.pptx.pages.numbers.key.psd.ai.sketch.fig.blend.heic.ico.icns.jar.class.pyc.dmg.iso.img".split(
    ".",
  ),
);

const extensionOf = (name: string) =>
  name.includes(".") ? (name.split(".").at(-1) ?? "") : "";

export const isMarkdownPath = (path: string) =>
  /\.(md|markdown|mdx)$/i.test(path);

export const previewSnippet = (text: string, lines = 20) =>
  text
    .slice(0, snippetBytes)
    .split("\n")
    .slice(0, lines)
    .map((line) => (line.length > 200 ? line.slice(0, 200) : line))
    .join("\n");

export const markdownExcerpt = (text: string, limit = snippetBytes) => {
  const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  if (body.length <= limit) return body;
  const cut = body.slice(0, limit);
  const paragraph = cut.lastIndexOf("\n\n");
  return paragraph > 0 ? cut.slice(0, paragraph) : cut;
};

export function passivePreview(
  file: BrowserFile,
): PreviewContentValue | undefined {
  const name = baseName(file.path);
  const kind = fileKind({ name, mediaType: "" });
  if (kind === "image")
    return file.sizeBytes > maxInlineImageBytes
      ? { kind: "placeholder", label: "Image", sub: "Open to view" }
      : undefined;
  if (kind === "pdf")
    return {
      kind: "placeholder",
      label: "PDF document",
      sub: "Open to view pages",
    };
  if (kind === "model")
    return { kind: "placeholder", label: "3D model", sub: "Open to view" };
  if (kind === "sheet")
    return { kind: "placeholder", label: "Spreadsheet", sub: "Open to view" };
  if (kind === "document")
    return { kind: "placeholder", label: "Word document", sub: "Open to read" };
  if (kind !== undefined)
    return {
      kind: "placeholder",
      label: `${kind[0]?.toUpperCase()}${kind.slice(1)}`,
      sub: "Open to play",
    };
  const extension = extensionOf(name).toLowerCase();
  if (binaryExtensions.has(extension))
    return {
      kind: "placeholder",
      label: `${extension.toUpperCase()} file`,
      sub: "No preview for this file type",
    };
  if (file.sizeBytes > maxInlineTextBytes)
    return {
      kind: "placeholder",
      label: isMarkdownPath(name) ? "Markdown" : "Text",
      sub: "Open to read",
    };
  return undefined;
}
