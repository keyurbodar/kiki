import type { ComponentProps } from "react";

export type MarkerRowProps = ComponentProps<"div">;

export function MarkerRow(props: MarkerRowProps) {
  return <div data-slot="marker-row" {...props} />;
}

export type WaitingMarkerProps = ComponentProps<"div">;

export function WaitingMarker(props: WaitingMarkerProps) {
  return <div data-slot="waiting-marker" {...props} />;
}
