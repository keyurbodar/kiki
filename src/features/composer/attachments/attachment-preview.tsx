import { useEffect, useState } from "react";
import { MediaContextMenu } from "@/components/media-context-menu";
import {
  LightboxVideoThumbnail,
  lightboxImageClassName,
  lightboxThumbnailClassName,
  lightboxVideoClassName,
  MediaLightbox,
  MediaLightboxActions,
} from "@/components/media-lightbox";

export type PreviewItem =
  | { key: string; label: string; kind: "image"; url: string }
  | { key: string; label: string; kind: "video"; file: File };

export type AttachmentPreviewProps = {
  items: ReadonlyArray<PreviewItem>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function useObjectUrl(file: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function VideoPreview({ file, label }: { file: File; label: string }) {
  const url = useObjectUrl(file);
  if (url === undefined) return null;
  return (
    <video
      src={url}
      aria-label={label}
      controls
      autoPlay
      className={lightboxVideoClassName}
    >
      <track kind="captions" />
    </video>
  );
}

function VideoThumbnail({ file }: { file: File }) {
  const url = useObjectUrl(file);
  return url === undefined ? null : <LightboxVideoThumbnail src={url} />;
}

const source = (item: PreviewItem) =>
  item.kind === "image"
    ? { kind: item.kind, name: item.label, url: item.url }
    : {
        kind: item.kind,
        name: item.label,
        resolveBlob: () => Promise.resolve<Blob>(item.file),
      };

/** Full-size preview of composer attachments in Capy's media lightbox. */
export function AttachmentPreview({
  items,
  index,
  onIndexChange,
  onClose,
}: AttachmentPreviewProps) {
  return (
    <MediaLightbox
      entries={items}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
      renderMedia={(item) =>
        item.kind === "image" ? (
          <MediaContextMenu {...source(item)} preview>
            <img
              crossOrigin="anonymous"
              src={item.url}
              alt={item.label}
              draggable={false}
              className={lightboxImageClassName}
            />
          </MediaContextMenu>
        ) : (
          <VideoPreview file={item.file} label={item.label} />
        )
      }
      renderThumbnail={(item) =>
        item.kind === "image" ? (
          <img
            crossOrigin="anonymous"
            src={item.url}
            alt=""
            draggable={false}
            className={lightboxThumbnailClassName}
          />
        ) : (
          <VideoThumbnail file={item.file} />
        )
      }
      renderActions={(item) => <MediaLightboxActions {...source(item)} />}
    />
  );
}
