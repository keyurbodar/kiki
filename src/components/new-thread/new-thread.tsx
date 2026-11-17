import type { ComponentProps } from "react";

export type NewThreadProps = ComponentProps<"div">;

export function NewThread(props: NewThreadProps) {
  return <div {...props} />;
}
