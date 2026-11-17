import { filesFromTransfer, pastedPlainText } from "./attachments";

export type AttachmentPasteResult =
  | {
      readonly kind: "text";
      readonly text: string;
      readonly files: ReadonlyArray<File>;
    }
  | { readonly kind: "files" }
  | { readonly kind: "none" };

/**
 * The composer's paste decision, from Capy's `onPasteCapture`. "text" means
 * paste `text` as plain text (and offer "Attach image" for `files` with the
 * "Pasted as text" toast); "files" means the files were attached. Both
 * prevent the default paste.
 */
export function handleAttachmentPaste(
  event: Pick<
    ClipboardEvent,
    "clipboardData" | "preventDefault" | "stopPropagation"
  >,
  onFilesAdded: ((files: ReadonlyArray<File>) => void) | undefined,
): AttachmentPasteResult {
  const text = pastedPlainText(event.clipboardData);
  if (text !== undefined) {
    event.preventDefault();
    event.stopPropagation();
    return {
      kind: "text",
      text,
      files:
        onFilesAdded === undefined
          ? []
          : filesFromTransfer(event.clipboardData),
    };
  }
  if (onFilesAdded === undefined) return { kind: "none" };
  const files = filesFromTransfer(event.clipboardData);
  if (files.length === 0) return { kind: "none" };
  onFilesAdded(files);
  event.preventDefault();
  event.stopPropagation();
  return { kind: "files" };
}

export const pastedAsTextToast = {
  message: "Pasted as text",
  id: "composer-pasted-as-text",
  actionLabel: "Attach image",
} as const;
