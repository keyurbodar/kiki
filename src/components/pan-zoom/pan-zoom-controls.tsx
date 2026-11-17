import type { ReactNode } from "react";
import {
  MinusSmallIcon,
  PlusLargeIcon,
  RotateLeftIcon,
} from "@/components/markdown/icons";
import { Button } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { clampZoom, PAN_ZOOM_STEP, type PanZoomView } from "./use-pan-zoom";

function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={typeof children === "string" ? "xs" : "icon-xs"}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export type PanZoomControlsProps = {
  view: PanZoomView;
  children?: ReactNode;
};

/** Capy's shared/pan-zoom PanZoomControls: the floating zoom bar in the stage's bottom-left corner. */
export function PanZoomControls({ view, children }: PanZoomControlsProps) {
  const percent = Math.round((view.zoom / (view.nativeZoom ?? 1)) * 100);
  return (
    <div
      data-slot="pan-zoom-controls"
      className="absolute bottom-3 left-3 flex cursor-default items-center gap-0.5 rounded-(--radius) border-(length:--hairline) border-border-2 bg-popover px-1 py-0.5 shadow-overlay"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ZoomButton
        label="Zoom out"
        disabled={view.zoom <= view.minZoom}
        onClick={() =>
          view.setZoom((z) =>
            clampZoom(z / PAN_ZOOM_STEP, view.maxZoom, view.minZoom),
          )
        }
      >
        <MinusSmallIcon />
      </ZoomButton>
      <span className="min-w-10 text-center text-xs font-normal text-muted-foreground-1 tabular-nums">
        {percent}%
      </span>
      <ZoomButton
        label="Zoom in"
        disabled={view.zoom >= view.maxZoom}
        onClick={() =>
          view.setZoom((z) =>
            clampZoom(z * PAN_ZOOM_STEP, view.maxZoom, view.minZoom),
          )
        }
      >
        <PlusLargeIcon />
      </ZoomButton>
      {view.nativeZoom !== undefined && (
        <>
          <ZoomButton
            label="Actual size (1)"
            onClick={() => {
              view.setZoom(
                clampZoom(view.nativeZoom ?? 1, view.maxZoom, view.minZoom),
              );
              view.setPan({ x: 0, y: 0 });
            }}
          >
            100%
          </ZoomButton>
          <ZoomButton
            label="Double size (2)"
            onClick={() => {
              view.setZoom(
                clampZoom(
                  (view.nativeZoom ?? 1) * 2,
                  view.maxZoom,
                  view.minZoom,
                ),
              );
              view.setPan({ x: 0, y: 0 });
            }}
          >
            200%
          </ZoomButton>
        </>
      )}
      <ZoomButton
        label="Reset view (0)"
        onClick={() => {
          view.setZoom(1);
          view.setPan({ x: 0, y: 0 });
        }}
      >
        <RotateLeftIcon />
      </ZoomButton>
      {children}
    </div>
  );
}
