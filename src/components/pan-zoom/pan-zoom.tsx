import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { PanZoomControls } from "./pan-zoom-controls";
import { PAN_ZOOM_MAX, PAN_ZOOM_MIN, usePanZoom } from "./use-pan-zoom";

export type PanZoomProps = ComponentProps<"div"> & {
  maxZoom?: number;
  minZoom?: number;
  /** Show the zoom bar in the bottom-left corner. Defaults to true. */
  controls?: boolean;
  /** Extra controls appended to the zoom bar. */
  controlsExtra?: ReactNode;
};

/**
 * A stage that pans and zooms its children with Capy's shared/pan-zoom
 * behaviour: wheel or trackpad pinch around the pointer, drag to pan,
 * double-click to toggle 2x, +/-/0/1/2 keys and the zoom bar.
 */
export function PanZoom({
  maxZoom = PAN_ZOOM_MAX,
  minZoom = PAN_ZOOM_MIN,
  controls = true,
  controlsExtra,
  className,
  style,
  children,
  onKeyDown,
  ...props
}: PanZoomProps) {
  const view = usePanZoom(maxZoom, minZoom);
  const moved = view.zoom !== 1 || view.pan.x !== 0 || view.pan.y !== 0;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the stage takes pointer gestures and the zoom keys
    <div
      data-slot="pan-zoom"
      ref={view.setStage}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the stage takes focus for the zoom keys
      tabIndex={0}
      className={cx("relative overflow-hidden outline-none", className)}
      style={{
        cursor: moved ? (view.panning ? "grabbing" : "grab") : "default",
        ...style,
      }}
      onPointerDown={view.onPointerDown}
      onPointerMove={view.onPointerMove}
      onPointerUp={view.onPointerUp}
      onPointerCancel={view.onPointerUp}
      onDoubleClick={(event) => view.toggleZoom(event.clientX, event.clientY)}
      onKeyDown={(event) => {
        view.onKeyDown(event);
        onKeyDown?.(event);
      }}
      {...props}
    >
      <div
        data-slot="pan-zoom-content"
        className="flex size-full origin-center items-center justify-center backface-hidden"
        style={{
          transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})`,
          willChange: view.panning ? "transform" : undefined,
        }}
      >
        {children}
      </div>
      {controls ? (
        <PanZoomControls view={view}>{controlsExtra}</PanZoomControls>
      ) : null}
    </div>
  );
}
