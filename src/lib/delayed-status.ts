/**
 * A status shows only after it has stayed set for a moment, then stays shown for
 * a minimum time, so a quick flicker never reaches the screen.
 *
 * A state that resolves in a moment — a build record still loading when the
 * card mounts — prints "Starting" for a frame and then replaces it. The reader
 * sees a flash and learns nothing. Held back, the flash never happens; once a
 * status does appear it is guaranteed to stay long enough to read.
 *
 * Ported from t3code (`packages/client-runtime/src/delayedStatus.ts`).
 */
export const STATUS_SHOW_DELAY_MS = readMs("--delay-status", 400);
export const STATUS_MIN_VISIBLE_MS = STATUS_SHOW_DELAY_MS;

export type DelayedStatusState<A> =
  | { readonly phase: "idle"; readonly key: string }
  | { readonly phase: "pending"; readonly key: string; readonly showAt: number }
  | {
      readonly phase: "shown";
      readonly key: string;
      readonly value: A;
      readonly holdUntil: number;
    };

export type DelayedStatusInput<A> = {
  readonly key: string;
  /** Compared by identity, so use strings or other stable values. */
  readonly value: A | null;
  readonly deadlinePassed: boolean;
  readonly showDelayMs?: number | undefined;
};

/**
 * Returns `state` itself when nothing changes, so it can run on every render.
 * `now` is a function because a memoizing caller (the React Compiler) would
 * otherwise cache a stale clock reading.
 */
export function stepDelayedStatus<A>(
  state: DelayedStatusState<A> | null,
  {
    key,
    value,
    deadlinePassed,
    showDelayMs = STATUS_SHOW_DELAY_MS,
  }: DelayedStatusInput<A>,
  now: () => number,
): DelayedStatusState<A> {
  const idle = (): DelayedStatusState<A> => ({ phase: "idle", key });
  const pending = (): DelayedStatusState<A> => ({
    phase: "pending",
    key,
    showAt: now() + showDelayMs,
  });
  const shown = (shownValue: A): DelayedStatusState<A> => ({
    phase: "shown",
    key,
    value: shownValue,
    holdUntil: now() + STATUS_MIN_VISIBLE_MS,
  });

  if (state === null || state.key !== key)
    return value === null ? idle() : pending();
  switch (state.phase) {
    case "idle":
      return value === null ? state : pending();
    case "pending":
      if (value === null) return idle();
      return deadlinePassed ? shown(value) : state;
    case "shown":
      if (value === null) return deadlinePassed ? idle() : state;
      return value === state.value ? state : shown(value);
  }
}

export function delayedStatusDeadline<A>(
  state: DelayedStatusState<A>,
): number | null {
  switch (state.phase) {
    case "idle":
      return null;
    case "pending":
      return state.showAt;
    case "shown":
      return state.holdUntil;
  }
}

export function shownDelayedStatus<A>(
  state: DelayedStatusState<A>,
  key: string,
): A | null {
  return state.phase === "shown" && state.key === key ? state.value : null;
}

function readMs(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (raw === "") return fallback;
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith("ms") ? value : value * 1000;
}
