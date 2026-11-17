export type MediaMark =
  | { kind: "box"; x: number; y: number; w: number; h: number }
  | { kind: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "pin"; x: number; y: number };

export type MediaKind = "image" | "video";

export type MediaAttachment = { mediaType: string; preview?: boolean };

export type MediaCommentTarget = {
  fileId: string;
  file: string;
  kind: MediaKind;
  attachment?: MediaAttachment;
};

export type MediaCommentDraft = {
  id: string;
  fileId: string;
  file: string;
  kind: MediaKind;
  time?: number;
  width: number;
  height: number;
  mark: MediaMark;
  note: string;
  thumb: string;
  attachment?: MediaAttachment;
  number?: number;
  unit?: number;
};

export type MediaCommentSent = {
  fileId: string;
  file: string;
  time?: number;
  width: number;
  height: number;
  mark: MediaMark;
  note: string;
  number?: number;
};

export type MediaCommentLine = {
  mention: { kind: "excerpt"; id: string; label: string; text: string };
  text: string;
};

export type MediaCommentDeliver = (
  files: File[],
  lines: MediaCommentLine[],
  mode: "send" | "insert",
) => Promise<boolean> | boolean;

export const MEDIA_COMMENTS_KEY = "capy-web:media-comments";
export const MEDIA_COMMENT_LANGUAGE = "media_comment";
export const DRAG_THRESHOLD = 4;
export const FRAME_TOLERANCE = 0.05;
export const THUMB_WIDTH = 480;

export const percentOf = (value: number, total: number) =>
  `${(value / total) * 100}%`;

export const formatClock = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export const boxFrom = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): MediaMark => ({
  kind: "box",
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(b.x - a.x),
  h: Math.abs(b.y - a.y),
});

export const markOrigin = (mark: MediaMark): [number, number] =>
  mark.kind === "arrow" ? [mark.x1, mark.y1] : [mark.x, mark.y];

