import type { ComponentProps } from "react";

export type CommandMenuComposeProps = ComponentProps<"div">;

export function CommandMenuCompose(props: CommandMenuComposeProps) {
  return <div {...props} />;
}
