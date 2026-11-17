export type Point = { x: number; y: number };

export type PanZoomState = { zoom: number; pan: Point };

export const defaultMinZoom = 0.25;
export const defaultMaxZoom = 4;
export const panZoomStep = 1.25;

export const clampZoom = (
  zoom: number,
  maxZoom = defaultMaxZoom,
  minZoom = defaultMinZoom,
) => Math.min(maxZoom, Math.max(minZoom, zoom));

export function wheelFactor({
  deltaY,
  deltaMode,
  ctrlKey,
  pageHeight,
}: {
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  pageHeight: number;
}) {
  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? pageHeight : 1;
  const delta = deltaY * unit * (ctrlKey ? 0.01 : 0.002);
  return Math.exp(-Math.max(-0.2, Math.min(0.2, delta)));
}

export function zoomAround(
  state: PanZoomState,
  factor: number,
  point: Point,
  maxZoom: number,
  minZoom: number,
): PanZoomState {
  const zoom = clampZoom(state.zoom * factor, maxZoom, minZoom);
  const ratio = zoom / state.zoom;
  return {
    zoom,
    pan:
      zoom === minZoom
        ? { x: 0, y: 0 }
        : {
            x: point.x - (point.x - state.pan.x) * ratio,
            y: point.y - (point.y - state.pan.y) * ratio,
          },
  };
}

export function keyZoom(
  state: PanZoomState,
  key: string,
  maxZoom: number,
  minZoom: number,
  nativeZoom = 1,
): PanZoomState | undefined {
  if (key === "+" || key === "=" || key === "-")
    return zoomAround(
      state,
      key === "-" ? 1 / panZoomStep : panZoomStep,
      { x: 0, y: 0 },
      maxZoom,
      minZoom,
    );
  if (key === "0" || key === "1" || key === "2")
    return {
      zoom:
        key === "0" ? 1 : clampZoom(Number(key) * nativeZoom, maxZoom, minZoom),
      pan: { x: 0, y: 0 },
    };
  return undefined;
}
