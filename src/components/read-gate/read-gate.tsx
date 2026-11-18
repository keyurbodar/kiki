import { useAtomRefresh } from "@effect/atom-react";
import { AsyncResult, type Atom } from "effect/reactivity";
import type { ReactNode } from "react";
import { FailedRead } from "@/components/failed-read";
import { SettingsLoadingCard } from "@/components/settings-page";

export type ReadGateProps<A, E> = {
  /** The read this gate covers. */
  result: AsyncResult.AsyncResult<A, E>;
  /** The atom behind `result`, so the failed state can re-run it. */
  atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>;
  /** What could not be loaded, in the surface's own words. */
  line: string;
  /** What that means for the reader, when the surface can say. */
  sub?: string;
  /** The surface's slot, so its own test can find the failed state. */
  slot?: string;
  /** The pending state, when the surface has a better one than a settings card. */
  pending?: ReactNode;
  /** The ready state. */
  children: (value: A) => ReactNode;
};

/**
 * A read as its three states: pending, failed and ready.
 *
 * The pages it replaces gated on `value === undefined`, which is true both
 * while a read is on its way and after it failed, so a broken read sat on a
 * skeleton forever. Success renders the children, failure renders `FailedRead`
 * with a Retry, and only a read that has not settled renders the pending state.
 */
export function ReadGate<A, E>({
  result,
  atom,
  line,
  sub,
  slot,
  pending,
  children,
}: ReadGateProps<A, E>) {
  const retry = useAtomRefresh(atom);
  if (AsyncResult.isFailure(result)) {
    return (
      <FailedRead
        slot={slot ?? "read-failed"}
        line={line}
        {...(sub === undefined ? {} : { sub })}
        onRetry={retry}
      />
    );
  }
  if (!AsyncResult.isSuccess(result)) {
    return <>{pending ?? <SettingsLoadingCard />}</>;
  }
  return <>{children(result.value)}</>;
}
