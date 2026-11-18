import { AttachmentStrip } from "./attachment-strip";
import type { ComposerAttachmentsController as Controller } from "./use-composer-attachments";

export type ComposerAttachmentsProps = {
  attachments: Controller;
  /**
   * Kept so callers keep compiling. Page-wide file drops are tracked by the
   * composer itself (Capy's `captureDrops`), which needs the composer's
   * `onFilesAdded` and this slot to be mounted.
   */
  captureDrops?: boolean;
};

/**
 * Everything a composer shows for attachments: the chip strip. Mount it inside
 * the composer root through the composer's `attachments` slot; the composer
 * owns the hidden file input behind "Attach files", paste, and the page-wide
 * drag target.
 */
export function ComposerAttachments({ attachments }: ComposerAttachmentsProps) {
  return (
    <AttachmentStrip
      entries={attachments.entries}
      onRemove={attachments.remove}
    />
  );
}
