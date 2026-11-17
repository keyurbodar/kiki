import {
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export const MIN_ZOOM = 0.25;
export const DEFAULT_MAX_ZOOM = 4;
export const ZOOM_STEP = 1.25;
const DRAG_THRESHOLD = 3;
const TOUCH_SLOP = 10;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;
const SWIPE_DISTANCE = 60;
const SWIPE_MIN_DISTANCE = 24;
const SWIPE_VELOCITY = 0.5;

export type Point = { x: number; y: number };

export function clampZoom(
  zoom: number,
  max = DEFAULT_MAX_ZOOM,
  min = MIN_ZOOM,
) {
  return Math.min(max, Math.max(min, zoom));
}

/** Touch gestures for a stage that also pans and pinches (the lightbox). */
export type PanZoomGestures = {
  /** Resets the gesture state when it changes (the shown item). */
  key: string;
  onTap: (x: number, y: number, double: boolean) => void;
  onSwipe: (direction: 1 | -1) => void;
};

export type PanZoomView = {
  stage: HTMLElement | null;
  setStage: (stage: HTMLElement | null) => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  maxZoom: number;
  minZoom: number;
  /** Zoom at which the stage's image shows at its natural size, once loaded. */
  nativeZoom: number | undefined;
  pan: Point;
  setPan: Dispatch<SetStateAction<Point>>;
  /** Double-click: zoom to 2x at the pointer, or back to fit. */
  toggleZoom: (clientX: number, clientY: number) => void;
  panning: boolean;
  dragged: () => boolean;
  setDragged: (dragged: boolean) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

type TouchPoint = Point & { startX: number; startY: number; time: number };

type Gesture = {
  zoom: number;
  startZoom: number;
  distance: number;
  pan: Point;
  pinched: boolean;
  moved: boolean;
  swipe: boolean;
};

const ORIGIN: Point = { x: 0, y: 0 };

/**
 * Capy's shared/pan-zoom hook: wheel and ctrl-wheel (trackpad pinch) zoom
 * around the pointer, drag to pan, +/-/0/1/2 keys, double-click toggle and,
 * with `gestures`, touch pinch, pan, double-tap and swipe.
 */
export function usePanZoom(
  maxZoomOption = DEFAULT_MAX_ZOOM,
  gestures?: PanZoomGestures,
  minZoom = MIN_ZOOM,
): PanZoomView {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<{ zoom: number; pan: Point }>({
    zoom: 1,
    pan: ORIGIN,
  });
  const { zoom, pan } = view;
  const [nativeZoom, setNativeZoom] = useState<number>();
  const maxZoom = Math.max(maxZoomOption, (nativeZoom ?? 1) * 2);

  const setZoom: Dispatch<SetStateAction<number>> = (next) =>
    setView((current) => ({
      ...current,
      zoom: typeof next === "function" ? next(current.zoom) : next,
    }));
  const setPan: Dispatch<SetStateAction<Point>> = (next) =>
    setView((current) => ({
      ...current,
      pan: typeof next === "function" ? next(current.pan) : next,
    }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: setZoom only wraps the stable setView
  useLayoutEffect(() => {
    setZoom((current) => clampZoom(current, maxZoom, minZoom));
  }, [maxZoom, minZoom]);

  const [panning, setPanning] = useState(false);
  const mouseDown = useRef(false);
  const dragMoved = useRef(false);
  const dragStart = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });
  const touches = useRef(new Map<number, TouchPoint>());
  const gesture = useRef<Gesture>({
    zoom: 1,
    startZoom: 1,
    distance: 0,
    pan: ORIGIN,
    pinched: false,
    moved: false,
    swipe: false,
  });
  const lastTap = useRef<{ x: number; y: number; time: number } | null>(null);

  const resetPinch = () => {
    const [a, b] = [...touches.current.values()];
    gesture.current.startZoom = gesture.current.zoom;
    gesture.current.distance = a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0;
  };

  const gestureKey = gestures?.key;
  // biome-ignore lint/correctness/useExhaustiveDependencies: resets when the shown item changes
  useLayoutEffect(() => {
    touches.current.clear();
    lastTap.current = null;
    setPanning(false);
  }, [gestureKey]);

  const toggleZoom = (clientX: number, clientY: number) => {
    const next = zoom > 1 ? 1 : clampZoom(2, maxZoom, minZoom);
    const rect = stage?.getBoundingClientRect();
    setZoom(next);
    setPan(
      next === 1 || !rect
        ? ORIGIN
        : {
            x: -(clientX - rect.left - rect.width / 2) * (next / zoom - 1),
            y: -(clientY - rect.top - rect.height / 2) * (next / zoom - 1),
          },
    );
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the shown item changes
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
    const observe = () => {
      measure();
      const img = stage.querySelector("img");
      if (img) observer.observe(img);
    };
    observe();
    stage.addEventListener("load", observe, true);
    return () => {
      observer.disconnect();
      stage.removeEventListener("load", observe, true);
    };
  }, [stage, gestureKey]);

  useEffect(() => {
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientHeight
            : 1;
      const delta = event.deltaY * unit * (event.ctrlKey ? 0.01 : 0.002);
      const factor = Math.exp(-Math.max(-0.2, Math.min(0.2, delta)));
      const rect = stage.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      setView((current) => {
        const next = clampZoom(current.zoom * factor, maxZoom, minZoom);
        const ratio = next / current.zoom;
        return {
          zoom: next,
          pan:
            next === minZoom
              ? ORIGIN
              : {
                  x: x - (x - current.pan.x) * ratio,
                  y: y - (y - current.pan.y) * ratio,
                },
        };
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [stage, maxZoom, minZoom]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;
    if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      setView((current) => {
        const next = clampZoom(
          current.zoom * (event.key === "-" ? 1 / ZOOM_STEP : ZOOM_STEP),
          maxZoom,
          minZoom,
        );
        const ratio = next / current.zoom;
        return {
          zoom: next,
          pan:
            next === minZoom
              ? ORIGIN
              : { x: current.pan.x * ratio, y: current.pan.y * ratio },
        };
      });
    } else if (event.key === "0" || event.key === "1" || event.key === "2") {
      event.preventDefault();
      setView({
        zoom:
          event.key === "0"
            ? 1
            : clampZoom(
                Number(event.key) * (nativeZoom ?? 1),
                maxZoom,
                minZoom,
              ),
        pan: ORIGIN,
      });
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (gestures && event.pointerType === "touch") {
      if (touches.current.size === 0)
        gesture.current = {
          zoom,
          startZoom: zoom,
          distance: 0,
          pan,
          pinched: false,
          moved: false,
          swipe: zoom <= 1 && pan.x === 0 && pan.y === 0,
        };
      touches.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        time: event.timeStamp,
      });
      if (touches.current.size > 1) {
        gesture.current.pinched = true;
        lastTap.current = null;
      }
      resetPinch();
      setPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    mouseDown.current = true;
    dragMoved.current = false;
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (gestures && event.pointerType === "touch") {
      const touch = touches.current.get(event.pointerId);
      if (!touch) return;
      const before = [...touches.current.values()]
        .slice(0, 2)
        .map(({ x, y }) => ({ x, y }));
      const dx = event.clientX - touch.x;
      const dy = event.clientY - touch.y;
      touch.x = event.clientX;
      touch.y = event.clientY;
      const state = gesture.current;
      const previousPan = state.pan;
      if (
        Math.hypot(touch.x - touch.startX, touch.y - touch.startY) > TOUCH_SLOP
      ) {
        state.moved = true;
        lastTap.current = null;
      }
      const [a, b] = [...touches.current.values()];
      const [p0, p1] = before;
      if (a && b && p0 && p1) {
        if (state.distance === 0) {
          resetPinch();
          return;
        }
        const next = clampZoom(
          (state.startZoom * Math.hypot(b.x - a.x, b.y - a.y)) / state.distance,
          maxZoom,
          minZoom,
        );
        const ratio = next / state.zoom;
        const rect = event.currentTarget.getBoundingClientRect();
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        state.pan = {
          x:
            ratio * state.pan.x +
            (1 - ratio) * (midX - rect.left - rect.width / 2) +
            (a.x + b.x) / 2 -
            midX,
          y:
            ratio * state.pan.y +
            (1 - ratio) * (midY - rect.top - rect.height / 2) +
            (a.y + b.y) / 2 -
            midY,
        };
        state.zoom = next;
        setZoom(next);
      } else if (state.zoom > 1 || state.pan.x !== 0 || state.pan.y !== 0) {
        state.pan = { x: state.pan.x + dx, y: state.pan.y + dy };
      }
      if (state.pan.x !== previousPan.x || state.pan.y !== previousPan.y)
        setPan(state.pan);
      return;
    }
    if (!mouseDown.current) return;
    const start = dragStart.current;
    const dx = event.clientX - start.pointerX;
    const dy = event.clientY - start.pointerY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
      dragMoved.current = true;
    setPan({ x: start.panX + dx, y: start.panY + dy });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const release = () => {
      if (target.hasPointerCapture(event.pointerId))
        target.releasePointerCapture(event.pointerId);
    };
    if (!(gestures && event.pointerType === "touch")) {
      mouseDown.current = false;
      setPanning(false);
      release();
      return;
    }
    const touch = touches.current.get(event.pointerId);
    if (!touch) return;
    touches.current.delete(event.pointerId);
    release();
    if (event.type !== "pointerup") {
      touches.current.clear();
      lastTap.current = null;
      setPanning(false);
      return;
    }
    if (touches.current.size > 0) {
      resetPinch();
      return;
    }
    setPanning(false);
    const state = gesture.current;
    if (state.pinched) return;
    const dx = event.clientX - touch.startX;
    const dy = event.clientY - touch.startY;
    const distance = Math.abs(dx);
    if (
      state.swipe &&
      distance >= 2 * Math.abs(dy) &&
      (distance >= SWIPE_DISTANCE ||
        (distance >= SWIPE_MIN_DISTANCE &&
          distance / Math.max(1, event.timeStamp - touch.time) >=
            SWIPE_VELOCITY))
    ) {
      lastTap.current = null;
      gestures.onSwipe(dx < 0 ? 1 : -1);
    } else if (!state.moved && Math.hypot(dx, dy) <= TOUCH_SLOP) {
      const previous = lastTap.current;
      const double =
        previous !== null &&
        event.timeStamp - previous.time <= DOUBLE_TAP_MS &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <=
          DOUBLE_TAP_SLOP;
      lastTap.current = double
        ? null
        : { x: event.clientX, y: event.clientY, time: event.timeStamp };
      gestures.onTap(event.clientX, event.clientY, double);
    }
  };

  return {
    stage,
    setStage,
    zoom,
    setZoom,
    maxZoom,
    minZoom,
    nativeZoom,
    pan,
    setPan,
    toggleZoom,
    panning,
    dragged: () => dragMoved.current,
    setDragged: (dragged) => {
      dragMoved.current = dragged;
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onKeyDown,
  };
}
