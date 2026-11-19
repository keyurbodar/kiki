import { type RefObject, useCallback, useState } from "react";
import type { ComposerHandle } from "@/components/composer";
import type { ReplyTarget } from "@/features/thread/message-footer";
import { type ExcerptMention, replyDraft } from "./reply-parse";

/** The reply a message put in the draft: the bar above the composer reads it, Cancel takes the excerpt back out. */
export type Replying = { name: string; text: string; excerpt: ExcerptMention };

/**
 * The reply state of one composer. Every transcript that shows a message
 * footer beside a composer uses it — the desktop thread, the phone's thread
 * screen, and a thread opened from a side thread — so Reply prefaces the draft
 * with the excerpt the same way wherever the row was pressed.
 */
export function useReplyDraft(composer: RefObject<ComposerHandle | null>) {
  const [replying, setReplying] = useState<Replying | null>(null);

  const startReply = useCallback(
    (target: ReplyTarget) => {
      const handle = composer.current;
      if (handle === null) return;
      const { draft: next, excerpt } = replyDraft(handle.getPayload(), target);
      handle.focus();
      handle.reset(next);
      setReplying({ name: target.name, text: target.text, excerpt });
    },
    [composer],
  );

  const cancelReply = useCallback(() => {
    const handle = composer.current;
    const payload = handle?.getPayload();
    if (handle === null || handle === undefined || payload === undefined) {
      setReplying(null);
      return;
    }
    if (replying !== null) {
      const rest = payload.text.slice(replying.excerpt.end).replace(/^\n+/, "");
      const shift = payload.text.length - rest.length;
      handle.reset({
        text: rest,
        mentions: payload.mentions
          .filter((mention) => mention.id !== replying.excerpt.id)
          .map((mention) => ({
            ...mention,
            start: mention.start - shift,
            end: mention.end - shift,
          })),
        files: payload.files,
        caret: null,
      });
    }
    setReplying(null);
  }, [composer, replying]);

  /** Forgets the reply without touching the draft: the send already took it. */
  const clearReply = useCallback(() => setReplying(null), []);

  return { replying, startReply, cancelReply, clearReply };
}
