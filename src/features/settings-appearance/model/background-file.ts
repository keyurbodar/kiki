import type { BackgroundAdjustments } from "./appearance-store";

/**
 * Capy's upload path for a dashboard background: the file is checked, shrunk to
 * fit the limits, and kept in the browser's own storage so a reload brings the
 * wallpaper back. Sizes and messages are Capy's.
 */

export const BACKGROUND_FILE_LIMITS = {
  /** 32 MiB, the largest image the endpoint accepts. */
  maxBytes: 33_554_432,
  /** Longest side of the stored image. */
  maxSide: 4096,
  /** Total pixels of the stored image, 16 megapixels. */
  maxPixels: 16_000_000,
  /** JPEG quality used when the image has to be re-encoded. */
  quality: 0.92,
} as const;

export const BACKGROUND_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type PreparedBackgroundFile = {
  readonly name: string;
  readonly blob: Blob;
};

/** What is kept for the current wallpaper: the bytes and how they are drawn. */
export type StoredBackground = PreparedBackgroundFile & {
  readonly appearance: BackgroundAdjustments;
};

/** Capy refuses a GIF that needs shrinking rather than flatten it to a still. */
const GIF_TOO_LARGE = `Animated images must be at most ${BACKGROUND_FILE_LIMITS.maxSide} px per side and 16 megapixels`;

const encodeAs = (type: string) =>
  type === "image/jpeg" || type === "image/webp" ? type : "image/png";

const decode = (file: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
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

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob === null
          ? reject(new Error("Could not resize the image"))
          : resolve(blob),
      type,
      BACKGROUND_FILE_LIMITS.quality,
    ),
  );

const shrink = async (file: Blob, image: HTMLImageElement, scale: number) => {
  if (file.type === "image/gif") throw new Error(GIF_TOO_LARGE);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Could not resize the image");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return toBlob(canvas, encodeAs(file.type));
};

/**
 * Capy's checks, in Capy's order: an image at most 32 MiB, decoded, then
 * downscaled to 4096 a side and 16 megapixels. A GIF that needs either is
 * refused rather than flattened to a still.
 */
export const prepareBackgroundFile = async (
  file: File,
): Promise<PreparedBackgroundFile> => {
  if (!file.type.startsWith("image/"))
    throw new Error("Pick an image or gif file");
  if (file.size > BACKGROUND_FILE_LIMITS.maxBytes)
    throw new Error("Images up to 32MB only");
  const image = await decode(file);
  const { naturalWidth: width, naturalHeight: height } = image;
  if (width === 0 || height === 0) throw new Error("Could not read the image");
  const scale = Math.min(
    1,
    BACKGROUND_FILE_LIMITS.maxSide / width,
    BACKGROUND_FILE_LIMITS.maxSide / height,
    Math.sqrt(BACKGROUND_FILE_LIMITS.maxPixels / (width * height)),
  );
  const supported = (BACKGROUND_FILE_TYPES as ReadonlyArray<string>).includes(
    file.type,
  );
  if (scale >= 1 && supported) return { name: file.name, blob: file };
  return { name: file.name, blob: await shrink(file, image, scale) };
};

const DB_NAME = "capy-web";
const STORE = "home-background";
const KEY = "current";

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open storage"));
  });

/** The bytes of the current wallpaper, kept the way Capy keeps them. */
export const saveBackgroundFile = async (file: StoredBackground | null) => {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      if (file === null) store.delete(KEY);
      else
        store.put(
          { name: file.name, blob: file.blob, appearance: file.appearance },
          KEY,
        );
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not save the image"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Could not save the image"));
    });
  } finally {
    database.close();
  }
};

export const readBackgroundFile =
  async (): Promise<StoredBackground | null> => {
    const database = await openDatabase();
    try {
      const record = await new Promise<unknown>((resolve, reject) => {
        const request = database
          .transaction(STORE, "readonly")
          .objectStore(STORE)
          .get(KEY);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("Could not read storage"));
      });
      if (typeof record !== "object" || record === null) return null;
      const { name, blob, appearance } = record as {
        name?: unknown;
        blob?: unknown;
        appearance?: unknown;
      };
      if (typeof name !== "string" || !(blob instanceof Blob)) return null;
      return {
        name,
        blob,
        appearance: appearance as BackgroundAdjustments,
      };
    } finally {
      database.close();
    }
  };
