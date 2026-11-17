import { useEffect, useState } from "react";
import {
  type AttachmentFile,
  attachmentKind,
  downloadUrl,
  formatBytes,
  useAttachmentUrl,
} from "@/features/thread/attachment-gallery";
import { attachmentFailureLine } from "@/features/thread/attachment-gallery/attachment-source";
import {
  AttachmentArchiveView,
  isZipFile,
} from "@/features/thread-panes/attachment-archive";
import {
  AttachmentBody,
  type AttachmentContent,
  AttachmentFrame,
  PaneEmptyState,
  PaneLoading,
  RetryButton,
  textContent,
} from "./frame";

const track = (owner: string) =>
  `features/thread/pane/attachment-view.tsx#${owner}`;

export const TEXT_GATE_BYTES = 1_000_000;

export const attachmentMeta = (
  file: Pick<AttachmentFile, "mediaType" | "sizeBytes">,
) =>
  `${file.mediaType.split("/").at(-1) ?? "file"} · ${formatBytes(file.sizeBytes)}`;

type TextLoad = { status: "loaded"; text: string } | { status: "failed" };

export function useAttachmentText(url: string | undefined, attempt: number) {
  const [state, setState] = useState<{
    url: string;
    attempt: number;
    value: TextLoad;
  }>();
  useEffect(() => {
    if (url === undefined) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.text()
          : Promise.reject(new Error(response.statusText)),
      )
      .then(
        (text) => setState({ url, attempt, value: { status: "loaded", text } }),
        () => {
          if (!controller.signal.aborted)
            setState({ url, attempt, value: { status: "failed" } });
        },
      );
    return () => controller.abort();
  }, [attempt, url]);
  return state !== undefined && state.url === url && state.attempt === attempt
    ? state.value
    : undefined;
}

export type AttachmentFileBodyProps = {
  file: AttachmentFile;
  title?: string;
  onRetry: () => void;
  attempt: number;
};

export function AttachmentFileBody({
  file,
  title,
  onRetry,
  attempt,
}: AttachmentFileBodyProps) {
  const resolved = useAttachmentUrl(file, "file-body", "original");
  const [ungated, setUngated] = useState(false);
  const media = attachmentKind(file);
  const gated =
    media === undefined && file.sizeBytes > TEXT_GATE_BYTES && !ungated;
  const text = useAttachmentText(
    media === undefined && !gated ? resolved.url : undefined,
    attempt,
  );
  const meta = attachmentMeta(file);
  if ((resolved.failed && !resolved.waiting) || text?.status === "failed")
    return (
      <PaneEmptyState
        line={attachmentFailureLine(resolved.gone)}
        sub={meta}
        action={
          <RetryButton
            owner={track("AttachmentFile:RetryButton.1")}
            onRetry={() => {
              if (resolved.failed) resolved.refresh();
              onRetry();
            }}
          />
        }
      />
    );
  const content: AttachmentContent | undefined =
    media !== undefined && resolved.url !== undefined
      ? {
          kind: "media",
          media,
          url: resolved.url,
          label: title ?? file.name,
          onFailed: resolved.mediaFailed,
        }
      : gated
        ? {
            kind: "gated",
            sizeBytes: file.sizeBytes,
            onLoad: () => setUngated(true),
          }
        : text?.status === "loaded"
          ? textContent(text.text)
          : undefined;
  if (content === undefined) return <PaneLoading />;
  return <AttachmentBody content={content} sizeLabel={formatBytes} />;
}

export type AttachmentTabViewProps = {
  file: AttachmentFile;
  title?: string;
};

export function AttachmentTabView({ file, title }: AttachmentTabViewProps) {
  const download = useAttachmentUrl(file, "file-tab", "original");
  const [attempt, setAttempt] = useState(0);
  if (isZipFile(file))
    return <AttachmentArchiveView file={file} title={title} />;
  const path = file.sourcePath ?? title ?? file.name;
  const url = download.url;
  return (
    <AttachmentFrame
      name={file.name}
      meta={attachmentMeta(file)}
      path={path}
      copyPath={path}
      download
      onDownload={
        url === undefined
          ? undefined
          : () => void downloadUrl(url, file.name).catch(() => {})
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AttachmentFileBody
          key={file.fileId}
          file={file}
          title={title}
          attempt={attempt}
          onRetry={() => setAttempt(attempt + 1)}
        />
      </div>
    </AttachmentFrame>
  );
}
