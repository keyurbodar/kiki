import type { FileId, FileUploadDeclaration } from "@/data/api/schemas/files";
import {
  type AttachmentRef,
  attachmentMessages,
  isBrowserRenderable,
} from "./attachments";

export type UploadItem = {
  readonly localId: string;
  readonly file: File;
  readonly declared: FileUploadDeclaration;
  readonly signal: AbortSignal;
  readonly onProgress: (progress: number) => void;
};

export type UploadResult =
  | {
      readonly ok: true;
      readonly ref: AttachmentRef;
      readonly previewUrl?: Promise<string | undefined>;
    }
  | { readonly ok: false; readonly message: string };

/** Uploads a batch, reporting each item's result by index as it settles. */
export type Uploader = (
  items: ReadonlyArray<UploadItem>,
  onResult: (index: number, result: UploadResult) => void,
) => Promise<void>;

export type UploadTarget = { readonly fileId: FileId; readonly url: string };

export type UploadApi = {
  readonly upload: (
    files: ReadonlyArray<FileUploadDeclaration>,
  ) => Promise<{ readonly targets: ReadonlyArray<UploadTarget> }>;
  readonly pendingPreview: (fileId: FileId) => Promise<string | undefined>;
};

/** Capy's upload fixture switch, read from localStorage in mock mode. */
export const uploadFixtureKey = "capy-upload-fixture";
export type UploadFixture = "slow" | "fail";

export const readUploadFixture = (): UploadFixture | undefined => {
  if (typeof window === "undefined") return undefined;
  const value = window.localStorage.getItem(uploadFixtureKey);
  return value === "slow" || value === "fail" ? value : undefined;
};

/** A `.invalid` host marks a mock target: no PUT, simulated progress. */
export const isLocalTarget = (url: string) =>
  new URL(url).hostname.endsWith(".invalid");

const simulatedChunkBytes = 524_288;
const simulatedTickInterval = 100;
const simulatedFailAt = 60;

export const simulatedTicks = (sizeBytes: number) =>
  Math.max(15, Math.ceil(sizeBytes / simulatedChunkBytes) * 10);

export const simulateUpload = (
  sizeBytes: number,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
  fixture: UploadFixture | undefined = readUploadFixture(),
) => {
  if (fixture === undefined) return Promise.resolve();
  const ticks = simulatedTicks(sizeBytes);
  return new Promise<void>((resolve, reject) => {
    let tick = 0;
    onProgress(0);
    const timer = window.setInterval(() => {
      tick += 1;
      const progress = Math.min(100, Math.floor((tick / ticks) * 100));
      if (fixture === "fail" && progress >= simulatedFailAt) {
        window.clearInterval(timer);
        reject(new Error(attachmentMessages.network));
        return;
      }
      onProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        resolve();
      }
    }, simulatedTickInterval);
    signal.addEventListener(
      "abort",
      () => {
        window.clearInterval(timer);
        reject(new Error(attachmentMessages.aborted));
      },
      { once: true },
    );
  });
};

export const putFile = (
  url: string,
  file: File,
  mediaType: string,
  signal: AbortSignal,
  onProgress: (progress: number) => void,
) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.upload.onloadstart = () => onProgress(0);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0)
        onProgress(
          Math.min(100, Math.floor((event.loaded / event.total) * 100)),
        );
    };
    request.upload.onload = () => onProgress(100);
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", mediaType);
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: ${request.status}`));
    request.onerror = () => reject(new Error(attachmentMessages.network));
    request.onabort = () => reject(new Error(attachmentMessages.aborted));
    signal.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });

export const uploadToTarget = (
  item: UploadItem,
  target: UploadTarget,
  pendingPreview: (fileId: FileId) => Promise<string | undefined>,
): Promise<UploadResult> => {
  if (item.signal.aborted)
    return Promise.resolve({ ok: false, message: attachmentMessages.aborted });
  const local = isLocalTarget(target.url);
  const transfer = local
    ? simulateUpload(item.declared.sizeBytes, item.signal, item.onProgress)
    : putFile(
        target.url,
        item.file,
        item.declared.mediaType,
        item.signal,
        item.onProgress,
      );
  return transfer.then(
    (): UploadResult => ({
      ok: true,
      ref: { fileId: target.fileId, ...item.declared },
      previewUrl:
        local ||
        !item.declared.mediaType.startsWith("image/") ||
        isBrowserRenderable(item.declared.mediaType)
          ? undefined
          : pendingPreview(target.fileId),
    }),
    (error: unknown): UploadResult => ({
      ok: false,
      message:
        error instanceof Error ? error.message : attachmentMessages.failed,
    }),
  );
};

export const makeUploader =
  (api: UploadApi): Uploader =>
  async (items, onResult) => {
    const { targets } = await api.upload(items.map((item) => item.declared));
    await Promise.all(
      items.map((item, index) => {
        const target = targets[index];
        if (target === undefined) {
          onResult(index, { ok: false, message: attachmentMessages.noTarget });
          return Promise.resolve();
        }
        return uploadToTarget(item, target, api.pendingPreview).then((result) =>
          onResult(index, result),
        );
      }),
    );
  };
