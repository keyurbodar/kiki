import { sharedImageMaxBytes, sharedImageTypes } from "./avatar";

export const pictureTypes = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const pictureMaxBytes = 10 * 1024 * 1024;

export const pictureAccept = pictureTypes.join(",");

export const sharedImageAccept = sharedImageTypes.join(",");

export const isPictureFile = (file: { size: number; type: string }) =>
  file.size > 0 &&
  file.size <= pictureMaxBytes &&
  (pictureTypes as ReadonlyArray<string>).includes(file.type);

/** Why a shared library upload is refused before reading its pixels, if it is. */
export function sharedImageProblem(file: { size: number; type: string }) {
  if (file.size > sharedImageMaxBytes) return "Shared images go up to 5 MB";
  if (!(sharedImageTypes as ReadonlyArray<string>).includes(file.type))
    return "Shared images need a transparent background";
  return undefined;
}

/** True when any pixel is not fully opaque, read in strips of about a megapixel. */
export async function hasTransparency(file: Blob) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (context === null) throw new Error("Could not read this image");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const rows = Math.max(1, Math.floor(1048576 / width));
  for (let top = 0; top < height; top += rows) {
    const { data } = context.getImageData(
      0,
      top,
      width,
      Math.min(rows, height - top),
    );
    for (let index = 3; index < data.length; index += 4) {
      if ((data[index] ?? 255) < 255) return true;
    }
  }
  return false;
}

/** Centre-crops an image to a square PNG of the given edge. */
export async function squarePng(file: Blob, edge: number) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      edge,
      edge,
    );
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob === null
          ? reject(new Error("Could not read this image"))
          : resolve(blob),
      "image/png",
    );
  });
}
