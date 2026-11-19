import type { TimelineRow } from "@/data/events";
import {
  AttachmentTabView,
  PaneEmptyState,
} from "@/features/thread-panes/attachment-view";
import { threadUploads } from "@/features/thread-panes/files-view/thread-files";
import type { PaneTab } from "@/features/thread-panes/tab-strip";

export type AttachmentPaneProps = {
  tab: Extract<PaneTab, { kind: "attachment" }>;
  /**
   * The thread's transcript rows. A file's media type and size live on the
   * `FileRef` its message carries, and the tab only names its id, so the pane
   * resolves it from the same rows the transcript reads.
   */
  rows: readonly TimelineRow[];
};

/**
 * The `attachment` tab: a file a message carries, opened from its card. A tab
 * whose file the thread no longer holds — an older page of history, a deleted
 * message — says so instead of painting an empty frame.
 */
export function AttachmentPane({ tab, rows }: AttachmentPaneProps) {
  const attachment = threadUploads(rows).find(
    (upload) => upload.attachment.file.fileId === tab.id,
  );
  if (attachment === undefined) {
    return (
      <PaneEmptyState
        line="Attachment unavailable"
        sub={`${tab.name} is not in this thread any more`}
      />
    );
  }
  return (
    <AttachmentTabView
      file={attachment.attachment.file}
      title={tab.title ?? attachment.attachment.title}
    />
  );
}
