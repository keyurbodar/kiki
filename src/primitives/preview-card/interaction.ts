/**
 * Behaviour every preview card shares, mirroring Capy's `ui/preview-card.tsx`:
 * the eager window that skips the open delay once one card has opened, the
 * single card that owns the pointer at a time, and the cone between a trigger
 * and its popup so travelling diagonally keeps the card open.
 */

export type Point = readonly [number, number];

export type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Open delay before any card has opened. */
export const OPEN_DELAY = 300;
/** How long a closed card keeps the next trigger instant. */
export const EAGER_COOLDOWN = 1000;
/** Grace period while the pointer travels through the cone. */
export const CONE_EXIT_DELAY = 800;
/** How far past the trigger the cone's far edge reaches. */
export const CONE_GAP = 8;

export const pointInRect = (x: number, y: number, rect: Rect) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

export const pointerFromEvent = (event: Event | undefined): Point | null =>
  event instanceof MouseEvent ? [event.clientX, event.clientY] : null;

/** The two points on the popup's near edge that, with the hover seed, form the cone. */
export const coneEdges = (
  trigger: Rect,
  popup: Rect,
): readonly [Point, Point] | null => {
  if (popup.left >= trigger.right) {
    return [
      [popup.left, trigger.top - CONE_GAP],
      [popup.left, trigger.bottom + CONE_GAP],
    ];
  }
  if (popup.right <= trigger.left) {
    return [
      [popup.right, trigger.top - CONE_GAP],
      [popup.right, trigger.bottom + CONE_GAP],
    ];
  }
  if (popup.top >= trigger.bottom) {
    return [
      [trigger.left - CONE_GAP, popup.top],
      [trigger.right + CONE_GAP, popup.top],
    ];
  }
  if (popup.bottom <= trigger.top) {
    return [
      [trigger.left - CONE_GAP, popup.bottom],
      [trigger.right + CONE_GAP, popup.bottom],
    ];
  }
  return null;
};

const sideOf = (from: Point, to: Point, x: number, y: number) =>
  (to[0] - from[0]) * (y - from[1]) - (to[1] - from[1]) * (x - from[0]);

export const pointInCone = (
  x: number,
  y: number,
  tip: Point,
  [first, second]: readonly [Point, Point],
) => {
  const a = sideOf(tip, first, x, y);
  const b = sideOf(first, second, x, y);
  const c = sideOf(second, tip, x, y);
  const negative = a < 0 || b < 0 || c < 0;
  const positive = a > 0 || b > 0 || c > 0;
  return !(negative && positive);
};

let warm = false;
let openCards = 0;
let cooldown: ReturnType<typeof setTimeout> | null = null;
const warmListeners = new Set<() => void>();

const publishWarm = (next: boolean) => {
  if (warm === next) return;
  warm = next;
  for (const listener of warmListeners) listener();
};

export const cardOpened = () => {
  openCards += 1;
  if (cooldown !== null) {
    clearTimeout(cooldown);
    cooldown = null;
  }
  publishWarm(true);
};

export const cardClosed = () => {
  openCards = Math.max(0, openCards - 1);
  if (openCards > 0) return;
  if (cooldown !== null) clearTimeout(cooldown);
  cooldown = setTimeout(() => {
    cooldown = null;
    publishWarm(false);
  }, EAGER_COOLDOWN);
};

export const subscribeWarm = (listener: () => void) => {
  warmListeners.add(listener);
  return () => {
    warmListeners.delete(listener);
  };
};

export const isWarm = () => warm;
export const warmOnServer = () => false;

let openCard: (() => void) | null = null;

export const claimOpenCard = (close: () => void) => {
  if (openCard !== null && openCard !== close) openCard();
  openCard = close;
};

export const releaseOpenCard = (close: () => void) => {
  if (openCard === close) openCard = null;
};

export const ownsOpenCard = (close: () => void) => openCard === close;

type DeferredOpen = {
  trigger: Element;
  open: () => void;
};

let deferredOpen: DeferredOpen | null = null;

