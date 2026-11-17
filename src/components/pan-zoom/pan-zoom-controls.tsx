import type { PointerEvent, ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { clampZoom, type PanZoomView, ZOOM_STEP } from "./use-pan-zoom";

export type ZoomButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

export function ZoomButton({
  label,
  disabled,
  onClick,
  children,
}: ZoomButtonProps) {
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
  /** Extra controls after the reset button. */
  children?: ReactNode;
};

const stopPropagation = (event: PointerEvent) => event.stopPropagation();

/** Capy's PanZoomControls: zoom out, percentage, zoom in, 100%, 200%, reset. */
export function PanZoomControls({ view, children }: PanZoomControlsProps) {
  const resetPan = () => view.setPan({ x: 0, y: 0 });
  return (
    <div
      data-slot="pan-zoom-controls"
      className="absolute bottom-3 left-3 flex cursor-default items-center gap-0.5 rounded-(--radius) border-(length:--border-width-hairline) border-border-2 bg-popover px-1 py-0.5 shadow-overlay"
      onPointerDown={stopPropagation}
    >
      <ZoomButton
        label="Zoom out"
        disabled={view.zoom <= view.minZoom}
        onClick={() =>
          view.setZoom((zoom) =>
            clampZoom(zoom / ZOOM_STEP, view.maxZoom, view.minZoom),
          )
        }
      >
        <Icon name="minus-small" />
      </ZoomButton>
      <span className="min-w-10 text-center text-xs font-normal text-muted-foreground-1 tabular-nums">
        {Math.round((view.zoom / (view.nativeZoom ?? 1)) * 100)}%
      </span>
      <ZoomButton
        label="Zoom in"
        disabled={view.zoom >= view.maxZoom}
        onClick={() =>
          view.setZoom((zoom) =>
            clampZoom(zoom * ZOOM_STEP, view.maxZoom, view.minZoom),
          )
        }
      >
        <Icon name="plus-large" />
      </ZoomButton>
      {view.nativeZoom === undefined ? null : (
        <>
          <ZoomButton
            label="Actual size (1)"
            onClick={() => {
              view.setZoom(
                clampZoom(view.nativeZoom ?? 1, view.maxZoom, view.minZoom),
              );
              resetPan();
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
              resetPan();
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
          resetPan();
        }}
      >
        <Icon name="arrow-rotate-counter-clockwise" />
      </ZoomButton>
      {children}
    </div>
  );
}
