import type { ComponentProps } from "react";

export type UserMessageProps = ComponentProps<"div">;

export function UserMessage(props: UserMessageProps) {
  return <div data-slot="user-message" {...props} />;
}
