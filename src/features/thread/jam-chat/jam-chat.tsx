import type { ComponentProps } from "react";

export type JamChatProps = ComponentProps<"div">;

export function JamChat(props: JamChatProps) {
  return <div {...props} />;
}

export type ChatScrollPillProps = ComponentProps<"button">;

export function ChatScrollPill(props: ChatScrollPillProps) {
  return <button data-slot="chat-scroll-pill" {...props} />;
}