const point = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`;

export const describeMark = (mark: MediaMark) =>
  mark.kind === "box"
    ? `box at ${point(mark.x, mark.y)}, ${Math.round(mark.w)}×${Math.round(mark.h)}`
    : mark.kind === "arrow"
      ? `arrow from ${point(mark.x1, mark.y1)} to ${point(mark.x2, mark.y2)}`
      : `pin at ${point(mark.x, mark.y)}`;

export const scaleMark = (mark: MediaMark, factor: number): MediaMark =>
  mark.kind === "box"
    ? {
        ...mark,
        x: mark.x * factor,
        y: mark.y * factor,
        w: mark.w * factor,
        h: mark.h * factor,
      }
    : mark.kind === "arrow"
      ? {
          ...mark,
          x1: mark.x1 * factor,
          y1: mark.y1 * factor,
          x2: mark.x2 * factor,
          y2: mark.y2 * factor,
        }
      : { ...mark, x: mark.x * factor, y: mark.y * factor };

export const sameFrame = (
  a: { fileId?: string; time?: number },
  b: { fileId?: string; time?: number },
) =>
  a.fileId === b.fileId &&
  (a.time === undefined || b.time === undefined
    ? a.time === b.time
    : Math.abs(a.time - b.time) <= FRAME_TOLERANCE);

export const groupFrames = (items: MediaCommentDraft[]) => {
  const groups: MediaCommentDraft[][] = [];
  for (const item of items) {
    const group = groups.find(
      (candidate) =>
        candidate[0] !== undefined && sameFrame(candidate[0], item),
    );
    if (group === undefined) groups.push([item]);
    else group.push(item);
  }
  return groups;
};

export const frameGroups = (items: MediaCommentDraft[]) => [
  ...groupFrames(items.filter((item) => item.unit !== undefined)),
  ...items.filter((item) => item.unit === undefined).map((item) => [item]),
];

export const numberIn = (
  groups: MediaCommentDraft[][],
  item: MediaCommentDraft,
) =>
  item.unit === undefined
    ? (item.number ?? 1)
    : (groups.find((group) => group.includes(item))?.indexOf(item) ?? 0) + 1;

export const frameLabel = (item: { file: string; time?: number }) =>
  item.time === undefined
    ? item.file
    : `${formatClock(item.time * 1000)} · ${item.file}`;

export const mentionLabel = (label: string, count: number) =>
  count === 1 ? label : `${label} · ${count} comments`;

export const commentMeta = (
  item: { file: string; time?: number },
  files: number,
) => {
  const time =
    item.time === undefined ? undefined : formatClock(item.time * 1000);
  return files <= 1
    ? time
    : time === undefined
      ? item.file
      : `${item.file} at ${time}`;
};

export const captionFor = (target: { file: string }, time?: number) =>
  time === undefined
    ? target.file
    : `${target.file} at ${formatClock(time * 1000)}`;

const escapeAttribute = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

export const excerpt = (source: string, language: string, text: string) => {
  const attrs = `source="${escapeAttribute(source)}" lang="${escapeAttribute(language)}"`;
  return text === ""
    ? `<excerpt ${attrs} />`
    : `<excerpt ${attrs}>\n${text}\n</excerpt>`;
};

export const frameExcerpt = (
  item: MediaCommentDraft,
  marks: Array<{ number: number; mark: MediaMark }>,
  frame: string,
) =>
  excerpt(
    item.file,
    MEDIA_COMMENT_LANGUAGE,
    [
      item.time === undefined
        ? undefined
        : `time: ${formatClock(item.time * 1000)}`,
      item.time === undefined ? undefined : `seconds: ${item.time.toFixed(3)}`,
      `size: ${item.width}×${item.height} ${item.kind === "video" ? "frame" : "image"}`,
      ...marks.map(
        ({ number, mark }) => `mark ${number}: ${describeMark(mark)}`,
      ),
      `frame: ${frame}`,
      item.attachment === undefined ? undefined : `file id: ${item.fileId}`,
      item.attachment === undefined
        ? undefined
        : `media type: ${item.attachment.mediaType}`,
      item.attachment?.preview === true ? "normalized preview: yes" : undefined,
    ]
      .filter((line) => line !== undefined)
      .join("\n"),
  );

export const noteLines = (notes: Array<{ number: number; note: string }>) =>
  `\n\n${notes
    .map(({ number, note }) => `${number}. ${note.replaceAll("\n", "\n   ")}`)
    .join("\n")}`;

export type MediaCommentQueues = Record<
  string,
  { items: MediaCommentDraft[]; updatedAt: number }
>;

const listeners = new Set<() => void>();
let queues: MediaCommentQueues | undefined;

const readQueues = (): MediaCommentQueues => {
  try {
    const raw = globalThis.localStorage?.getItem(MEDIA_COMMENTS_KEY);
    const parsed: unknown = raw == null ? {} : JSON.parse(raw);
    return parsed !== null && typeof parsed === "object"
      ? (parsed as MediaCommentQueues)
      : {};
  } catch {
    return {};
  }
};

export const mediaCommentStore = {
  get: () => {
    queues ??= readQueues();
    return queues;
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== MEDIA_COMMENTS_KEY && event.key !== null) return;
      queues = readQueues();
      listener();
    };
    globalThis.addEventListener?.("storage", onStorage);
    return () => {
      listeners.delete(listener);
      globalThis.removeEventListener?.("storage", onStorage);
    };
  },
  update: (
    key: string,
    change: (items: MediaCommentDraft[]) => MediaCommentDraft[],
  ) => {
    const current = readQueues();
    const items = change(current[key]?.items ?? []);
    const next = { ...current };
    if (items.length === 0) delete next[key];
    else next[key] = { items, updatedAt: Date.now() };
    queues = next;
    try {
      globalThis.localStorage?.setItem(
        MEDIA_COMMENTS_KEY,
        JSON.stringify(next),
      );
    } catch {}
    for (const listener of listeners) listener();
  },
  reset: () => {
    queues = undefined;
  },
};

export const mediaSize = (media: HTMLImageElement | HTMLVideoElement) =>
  media instanceof HTMLVideoElement
    ? { width: media.videoWidth, height: media.videoHeight }
    : { width: media.naturalWidth, height: media.naturalHeight };

export const drawMark = (
  ctx: CanvasRenderingContext2D,
  mark: MediaMark,
  n: number,
  color: string,
  unit: number,
) => {
  const badge = (x: number, y: number) => {
    const size = 24 * unit;
    ctx.fillStyle = color;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5 * unit;
    ctx.beginPath();
    ctx.roundRect(x, y - size, size, size, [size / 2, size / 2, size / 2, 0]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = `500 ${12 * unit}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(n), x + size / 2, y - size / 2 + 0.5 * unit);
  };
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (mark.kind === "box") {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(mark.x, mark.y, mark.w, mark.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * unit;
    ctx.strokeRect(mark.x, mark.y, mark.w, mark.h);
    badge(mark.x, mark.y);
    return;
  }
  if (mark.kind === "arrow") {
    const angle = Math.atan2(mark.y2 - mark.y1, mark.x2 - mark.x1);
    const head = 12 * unit;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3 * unit;
    ctx.beginPath();
    ctx.moveTo(mark.x1, mark.y1);
    ctx.lineTo(
      mark.x2 - head * 0.6 * Math.cos(angle),
      mark.y2 - head * 0.6 * Math.sin(angle),
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mark.x2, mark.y2);
    ctx.lineTo(
      mark.x2 - head * Math.cos(angle - 0.45),
      mark.y2 - head * Math.sin(angle - 0.45),
    );
    ctx.lineTo(
      mark.x2 - head * Math.cos(angle + 0.45),
      mark.y2 - head * Math.sin(angle + 0.45),
    );
    ctx.closePath();
    ctx.fill();
    badge(mark.x1, mark.y1);
    return;
  }
  badge(mark.x, mark.y);
};

