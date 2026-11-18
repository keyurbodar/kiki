import { elementOf } from "./selection-anchor";

/** Where a quoted block came from: the chat row's key and the block's index in it. */
export type QuoteTarget = { rowKey: string; section: number };

const MARKDOWN_SELECTOR = '[data-component="markdown"]';

/**
 * The chat row and quoted block a selection point belongs to.
 *
 * The key is the one the chat list already puts on the row wrapper, because a
 * message body is not always its own row: the timeline folds an agent's work
 * into a work group, whose markdown blocks sit inside the group's panel. The
 * section is the block's index among the row's markdown blocks, which is the
 * agent message's own section index wherever a row is a message.
 */
export function quoteTargetOf(node: Node | null): QuoteTarget | null {
  const element = elementOf(node);
  const wrapper = element?.closest("[data-chat-row-id]") ?? null;
  const rowKey = wrapper?.getAttribute("data-chat-row-id");
  if (wrapper === null || rowKey === undefined || rowKey === null) return null;
  const block = element?.closest(MARKDOWN_SELECTOR) ?? null;
  if (block === null || !wrapper.contains(block)) return null;
  const blocks = Array.from(wrapper.querySelectorAll(MARKDOWN_SELECTOR));
  const index = blocks.indexOf(block);
  return { rowKey, section: Math.max(index, 0) };
}
