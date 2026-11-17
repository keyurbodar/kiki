import type { ComponentProps } from "react";

export type ChatIdentityProps = ComponentProps<"div">;

export function ChatIdentity(props: ChatIdentityProps) {
  return <div {...props} />;
}
