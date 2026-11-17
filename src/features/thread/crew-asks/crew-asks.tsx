import type { ComponentProps } from "react";

export type CrewAsksTriggerProps = ComponentProps<"button">;

export function CrewAsksTrigger(props: CrewAsksTriggerProps) {
  return <button data-slot="crew-asks-trigger" {...props} />;
}
