import { Atom } from "effect/reactivity";

/**
 * Whether a thread's composer holds something that has not been sent. The
 * composer writes it on every change and the sidebar row reads it, so the two
 * never disagree about a thread having an unsent draft. Nothing persists it:
 * like the draft itself, it lives as long as the page does.
 */
export const hasDraftAtom = Atom.family((_threadId: string) =>
  Atom.make(false),
);
