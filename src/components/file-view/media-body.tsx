import { useContext, useState } from "react";
import { Button } from "@/primitives/button";
import type { FileContent } from "./file-content";
import { FileViewportContext } from "./file-context";
import { FileEmpty } from "./file-empty";
import { PanZoomMedia } from "./pan-zoom-media";

const track = (owner: string) =>
  `shared/files/file-view.tsx#MediaBody:${owner}`;

export type MediaBodyProps = {
  content: Extract<FileContent, { kind: "media" }>;
  name: string;
  meta?: string;
};

export function MediaBody({ content, meta }: MediaBodyProps) {
  const [attempt, setAttempt] = useState(0);
  const [failedUrl, setFailedUrl] = useState<string>();
  const onViewport = useContext(FileViewportContext);
  const retry = (
    <Button
      data-track-owner={track("Button[Retry]")}
      variant="ghost"
      size="xs"
      onClick={() => {
        setFailedUrl(undefined);
        setAttempt((current) => current + 1);
      }}
    >
      Retry
    </Button>
  );
  switch (content.media) {
    case "image":
      return (
        <PanZoomMedia
          key={content.url}
          url={content.url}
          label={content.label}
          meta={meta}
          onFailed={content.onFailed}
        />
      );
    case "pdf":
      return (
        <embed
          src={content.url}
          type="application/pdf"
          title={content.label}
          className="min-h-0 w-full flex-1 bg-secondary"
        />
      );
    case "video":
      return failedUrl === content.url ? (
        <FileEmpty line="Video unavailable" sub={meta} action={retry} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-secondary p-4">
          <video
            key={`${content.url}#${attempt}`}
            src={content.url}
            aria-label={content.label}
            controls
            onError={() => {
              setFailedUrl(content.url);
              content.onFailed?.();
            }}
            className="max-h-full max-w-full min-h-0 object-contain"
          >
            <track kind="captions" />
          </video>
        </div>
      );
    case "audio":
      return failedUrl === content.url ? (
        <FileEmpty line="Audio unavailable" sub={meta} action={retry} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <audio
            key={attempt}
            src={content.url}
            crossOrigin="anonymous"
            controls
            onError={() => {
              setFailedUrl(content.url);
              content.onFailed?.();
            }}
            className="w-full max-w-md"
          >
            <track kind="captions" />
          </audio>
        </div>
      );
    case "model":
    case "sheet":
    case "document":
      return (
        <div ref={onViewport} className="flex min-h-0 flex-1 flex-col">
          <FileEmpty line="No preview for this file" sub={meta} />
        </div>
      );
  }
}
