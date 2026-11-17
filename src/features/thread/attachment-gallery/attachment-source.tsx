import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { createContext, type ReactNode, useContext, useState } from "react";
import { ApiClient } from "@/data/client/ApiClient";
import type { AttachmentFile } from "./attachment-format";

export type AttachmentPurpose =
  | "gallery"
  | "archive"
  | "file-tab"
  | "file-body";

export type AttachmentVariant = "display" | "preview" | "original";

export type AttachmentGone = "thread" | "file";

export type AttachmentUrl = {
  url: string | undefined;
  failed: boolean;
  waiting: boolean;
  gone?: AttachmentGone;
  mediaFailed: () => void;
  refresh: () => void;
};

export type AttachmentSource = {
  useUrl: (
    file: AttachmentFile,
    purpose: AttachmentPurpose,
    variant?: AttachmentVariant,
  ) => AttachmentUrl;
};

const noop = () => {};

export const pendingAttachmentSource: AttachmentSource = {
  useUrl: () => ({
    url: undefined,
    failed: false,
    waiting: true,
    mediaFailed: noop,
    refresh: noop,
  }),
};

const AttachmentSourceContext = createContext<AttachmentSource>(
  pendingAttachmentSource,
);

export function AttachmentSourceProvider({
  source,
  children,
}: {
  source: AttachmentSource;
  children: ReactNode;
}) {
  return (
    <AttachmentSourceContext value={source}>{children}</AttachmentSourceContext>
  );
}

export const useAttachmentSource = () => useContext(AttachmentSourceContext);

export function useAttachmentUrl(
  file: AttachmentFile,
  purpose: AttachmentPurpose,
  variant: AttachmentVariant = "display",
) {
  return useAttachmentSource().useUrl(file, purpose, variant);
}

export const fileVariant = (
  file: Pick<AttachmentFile, "preview" | "mediaType">,
  variant: AttachmentVariant,
): "preview" | "original" =>
  file.preview === true &&
  (variant === "preview" ||
    (variant === "display" && !file.mediaType.startsWith("image/")))
    ? "preview"
    : "original";

export function signedUrlOf(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const url = (value as { url?: unknown }).url;
  return typeof url === "string" && url.length > 0 ? url : undefined;
}

export function goneOf(error: unknown): AttachmentGone | undefined {
  const tag =
    typeof error === "object" && error !== null
      ? (error as { _tag?: unknown })._tag
      : undefined;
  if (tag === "capy/JamNotFound" || tag === "JamNotFound") return "thread";
  if (tag === "capy/FileNotFound" || tag === "FileNotFound") return "file";
  return undefined;
}

export const attachmentFailureLine = (gone: AttachmentGone | undefined) =>
  gone === "thread"
    ? "Thread unavailable"
    : gone === "file"
      ? "File not found"
      : "File unavailable";

const fileUrlQuery = Atom.family((key: string) => {
  const [orgId = "", jamId = "", fileId = "", variant, name] = JSON.parse(
    key,
  ) as string[];
  return ApiClient.query("files", "url", {
    params: { orgId, jamId, fileId },
    query: {
      ...(variant === "preview" ? { variant } : {}),
      ...(name === undefined || name === "" ? {} : { name }),
    },
    timeToLive: "1 day",
  });
});

export function apiAttachmentSource(
  orgId: string,
  jamId: string,
): AttachmentSource {
  return {
    useUrl: (file, _purpose, variant = "display") => {
      const atom = fileUrlQuery(
        JSON.stringify([
          orgId,
          jamId,
          file.fileId,
          fileVariant(file, variant),
          file.name,
        ]),
      );
      const result = useAtomValue(atom);
      const refresh = useAtomRefresh(atom);
      const [mediaFailedFor, setMediaFailedFor] = useState<string>();
      const url = signedUrlOf(Option.getOrUndefined(AsyncResult.value(result)));
      const failure = AsyncResult.isFailure(result)
        ? Option.getOrUndefined(AsyncResult.error(result))
        : undefined;
      const failed =
        AsyncResult.isFailure(result) ||
        (url !== undefined && mediaFailedFor === url);
      return {
        url: failed ? undefined : url,
        failed,
        waiting: AsyncResult.isWaiting(result),
        gone: goneOf(failure),
        mediaFailed: () => setMediaFailedFor(url),
        refresh: () => {
          setMediaFailedFor(undefined);
          refresh();
        },
      };
    },
  };
}
