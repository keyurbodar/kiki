import { useState } from "react";
import { FileToolbarSlot, FileZoomControls } from "@/components/file-toolbar";
import { Button } from "@/primitives/button";
import { FileEmpty } from "./file-empty";
import { usePanZoom } from "./use-pan-zoom";

export type PanZoomMediaProps = {
  url: string;
  label: string;
  meta?: string;
  onFailed?: () => void;
};

export function PanZoomMedia({
  url,
  label,
  meta,
  onFailed,
}: PanZoomMediaProps) {
  const view = usePanZoom();
  const [failedUrl, setFailedUrl] = useState<string>();
  if (failedUrl === url)
    return (
      <FileEmpty
        line="File unavailable"
        sub={meta}
        action={
          <Button
            data-track-owner="shared/files/file-view.tsx#PanZoomMedia:Button[Retry]"
            variant="ghost"
            size="xs"
            onClick={() => setFailedUrl(undefined)}
          >
            Retry
          </Button>
        }
      />
    );
  const controls = (
    <FileZoomControls
      zoom={view.zoom}
      minZoom={view.minZoom}
      maxZoom={view.maxZoom}
      onZoom={view.setZoom}
      onReset={() => {
        view.setZoom(1);
        view.setPan({ x: 0, y: 0 });
      }}
    />
  );
  return (
    // biome-ignore lint/a11y/useSemanticElements: the pan and zoom stage is a focusable region, as in Capy
    <div
      ref={view.setStage}
      className="relative min-h-0 flex-1 overflow-hidden bg-secondary focus-visible:outline-ring-inset"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the stage takes keyboard zoom
      tabIndex={0}
      role="region"
      aria-label={label}
      style={{
        touchAction: "none",
        cursor: view.panning ? "grabbing" : "grab",
      }}
      onPointerDown={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        view.onPointerDown(event);
      }}
      onPointerMove={view.onPointerMove}
      onPointerUp={view.onPointerUp}
      onPointerCancel={view.onPointerUp}
      onKeyDown={view.onKeyDown}
    >
      <div
        className="flex h-full w-full items-center justify-center p-4 motion-reduce:transition-none!"
        style={{
          transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})`,
          willChange: view.panning ? "transform" : undefined,
        }}
      >
        <img
          src={url}
          crossOrigin="anonymous"
          alt={label}
          draggable={false}
          onError={() => {
            setFailedUrl(url);
            onFailed?.();
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <FileToolbarSlot
        fallback={
          <div className="absolute right-2 bottom-2 flex items-center gap-0.5 rounded-md border-hairline border-border-1 bg-card px-1 py-0.5">
            {controls}
          </div>
        }
      >
        {controls}
      </FileToolbarSlot>
    </div>
  );
}
