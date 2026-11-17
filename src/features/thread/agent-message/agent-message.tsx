import type { ComponentProps } from "react";

export type AgentMessageProps = ComponentProps<"div">;

export function AgentMessage(props: AgentMessageProps) {
  return <div data-slot="agent-message" {...props} />;
}

export type MessageHeaderProps = ComponentProps<"div">;

export function MessageHeader(props: MessageHeaderProps) {
  return <div data-slot="message-header" {...props} />;
}

export type MessageSectionProps = ComponentProps<"div">;

export function MessageSection(props: MessageSectionProps) {
  return <div data-slot="message-section" {...props} />;
}

export type MessageStatusProps = ComponentProps<"div">;

export function MessageStatus(props: MessageStatusProps) {
  return <div data-slot="message-status" {...props} />;
}

export type ChatStampProps = ComponentProps<"span">;

export function ChatStamp(props: ChatStampProps) {
  return <span data-slot="chat-stamp" {...props} />;
}

export type ClampedBodyProps = ComponentProps<"div">;

export function ClampedBody(props: ClampedBodyProps) {
  return <div data-slot="clamped-body" {...props} />;
}
