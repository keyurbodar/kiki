import { useEffect, useRef, useState } from "react";
import {
  type AttachmentEntry,
  type AttachmentRef,
  attachmentMessages,
  committedBytes,
  declareFile,
  isBrowserRenderable,
  readyRefs,
  rejectReason,
} from "./attachments";
import type { Uploader, UploadResult } from "./upload";

const previewCacheSize = 32;
const previewCache = new Map<string, { url: string; original?: File }>();

const rememberPreview = (fileId: string, url: string, original?: File) => {
  previewCache.set(fileId, { url, original });
  for (const [key, { url: stale }] of previewCache) {
    if (previewCache.size <= previewCacheSize) break;
    previewCache.delete(key);
    URL.revokeObjectURL(stale);
  }
};

const fromRef = (ref: AttachmentRef): AttachmentEntry => ({
  localId: crypto.randomUUID(),
  name: ref.name,
  sizeBytes: ref.sizeBytes,
  mediaType: ref.mediaType,
  previewUrl: previewCache.get(ref.fileId)?.url,
  original: previewCache.get(ref.fileId)?.original,
  status: { phase: "ready", ref },
});

const forgetPreview = (entry: AttachmentEntry) => {
  if (entry.status.phase !== "ready" || entry.previewUrl === undefined) return;
  previewCache.delete(entry.status.ref.fileId);
  URL.revokeObjectURL(entry.previewUrl);
};

type Outcome = {
  readonly promise: Promise<UploadResult>;
  readonly resolve: (result: UploadResult) => void;
};

