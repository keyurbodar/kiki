import { Duration, Option } from "effect";
import { type AsyncResult, Atom } from "effect/reactivity";
import { useMemo } from "react";

/**
 * A read that refreshes itself when a surface mounts again, so coming back to a
 * screen shows the server rather than the snapshot from when you left.
 *
 * Our query atoms keep their node alive for `queryTimeToLive`, so a remount
 * inside that window replays the cache and never asks again — a thread list you
 * looked at two minutes ago is still the list from two minutes ago, with no
 * refetch and no way for the reader to know. `Atom.swr` does not close this on
 * its own: it checks staleness when its node builds, and an idle TTL means the
 * node never rebuilds. This wrapper reads `self` as a dependency instead of
 * subscribing to it, so the wrapper itself goes idle with its last reader while
 * the cached value stays in `self`.
 *
 * Ported from t3code (`packages/client-runtime/src/state/runtime.ts`).
 */
export const revalidateOnMount =
  (staleTime: Duration.Input) =>
  <A, E>(
    self: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  ): Atom.Atom<AsyncResult.AsyncResult<A, E>> =>
    Atom.transform(
      self,
      (get) => {
        const current = get(self);
        // Only on a fresh build: a rebuild caused by a value change is not a mount.
        if (Option.isNone(get.self()) && isStale(current, staleTime)) {
          let active = true;
          get.addFinalizer(() => {
            active = false;
          });
          /**
           * Deferred out of the build, which runs while React renders: a plain
           * read here would drop this node before the task ran, and every
           * render would refetch instead of every mount.
           */
          setTimeout(() => {
            if (active && isStale(get(self), staleTime)) get.refresh(self);
          }, 0);
        }
        return current;
      },
      { initialValueTarget: self },
    );

const isStale = (
  result: AsyncResult.AsyncResult<unknown, unknown>,
  staleTime: Duration.Input,
): boolean => {
  if (result.waiting) return false;
  const success =
    result._tag === "Failure"
      ? Option.getOrUndefined(result.previousSuccess)
      : result;
  if (success?._tag !== "Success") return result._tag === "Failure";
  return Date.now() - success.timestamp >= Duration.toMillis(staleTime);
};

/**
 * Revalidation belongs to the surface that mounts, not to the shared atom.
 *
 * Wrapping the atom itself puts the trigger on a node the whole shell reads:
 * `CommandPaletteHost` and the project select live for the app's lifetime, so a
 * wrapper they share never idles, never rebuilds, and never fires — the screen
 * it was supposed to refresh is the one thing it cannot reach. This holds one
 * wrapper per surface instead, so the node idles when that surface unmounts and
 * rebuilds when the reader comes back. The cached value stays shared, because
 * every wrapper reads the same underlying atom.
 */
export const useRevalidatedAtom = <A, E>(
  atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  staleTime: Duration.Input,
): Atom.Atom<AsyncResult.AsyncResult<A, E>> =>
  useMemo(() => revalidateOnMount(staleTime)(atom), [atom, staleTime]);
