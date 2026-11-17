import { useEffect, useState } from "react";
import {
  Dialog,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/primitives/dialog";

export type PreviewItem =
  | { key: string; label: string; kind: "image"; url: string }
  | { key: string; label: string; kind: "video"; file: File };

export type AttachmentPreviewProps = {
  items: ReadonlyArray<PreviewItem>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function VideoPreview({ file, label }: { file: File; label: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (url === undefined) return null;
  return (
    <video
      src={url}
      aria-label={label}
      controls
      autoPlay
      className="max-h-full max-w-full"
    >
      <track kind="captions" />
    </video>
  );
}

/**
 * Full-size preview of a composer attachment. Capy opens its media lightbox
 * here (components/media-lightbox, B12); until that lands this is a plain
 * dialog with the same open/close/arrow-key contract.
 */
export function AttachmentPreview({
  items,
  index,
  onIndexChange,
  onClose,
}: AttachmentPreviewProps) {
  const item = items[index];
  if (item === undefined) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay scrim="media" forceRender />
        <DialogPopup
          className="fixed inset-0 z-(--z-overlay-content) flex items-center justify-center p-6 outline-none"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" && index < items.length - 1)
              onIndexChange(index + 1);
            if (event.key === "ArrowLeft" && index > 0)
              onIndexChange(index - 1);
          }}
        >
          <DialogTitle className="sr-only">{item.label}</DialogTitle>
          {item.kind === "image" ? (
            <img
              crossOrigin="anonymous"
              src={item.url}
              alt={item.label}
              draggable={false}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <VideoPreview file={item.file} label={item.label} />
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
