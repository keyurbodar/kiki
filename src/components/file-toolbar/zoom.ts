export const zoomStep = 1.25;

export const zoomOut = (zoom: number, minZoom: number) =>
  Math.max(minZoom, zoom / zoomStep);

export const zoomIn = (zoom: number, maxZoom: number) =>
  Math.min(maxZoom, zoom * zoomStep);

export const zoomPercent = (zoom: number) => Math.round(zoom * 100);
