import type { ComponentProps } from "react";

export type MachineConfigProps = ComponentProps<"div">;

export function MachineConfig(props: MachineConfigProps) {
  return <div {...props} />;
}