const deferred = (): Outcome => {
  let resolve: (result: UploadResult) => void = () => undefined;
  const promise = new Promise<UploadResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

/** An upload still in flight, handed over by `take` (to a queued send). */
export type PendingUpload = {
  readonly entry: AttachmentEntry;
  readonly outcome: Promise<UploadResult>;
  readonly onProgress: (listener: (progress: number) => void) => void;
  readonly abort: () => void;
};

export type ComposerAttachmentsController = {
  readonly entries: ReadonlyArray<AttachmentEntry>;
  /** True while any entry is still uploading. */
  readonly uploading: boolean;
  /** The refs of every settled upload, to send with the message. */
  readonly getReadyRefs: () => ReadonlyArray<AttachmentRef>;
  /** The composer's `onFilesAdded`: picker, paste and drop all land here. */
  readonly add: (files: ReadonlyArray<File>) => void;
  readonly remove: (localId: string) => void;
  /** Detaches in-flight uploads so a queued send can finish them. */
  readonly take: () => ReadonlyArray<PendingUpload>;
  /** Drops every sent (ready) entry and keeps failed or uploading ones. */
  readonly clearSent: () => void;
  /** Puts refs back, e.g. when a queued message returns to the composer. */
  readonly restore: (refs: ReadonlyArray<AttachmentRef>) => void;
  /** Aborts everything and starts over from `refs` (or empty). */
  readonly reset: (refs?: ReadonlyArray<AttachmentRef>) => void;
};

/**
 * Composer attachment state, ported from Capy's composer hook. Pass an
 * uploader (see `useFileUploader`); without one every file fails with
 * "Upload unavailable", as in Capy.
 */
export function useComposerAttachments(
  uploader: Uploader | undefined,
  initial?: ReadonlyArray<AttachmentRef>,
): ComposerAttachmentsController {
  const [entries, setEntries] = useState<ReadonlyArray<AttachmentEntry>>(() =>
    (initial ?? []).map(fromRef),
  );
  const current = useRef(entries);
  const controllers = useRef(new Map<string, AbortController>());
  const outcomes = useRef(
    new Map<
      string,
      { outcome: Outcome; listeners: Set<(progress: number) => void> }
    >(),
  );

  useEffect(
    () => () => {
      for (const controller of controllers.current.values()) controller.abort();
      for (const entry of current.current)
        if (entry.status.phase !== "ready" && entry.previewUrl !== undefined)
          URL.revokeObjectURL(entry.previewUrl);
    },
    [],
  );

  const update = (
    change: (
      all: ReadonlyArray<AttachmentEntry>,
    ) => ReadonlyArray<AttachmentEntry>,
  ) => {
    const next = change(current.current);
    current.current = next;
    setEntries(next);
  };

  const settle = (
    localId: string,
    signal: AbortSignal,
    result: UploadResult,
  ) => {
    outcomes.current.get(localId)?.outcome.resolve(result);
    outcomes.current.delete(localId);
    if (signal.aborted) return;
    const entry = current.current.find((item) => item.localId === localId);
    if (result.ok && entry?.previewUrl !== undefined)
      rememberPreview(result.ref.fileId, entry.previewUrl, entry.original);
    controllers.current.delete(localId);
    update((all) =>
      all.map((item) =>
        item.localId === localId
          ? {
              ...item,
              status: result.ok
                ? { phase: "ready", ref: result.ref }
                : { phase: "failed", message: result.message },
            }
          : item,
      ),
    );
    if (!result.ok || result.previewUrl === undefined) return;
    const { ref } = result;
    result.previewUrl.then((url) => {
      if (url === undefined) return;
      if (!current.current.some((item) => item.localId === localId)) return;
      rememberPreview(ref.fileId, url, entry?.original);
      update((all) =>
        all.map((item) =>
          item.localId === localId ? { ...item, previewUrl: url } : item,
        ),
      );
    });
  };

  const add = (files: ReadonlyArray<File>) => {
    let committed = committedBytes(current.current);
    const accepted: Array<{
      localId: string;
      file: File;
      declared: ReturnType<typeof declareFile>;
    }> = [];
    const added = files.map((file): AttachmentEntry => {
      const localId = crypto.randomUUID();
      const declared = declareFile(file);
      const previewUrl =
        declared.mediaType.startsWith("image/") &&
        isBrowserRenderable(declared.mediaType)
          ? URL.createObjectURL(file)
          : undefined;
      const reason = rejectReason(file.size, committed, uploader !== undefined);
      if (reason !== undefined)
        return {
          localId,
          ...declared,
          previewUrl,
          status: { phase: "failed", message: reason },
        };
      committed += file.size;
      accepted.push({ localId, file, declared });
      return {
        localId,
        ...declared,
        previewUrl,
        original: file,
        status: { phase: "uploading" },
      };
    });
    update((all) => [...all, ...added]);
    if (uploader === undefined || accepted.length === 0) return;

    const items = accepted.map((item) => {
      const controller = new AbortController();
      controllers.current.set(item.localId, controller);
      outcomes.current.set(item.localId, {
        outcome: deferred(),
        listeners: new Set(),
      });
      return {
        ...item,
        signal: controller.signal,
        onProgress: (progress: number) => {
          if (controller.signal.aborted) return;
          for (const listener of outcomes.current.get(item.localId)
            ?.listeners ?? [])
            listener(progress);
          const entry = current.current.find((e) => e.localId === item.localId);
          if (
            entry?.status.phase === "uploading" &&
            entry.status.progress !== progress
          )
            update((all) =>
              all.map((e) =>
                e.localId === item.localId
                  ? { ...e, status: { phase: "uploading", progress } }
                  : e,
              ),
            );
        },
      };
    });
    const settled = new Set<number>();
    uploader(items, (index, result) => {
      const item = items[index];
      if (item === undefined || settled.has(index)) return;
      settled.add(index);
      settle(item.localId, item.signal, result);
    }).catch((error: unknown) =>
      items.forEach((item, index) => {
        if (settled.has(index)) return;
        settled.add(index);
        settle(item.localId, item.signal, {
          ok: false,
          message:
            error instanceof Error ? error.message : attachmentMessages.failed,
        });
      }),
    );
  };

  const take = () => {
    const pending = current.current.flatMap((entry): PendingUpload[] => {
      const controller = controllers.current.get(entry.localId);
      const tracked = outcomes.current.get(entry.localId);
      if (
        entry.status.phase !== "uploading" ||
        controller === undefined ||
        tracked === undefined
      )
        return [];
      controllers.current.delete(entry.localId);
      return [
        {
          entry,
          outcome: tracked.outcome.promise,
          onProgress: (listener) => tracked.listeners.add(listener),
          abort: () => controller.abort(),
        },
      ];
    });
    if (pending.length === 0) return pending;
    const taken = new Set(pending.map((item) => item.entry.localId));
    update((all) => all.filter((entry) => !taken.has(entry.localId)));
    return pending;
  };

  const remove = (localId: string) => {
    controllers.current.get(localId)?.abort();
    controllers.current.delete(localId);
    const entry = current.current.find((item) => item.localId === localId);
    if (entry === undefined) return;
    if (entry.status.phase === "ready") forgetPreview(entry);
    else if (entry.previewUrl !== undefined)
      URL.revokeObjectURL(entry.previewUrl);
    update((all) => all.filter((item) => item.localId !== localId));
  };

  const clearSent = () => {
    for (const entry of current.current) forgetPreview(entry);
    update((all) => all.filter((entry) => entry.status.phase !== "ready"));
  };

  const restore = (refs: ReadonlyArray<AttachmentRef>) => {
    if (refs.length === 0) return;
    update((all) => [...refs.map(fromRef), ...all]);
  };

  const reset = (refs?: ReadonlyArray<AttachmentRef>) => {
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
    for (const entry of current.current)
      if (entry.status.phase !== "ready" && entry.previewUrl !== undefined)
        URL.revokeObjectURL(entry.previewUrl);
    update(() => (refs ?? []).map(fromRef));
  };

  return {
    entries,
    uploading: entries.some((entry) => entry.status.phase === "uploading"),
    getReadyRefs: () => readyRefs(current.current),
    add,
    remove,
    take,
    clearSent,
    restore,
    reset,
  };
}
