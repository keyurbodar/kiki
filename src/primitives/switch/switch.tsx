import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ComponentProps } from "react";

export type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

export function Switch(props: SwitchProps) {
  return (
    <BaseSwitch.Root data-slot="switch" {...props}>
      <BaseSwitch.Thumb data-slot="switch-thumb" />
    </BaseSwitch.Root>
  );
}
