import { AsyncResult, Atom } from "effect/reactivity";

/**
 * An atom that holds nothing and subscribes to nothing, standing in for a query
 * while the id it would be keyed on is not known yet.
 *
 * Subscribing with a placeholder id (`"" as OrgId`) fires a request that cannot
 * succeed on every mount, and the client hashes those error graphs as it
 * deduplicates them. Readers already treat an initial result as "not loaded",
 * so handing them this instead changes nothing they can observe.
 */
export const idleAtom = <A, E = unknown>(): Atom.Atom<
  AsyncResult.AsyncResult<A, E>
> =>
  Atom.make(AsyncResult.initial(false)) as Atom.Atom<
    AsyncResult.AsyncResult<A, E>
  >;
