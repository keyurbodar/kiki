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
export const PAN_ZOOM_MAX = 4;
const DRAG_SLOP = 3;
const WHEEL_SPEED = 0.002;
const PINCH_WHEEL_SPEED = 0.01;
const WHEEL_CLAMP = 0.2;
const LINE_HEIGHT = 16;
const TOUCH_SLOP = 10;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;
const SWIPE_DISTANCE = 60;
const SWIPE_MIN_DISTANCE = 24;
const SWIPE_VELOCITY = 0.5;

export type Point = { x: number; y: number };

export function clampZoom(
  zoom: number,
  max = PAN_ZOOM_MAX,
  min = PAN_ZOOM_MIN,
) {
  return Math.min(max, Math.max(min, zoom));
}

/**
 * Touch gestures for a stage that also pans and pinches (the lightbox):
 * pinch-zoom, one-finger pan, double-tap and swipe between items.
 */
export type PanZoomGestures = {
  /** Resets the gesture state when it changes (the shown item). */
  key: string;
  onTap: (x: number, y: number, double: boolean) => void;
  onSwipe: (direction: 1 | -1) => void;
};

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

const NO_PAN: Point = { x: 0, y: 0 };

/**
 * Port of Capy's shared/pan-zoom hook: wheel and keyboard zoom around the
 * cursor, drag to pan and, with `gestures`, touch pinch, pan, double-tap and
 * swipe (the lightbox passes them; a still stage does not).
 */
export function usePanZoom(
  max = PAN_ZOOM_MAX,
  min = PAN_ZOOM_MIN,
  gestures?: PanZoomGestures,
): PanZoomView {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [view, setView] = useState({ zoom: 1, pan: NO_PAN as Point });
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
  const touches = useRef(new Map<number, TouchPoint>());
  const gesture = useRef<Gesture>({
    zoom: 1,
    startZoom: 1,
    distance: 0,
    pan: NO_PAN,
    pinched: false,
    moved: false,
    swipe: false,
  });
  const lastTap = useRef<{ x: number; y: number; time: number } | null>(null);

  const measurePinch = useCallback(() => {
    const [a, b] = [...touches.current.values()];
    gesture.current.startZoom = gesture.current.zoom;
    gesture.current.distance = a && b ? Math.hypot(b.x - a.x, b.y - a.y) : 0;
  }, []);

  const gestureKey = gestures?.key;
  // biome-ignore lint/correctness/useExhaustiveDependencies: resets the gesture state when the shown item changes
  useLayoutEffect(() => {
    touches.current.clear();
    lastTap.current = null;
    setPanning(false);
  }, [gestureKey]);

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
  }, [stage, gestureKey]);

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
              ? NO_PAN
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
            ? NO_PAN
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
                ? NO_PAN
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
          pan: NO_PAN,
        });
      }
    },
    [maxZoom, min, nativeZoom],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
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
        measurePinch();
        setPanning(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
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
    [gestures, measurePinch, pan, zoom],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
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
          Math.hypot(touch.x - touch.startX, touch.y - touch.startY) >
          TOUCH_SLOP
        ) {
          state.moved = true;
          lastTap.current = null;
        }
        const [a, b] = [...touches.current.values()];
        const [p0, p1] = before;
        if (a && b && p0 && p1) {
          if (state.distance === 0) {
            measurePinch();
            return;
          }
          const next = clampZoom(
            (state.startZoom * Math.hypot(b.x - a.x, b.y - a.y)) /
              state.distance,
            maxZoom,
            min,
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
      if (!pointerDown.current) return;
      const o = origin.current;
      const dx = event.clientX - o.pointerX;
      const dy = event.clientY - o.pointerY;
      if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP)
        draggedRef.current = true;
      setPan({ x: o.panX + dx, y: o.panY + dy });
    },
    [gestures, maxZoom, measurePinch, min, setPan, setZoom],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const target = event.currentTarget;
      const release = () => {
        if (target.hasPointerCapture(event.pointerId))
          target.releasePointerCapture(event.pointerId);
      };
      if (!(gestures && event.pointerType === "touch")) {
        pointerDown.current = false;
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
        measurePinch();
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
    },
    [gestures, measurePinch],
  );

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
