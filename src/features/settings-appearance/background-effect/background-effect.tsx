import type { ComponentProps } from "react";

export type BackgroundEffectProps = ComponentProps<"div">;

export function BackgroundEffect(props: BackgroundEffectProps) {
  return <div data-slot="background-effect" {...props} />;
}
