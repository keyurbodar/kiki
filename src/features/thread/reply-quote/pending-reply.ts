import { Atom } from "effect/reactivity";
import type { ReplyTarget } from "@/features/thread/message-footer";

/**
 * The reply a side thread's pane hands to that thread's own screen. A pane is a
 * read-only view with no composer — its header already sends the reader to the
 * thread to write — so Reply there opens the thread and leaves the target here
 * for its composer to pick up once, keeping the excerpt rather than losing it
 * across the navigation.
 */
export const pendingReplyAtom = Atom.family((_threadId: string) =>
  Atom.make<ReplyTarget | null>(null),
);