export const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob === null
          ? reject(new Error("Could not encode the frame"))
          : resolve(blob),
      "image/png",
    ),
  );

export const captureFrame = (
  media: HTMLImageElement | HTMLVideoElement,
  overlay?: { mark: MediaMark; n: number; color: string },
) => {
  const { width, height } = mediaSize(media);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return canvas;
  ctx.drawImage(media, 0, 0, width, height);
  if (overlay !== undefined)
    drawMark(
      ctx,
      overlay.mark,
      overlay.n,
      overlay.color,
      Math.max(1, width / media.offsetWidth),
    );
  return canvas;
};

export const thumbnail = (canvas: HTMLCanvasElement) => {
  const scale = Math.min(1, THUMB_WIDTH / Math.max(1, canvas.width));
  const thumb = document.createElement("canvas");
  thumb.width = Math.round(canvas.width * scale);
  thumb.height = Math.round(canvas.height * scale);
  thumb.getContext("2d")?.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  try {
    return thumb.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  }
};

export const primaryColor = (host: Element) => {
  const probe = document.createElement("span");
  probe.style.color = "var(--primary)";
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

export const renderMarks = async (
  source: Blob,
  marks: Array<{ mark: MediaMark; n: number }>,
  color: string,
  unit: number,
  width: number,
) => {
  if (typeof createImageBitmap !== "function") return source;
  const bitmap = await createImageBitmap(source);
  const factor = width > 0 ? bitmap.width / width : 1;
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return source;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  for (const { mark, n } of marks)
    drawMark(ctx, scaleMark(mark, factor), n, color, unit * factor);
  return canvasBlob(canvas);
};

export const blobFromThumb = async (thumb: string) => {
  const image = new Image();
  image.src = thumb;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return canvasBlob(canvas);
};

export const selectionFile = (blob: Blob, id: string) =>
  new File([blob], `selection-${id}-1.png`, { type: "image/png" });