export const deferOpen = (
  trigger: Element,
  open: () => void,
  delay?: number,
) => {
  deferredOpen = { trigger, open };
  if (delay === undefined) return;
  setTimeout(() => {
    if (deferredOpen?.trigger === trigger) openDeferred();
  }, delay);
};

export const clearDeferredOpen = () => {
  deferredOpen = null;
};

export const openDeferred = () => {
  const next = deferredOpen;
  deferredOpen = null;
  if (next?.trigger.matches(":hover")) next.open();
};

export type ConeElements = {
  trigger: { current: Element | null };
  popup: { current: Element | null };
  seed: { current: Point | null };
  setSeed: (seed: Point | null) => void;
  setTrigger: (element: Element | null) => void;
  setPopup: (element: Element | null) => void;
};

export const createConeElements = (): ConeElements => {
  const trigger = { current: null as Element | null };
  const popup = { current: null as Element | null };
  const seed = { current: null as Point | null };
  return {
    trigger,
    popup,
    seed,
    setSeed: (next) => {
      seed.current = next;
    },
    setTrigger: (element) => {
      trigger.current = element;
    },
    setPopup: (element) => {
      popup.current = element;
    },
  };
};

type LiveCone = {
  shields: (x: number, y: number) => boolean;
  holds: () => boolean;
};

let liveCone: LiveCone | null = null;

export const shieldedPoint = (x: number, y: number) =>
  liveCone?.shields(x, y) === true;

export const coneHolds = () => liveCone?.holds() === true;

/**
 * Follows the pointer while a card is open: closing once it leaves the trigger
 * in a direction that misses the popup, holding while it crosses the cone.
 */
export const trackCone = (elements: ConeElements, close: () => void) => {
  let seed = elements.seed.current;
  let lastPointer: Point | null = null;
  let pointerInPopup = false;
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  const clearExit = () => {
    if (exitTimer !== null) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
  };

  const bounds = () => {
    const trigger = elements.trigger.current;
    const popup = elements.popup.current;
    if (trigger === null || popup === null) return null;
    return {
      trigger: trigger.getBoundingClientRect(),
      popup: popup.getBoundingClientRect(),
    };
  };

  const inCone = (x: number, y: number) => {
    if (seed === null) return false;
    const rects = bounds();
    if (rects === null) return false;
    if (pointInRect(x, y, rects.trigger) || pointInRect(x, y, rects.popup)) {
      return false;
    }
    const edges = coneEdges(rects.trigger, rects.popup);
    return edges !== null && pointInCone(x, y, seed, edges);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rects = bounds();
    if (rects === null) return;
    const x = event.clientX;
    const y = event.clientY;
    lastPointer = [x, y];
    if (pointInRect(x, y, rects.popup)) {
      pointerInPopup = true;
      clearDeferredOpen();
      clearExit();
      return;
    }
    if (pointInRect(x, y, rects.trigger)) {
      pointerInPopup = false;
      seed = [x, y];
      clearDeferredOpen();
      clearExit();
      return;
    }
    if (pointerInPopup) {
      clearExit();
      close();
      return;
    }
    if (seed === null) return;
    const edges = coneEdges(rects.trigger, rects.popup);
    if (edges === null) return;
    if (pointInCone(x, y, seed, edges)) {
      clearExit();
      exitTimer = setTimeout(close, CONE_EXIT_DELAY);
      return;
    }
    clearExit();
    close();
  };

  const cone: LiveCone = {
    shields: (x, y) => !pointerInPopup && inCone(x, y),
    holds: () => {
      if (lastPointer === null) return false;
      const rects = bounds();
      return (
        rects !== null &&
        (pointInRect(lastPointer[0], lastPointer[1], rects.popup) ||
          inCone(lastPointer[0], lastPointer[1]))
      );
    },
  };

  liveCone = cone;
  document.addEventListener("pointermove", onPointerMove, { passive: true });

  return () => {
    clearExit();
    if (liveCone === cone) liveCone = null;
    document.removeEventListener("pointermove", onPointerMove);
    openDeferred();
  };
};
