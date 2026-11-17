import type { ComponentProps } from "react";

export type AutomationMessageProps = ComponentProps<"div">;

export function AutomationMessage(props: AutomationMessageProps) {
  return <div data-slot="automation-message" {...props} />;
}
