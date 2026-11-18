import { createContext, useContext } from "react";
import type { Actor } from "@/data/events";

export type ReplyTarget = {
  eventId: string;
  rowId: string;
  section: number;
  name: string;
  text: string;
};

export type QuoteSource = { text: string; source: string };

/**
 * What the Edit action hands the composer: the text to prefill, the event id
 * the eventual send carries as `editOf`, and the row the timeline truncates
 * from.
 */
export type EditTarget = {
  rowId: string;
  eventId: string;
  text: string;
};

export type MessageActor = { name: string; imageUrl?: string | null };

/**
 * What the chat list hands its message rows: the clock, the viewer, sender
 * lookups and the actions behind the hover footer. Every field is optional so
 * a row renders read-only outside a live thread.
 */
export type MessageActions = {
  now?: number;
  viewerUserId?: string;
  /** Name replies to this thread's agent quote, e.g. a Captain's name. */
  agentName?: string;
  /** Absent or undefined falls back to the actor's own id, as `actorName` does. */
  resolveActor?: (actor: Actor) => MessageActor | undefined;
  rowActors?: ReadonlyMap<string, Actor>;
  automationName?: (automationId: string) => string | undefined;
  reply?: (target: ReplyTarget) => void;
  editMessage?: (target: EditTarget) => void;
  /** Rows a later message replaces; the stamp line marks them Edited. */
  editedRowIds?: ReadonlySet<string>;
  jumpToSection?: (rowId: string, section: number) => void;
  forkQuote?: (kind: "copy" | "summary", quote: QuoteSource) => void;
  sideChatQuote?: (quote: QuoteSource) => void;
};

const MessageActionsContext = createContext<MessageActions>({});

export const MessageActionsProvider = MessageActionsContext.Provider;

export function useMessageActions() {
  return useContext(MessageActionsContext);
}

export function actorName(actions: MessageActions, actor: Actor): string {
  const resolved = actions.resolveActor?.(actor)?.name;
  if (resolved !== undefined) return resolved;
  switch (actor.type) {
    case "user":
      return actor.userId;
    case "service_user":
      return actor.serviceUserId;
    case "agent":
      return "Capy";
    case "system":
      return actor.service;
  }
}
