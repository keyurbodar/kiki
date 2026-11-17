export type CropRect = { x: number; y: number; width: number; height: number };

export type ImageEdit = { rotation: number; crop?: CropRect };

export type CropHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";

export type CropAspect =
  | "free"
  | "original"
  | "window"
  | "16:9"
  | "16:10"
  | "4:3"
  | "1:1";

export const MIN_CROP = 0.05;

export const FULL_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

export const NO_EDIT: ImageEdit = { rotation: 0 };

export const CROP_ASPECTS: Array<{ id: CropAspect; label: string }> = [
  { id: "free", label: "Free" },
  { id: "original", label: "Original" },
  { id: "window", label: "Window" },
  { id: "16:9", label: "16:9" },
  { id: "16:10", label: "16:10" },
  { id: "4:3", label: "4:3" },
  { id: "1:1", label: "1:1" },
];

export const FIXED_RATIOS: Partial<Record<CropAspect, number>> = {
  "16:9": 16 / 9,
  "16:10": 16 / 10,
  "4:3": 4 / 3,
  "1:1": 1,
};

export const clampCrop = (rect: CropRect): CropRect => {
  const width = Math.min(1, Math.max(MIN_CROP, rect.width));
  const height = Math.min(1, Math.max(MIN_CROP, rect.height));
  return {
    x: Math.min(1 - width, Math.max(0, rect.x)),
    y: Math.min(1 - height, Math.max(0, rect.y)),
    width,
    height,
  };
};

export const isFullCrop = (rect: CropRect) =>
  rect.width >= 0.999 && rect.height >= 0.999;

export const squareCrop = (size: {
  width: number;
  height: number;
}): CropRect => {
  const side = Math.min(size.width, size.height);
  return {
    x: (1 - side / size.width) / 2,
    y: (1 - side / size.height) / 2,
    width: side / size.width,
    height: side / size.height,
  };
};

export const rotate = (rotation: number, turns: number) =>
  (rotation + turns * 90) % 360;

export const rotatedSize = (
  size: { width: number; height: number },
  rotation: number,
) =>
  rotation === 90 || rotation === 270
    ? { width: size.height, height: size.width }
    : size;

export const rotateCrop = (rect: CropRect, turns: number): CropRect =>
  turns === 1
    ? {
        x: 1 - rect.y - rect.height,
        y: rect.x,
        width: rect.height,
        height: rect.width,
      }
    : {
        x: rect.y,
        y: 1 - rect.x - rect.width,
        width: rect.height,
        height: rect.width,
      };

export const dragCrop = (
  rect: CropRect,
  handle: CropHandle | "move",
  dx: number,
  dy: number,
): CropRect => {
  if (handle === "move")
    return clampCrop({
      ...rect,
      x: Math.min(1 - rect.width, Math.max(0, rect.x + dx)),
      y: Math.min(1 - rect.height, Math.max(0, rect.y + dy)),
    });
  const left = handle.includes("w")
    ? Math.min(rect.x + rect.width - MIN_CROP, Math.max(0, rect.x + dx))
    : rect.x;
  const right = handle.includes("e")
    ? Math.max(rect.x + MIN_CROP, Math.min(1, rect.x + rect.width + dx))
    : rect.x + rect.width;
  const top = handle.includes("n")
    ? Math.min(rect.y + rect.height - MIN_CROP, Math.max(0, rect.y + dy))
    : rect.y;
  const bottom = handle.includes("s")
    ? Math.max(rect.y + MIN_CROP, Math.min(1, rect.y + rect.height + dy))
    : rect.y + rect.height;
  return clampCrop({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
};

export const lockAspect = (
  start: CropRect,
  next: CropRect,
  handle: CropHandle,
  ratio: number,
): CropRect => {
  const cx = start.x + start.width / 2;
  const cy = start.y + start.height / 2;
  const vertical = handle === "n" || handle === "s";
  const horizontal = handle === "e" || handle === "w";
  const ax = handle.includes("w") ? start.x + start.width : start.x;
  const ay = handle.includes("n") ? start.y + start.height : start.y;
  const roomX = vertical
    ? 2 * Math.min(cx, 1 - cx)
    : handle.includes("w")
      ? ax
      : 1 - ax;
  const roomY = horizontal
    ? 2 * Math.min(cy, 1 - cy)
    : handle.includes("n")
      ? ay
      : 1 - ay;
  const want = vertical
    ? { width: next.height * ratio, height: next.height }
    : { width: next.width, height: next.width / ratio };
  const fit = Math.min(1, roomX / want.width, roomY / want.height);
  const width = Math.max(MIN_CROP, want.width * fit);
  const height = Math.max(MIN_CROP, want.height * fit);
  return clampCrop({
    x: vertical ? cx - width / 2 : handle.includes("w") ? ax - width : ax,
    y: horizontal ? cy - height / 2 : handle.includes("n") ? ay - height : ay,
    width,
    height,
  });
};

export const zoomCrop = (rect: CropRect, factor: number): CropRect => {
  const width = Math.min(1, Math.max(MIN_CROP, rect.width * factor));
  const height = Math.min(1, Math.max(MIN_CROP, rect.height * factor));
  const scale = Math.min(width / rect.width, height / rect.height);
  return clampCrop({
    x: rect.x + (rect.width - rect.width * scale) / 2,
    y: rect.y + (rect.height - rect.height * scale) / 2,
    width: rect.width * scale,
    height: rect.height * scale,
  });
};

export const fitAspect = (rect: CropRect, ratio: number): CropRect => {
  const width = Math.min(rect.width, rect.height * ratio);
  const height = width / ratio;
  return clampCrop({
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  });
};

export const loadImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image"));
    };
    image.src = url;
  });

const outputType = (type: string) =>
  ["image/jpeg", "image/png", "image/webp"].includes(type) ? type : "image/png";

export const applyEdit = (blob: Blob, rotation: number, crop?: CropRect) =>
  blob.type === "image/gif" || (rotation === 0 && crop === undefined)
    ? Promise.resolve(blob)
    : loadImage(blob).then((image) => {
        const size = rotatedSize(
          { width: image.naturalWidth, height: image.naturalHeight },
          rotation,
        );
        const area = crop ?? FULL_CROP;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(size.width * area.width));
        canvas.height = Math.max(1, Math.round(size.height * area.height));
        const ctx = canvas.getContext("2d");
        if (ctx === null)
          return Promise.reject(new Error("Could not adjust the image"));
        ctx.translate(-area.x * size.width, -area.y * size.height);
        ctx.translate(size.width / 2, size.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
        return new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (out) =>
              out === null
                ? reject(new Error("Could not adjust the image"))
                : resolve(out),
            outputType(blob.type),
            0.92,
          ),
        );
      });
