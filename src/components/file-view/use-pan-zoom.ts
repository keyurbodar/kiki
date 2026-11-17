import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clampZoom,
  defaultMaxZoom,
  defaultMinZoom,
  keyZoom,
  type PanZoomState,
  type Point,
  wheelFactor,
  zoomAround,
} from "./pan-zoom-math";

export function usePanZoom() {
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<PanZoomState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  const [nativeZoom, setNativeZoom] = useState<number>();
  const [panning, setPanning] = useState(false);
  const drag = useRef({ active: false, x: 0, y: 0, panX: 0, panY: 0 });
  const minZoom = defaultMinZoom;
  const maxZoom = Math.max(defaultMaxZoom, (nativeZoom ?? 1) * 2);

  const setZoom = (zoom: number) =>
    setState((current) => ({
      ...current,
      zoom: clampZoom(zoom, maxZoom, minZoom),
    }));
  const setPan = (pan: Point) => setState((current) => ({ ...current, pan }));

  useEffect(() => {
    if (stage === null) return;
    const measure = () => {
      const image = stage.querySelector("img");
      setNativeZoom(
        image !== null && image.naturalWidth > 0 && image.offsetWidth > 0
          ? image.naturalWidth / image.offsetWidth
          : undefined,
      );
    };
    const observer = new ResizeObserver(measure);
    const watch = () => {
      measure();
      const image = stage.querySelector("img");
      if (image !== null) observer.observe(image);
    };
    watch();
    stage.addEventListener("load", watch, true);
    return () => {
      observer.disconnect();
      stage.removeEventListener("load", watch, true);
    };
  }, [stage]);

  useEffect(() => {
    if (stage === null) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
      const factor = wheelFactor({
        deltaY: event.deltaY,
        deltaMode: event.deltaMode,
        ctrlKey: event.ctrlKey,
        pageHeight: stage.clientHeight,
      });
      const rect = stage.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      setState((current) =>
        zoomAround(current, factor, point, maxZoom, minZoom),
      );
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [stage, maxZoom]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      event.target instanceof Element &&
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return;
    const next = keyZoom(state, event.key, maxZoom, minZoom, nativeZoom);
    if (next === undefined) return;
    event.preventDefault();
    setState(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    drag.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      panX: state.pan.x,
      panY: state.pan.y,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current.active) return;
    setPan({
      x: current.panX + event.clientX - current.x,
      y: current.panY + event.clientY - current.y,
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    drag.current.active = false;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    setStage,
    zoom: state.zoom,
    pan: state.pan,
    panning,
    minZoom,
    maxZoom,
    nativeZoom,
    setZoom,
    setPan,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
