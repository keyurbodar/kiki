/**
 * The `data-scrolling` flag on a scroller whose bar is otherwise invisible:
 * Capy shows the transcript's scrollbar while the list is drifting, not only
 * while the pointer is over it (`[data-scrolling]` in the `.chat-scroller`
 * rule). The flag clears itself shortly after the last scroll event.
 */
export const SCROLLING_LINGER_MS = 700;

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export function markScrolling(node: HTMLElement, linger = SCROLLING_LINGER_MS) {
  node.dataset.scrolling = "";
  const pending = timers.get(node);
  if (pending !== undefined) clearTimeout(pending);
  timers.set(
    node,
    setTimeout(() => {
      timers.delete(node);
      delete node.dataset.scrolling;
    }, linger),
  );
}
