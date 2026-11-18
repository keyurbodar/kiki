import { useEffect, useState } from "react";
import {
  type DelayedStatusState,
  delayedStatusDeadline,
  shownDelayedStatus,
  stepDelayedStatus,
} from "./delayed-status";

/**
 * Re-renders when a deadline passes, so the caller can ask again whether it has.
 * A deadline in the past is already passed on the first read.
 */
const useDeadlinePassed = (deadline: number | null): boolean => {
  const [, tick] = useState(0);
  const passed = deadline !== null && Date.now() >= deadline;
  useEffect(() => {
    if (deadline === null || passed) return;
    const timer = setTimeout(
      () => tick((count) => count + 1),
      deadline - Date.now(),
    );
    return () => clearTimeout(timer);
  }, [deadline, passed]);
  return passed;
};

/**
 * Holds a transient status back for `showDelayMs` and then keeps it shown for
 * the same minimum, so a state that resolves instantly never flashes and one
 * that does appear stays long enough to read. Returns the value to show, or
 * `null` while it is being held back.
 */
export const useDelayedStatus = <A>(
  key: string,
  value: A | null,
  showDelayMs?: number,
): A | null => {
  const [state, setState] = useState<DelayedStatusState<A>>(() =>
    stepDelayedStatus<A>(
      null,
      { key, value, deadlinePassed: false, showDelayMs },
      Date.now,
    ),
  );
  const deadlinePassed = useDeadlinePassed(delayedStatusDeadline(state));
  const next = stepDelayedStatus(
    state,
    { key, value, deadlinePassed, showDelayMs },
    Date.now,
  );
  if (next !== state) setState(next);
  return shownDelayedStatus(next, key);
};
