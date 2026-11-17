import { useEffect, useRef } from "react";
import { AttachmentStrip } from "./attachment-strip";
import { AttachmentDropOverlay } from "./drop-overlay";
import { useAttachmentDrop } from "./use-attachment-drop";
import type { ComposerAttachmentsController as Controller } from "./use-composer-attachments";

export type ComposerAttachmentsProps = {
  attachments: Controller;
  /** Catch files dropped anywhere on the page (Capy's `captureDrops`). */
  captureDrops?: boolean;
};

/**
 * Everything a composer shows for attachments: the chip strip, the hidden
 * file input the composer's "Attach files" action clicks, and the page-wide
 * drop overlay. Mount it inside the composer root (`data-slot="composer"`)
 * through the composer's `attachments` slot.
 */
export function ComposerAttachments({
  attachments,
  captureDrops = true,
}: ComposerAttachmentsProps) {
  const anchor = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLElement | null>(null);
  const { dragging, activate } = useAttachmentDrop(
    root,
    attachments.add,
    captureDrops,
  );

  useEffect(() => {
    const input = anchor.current;
    root.current =
      input?.closest<HTMLElement>("[data-slot='composer']") ??
      input?.parentElement ??
      null;
    const element = root.current;
    if (element === null) return;
    element.addEventListener("focusin", activate, true);
    element.addEventListener("pointerdown", activate, true);
    return () => {
      element.removeEventListener("focusin", activate, true);
      element.removeEventListener("pointerdown", activate, true);
    };
  }, [activate]);

  return (
    <>
      <AttachmentDropOverlay open={dragging} />
      <input
        ref={anchor}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          attachments.add(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <AttachmentStrip
        entries={attachments.entries}
        onRemove={attachments.remove}
      />
    </>
  );
}
