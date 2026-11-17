import {
  type KeyboardEvent,
  type PointerEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export const PAN_ZOOM_MIN = 0.25;
export const PAN_ZOOM_STEP = 1.25;
const DEFAULT_MAX = 4;
const DRAG_SLOP = 3;
const WHEEL_SPEED = 0.002;
const PINCH_WHEEL_SPEED = 0.01;
const WHEEL_CLAMP = 0.2;
const LINE_HEIGHT = 16;

export type Point = { x: number; y: number };

export function clampZoom(zoom: number, max = DEFAULT_MAX, min = PAN_ZOOM_MIN) {
  return Math.min(max, Math.max(min, zoom));
}

export type PanZoomView = {
  stage: HTMLElement | null;
  setStage: (element: HTMLElement | null) => void;
  zoom: number;
  setZoom: (zoom: SetStateAction<number>) => void;
  maxZoom: number;
  minZoom: number;
  nativeZoom: number | undefined;
  pan: Point;
  setPan: (pan: SetStateAction<Point>) => void;
  toggleZoom: (clientX: number, clientY: number) => void;
  panning: boolean;
  dragged: () => boolean;
  setDragged: (dragged: boolean) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

/** Port of Capy's shared/pan-zoom hook: wheel and keyboard zoom around the cursor, drag to pan. */
export function usePanZoom(max = DEFAULT_MAX, min = PAN_ZOOM_MIN): PanZoomView {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [view, setView] = useState({ zoom: 1, pan: { x: 0, y: 0 } as Point });
  const [nativeZoom, setNativeZoom] = useState<number>();
  const maxZoom = Math.max(max, (nativeZoom ?? 1) * 2);
  const { zoom, pan } = view;

  const setZoom = useCallback((next: SetStateAction<number>) => {
    setView((v) => ({
      ...v,
      zoom: typeof next === "function" ? next(v.zoom) : next,
    }));
  }, []);
  const setPan = useCallback((next: SetStateAction<Point>) => {
    setView((v) => ({
      ...v,
      pan: typeof next === "function" ? next(v.pan) : next,
    }));
  }, []);

  useLayoutEffect(() => {
    setZoom((z) => clampZoom(z, maxZoom, min));
  }, [maxZoom, min, setZoom]);

  const [panning, setPanning] = useState(false);
  const pointerDown = useRef(false);
  const draggedRef = useRef(false);
  const origin = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!stage) return;
    const measure = () => {
      const img = stage.querySelector("img");
      setNativeZoom(
        img && img.naturalWidth > 0 && img.offsetWidth > 0
          ? img.naturalWidth / img.offsetWidth
          : undefined,
      );
    };
    const observer = new ResizeObserver(measure);
    const watch = () => {
      measure();
      const img = stage.querySelector("img");
      if (img) observer.observe(img);
    };
    watch();
    stage.addEventListener("load", watch, true);
    return () => {
      observer.disconnect();
      stage.removeEventListener("load", watch, true);
    };
  }, [stage]);

  useEffect(() => {
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
      const unit =
        event.deltaMode === 1
          ? LINE_HEIGHT
          : event.deltaMode === 2
            ? stage.clientHeight
            : 1;
      const delta =
        event.deltaY * unit * (event.ctrlKey ? PINCH_WHEEL_SPEED : WHEEL_SPEED);
      const factor = Math.exp(
        -Math.max(-WHEEL_CLAMP, Math.min(WHEEL_CLAMP, delta)),
      );
      const rect = stage.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      setView((v) => {
        const next = clampZoom(v.zoom * factor, maxZoom, min);
        const ratio = next / v.zoom;
        return {
          zoom: next,
          pan:
            next === min
              ? { x: 0, y: 0 }
              : { x: x - (x - v.pan.x) * ratio, y: y - (y - v.pan.y) * ratio },
        };
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [stage, maxZoom, min]);

  const toggleZoom = useCallback(
    (clientX: number, clientY: number) => {
      const next = zoom > 1 ? 1 : clampZoom(2, maxZoom, min);
      const rect = stage?.getBoundingClientRect();
      setView({
        zoom: next,
        pan:
          next === 1 || !rect
            ? { x: 0, y: 0 }
            : {
                x: -(clientX - rect.left - rect.width / 2) * (next / zoom - 1),
                y: -(clientY - rect.top - rect.height / 2) * (next / zoom - 1),
              },
      });
    },
    [zoom, maxZoom, min, stage],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        return;
      if (event.key === "+" || event.key === "=" || event.key === "-") {
        event.preventDefault();
        setView((v) => {
          const next = clampZoom(
            v.zoom * (event.key === "-" ? 1 / PAN_ZOOM_STEP : PAN_ZOOM_STEP),
            maxZoom,
            min,
          );
          const ratio = next / v.zoom;
          return {
            zoom: next,
            pan:
              next === min
                ? { x: 0, y: 0 }
                : { x: v.pan.x * ratio, y: v.pan.y * ratio },
          };
        });
        return;
      }
      if (event.key === "0" || event.key === "1" || event.key === "2") {
        event.preventDefault();
        setView({
          zoom:
            event.key === "0"
              ? 1
              : clampZoom(Number(event.key) * (nativeZoom ?? 1), maxZoom, min),
          pan: { x: 0, y: 0 },
        });
      }
    },
    [maxZoom, min, nativeZoom],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      origin.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      pointerDown.current = true;
      draggedRef.current = false;
      setPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [pan],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!pointerDown.current) return;
      const o = origin.current;
      const dx = event.clientX - o.pointerX;
      const dy = event.clientY - o.pointerY;
      if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP)
        draggedRef.current = true;
      setPan({ x: o.panX + dx, y: o.panY + dy });
    },
    [setPan],
  );

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    pointerDown.current = false;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const dragged = useCallback(() => draggedRef.current, []);
  const setDragged = useCallback((value: boolean) => {
    draggedRef.current = value;
  }, []);

  return {
    stage,
    setStage,
    zoom,
    setZoom,
    maxZoom,
    minZoom: min,
    nativeZoom,
    pan,
    setPan,
    toggleZoom,
    panning,
    dragged,
    setDragged,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onKeyDown,
  };
}
