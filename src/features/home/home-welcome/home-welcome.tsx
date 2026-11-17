import type { ComponentProps } from "react";

export type HomeWelcomeProps = ComponentProps<"div">;

export function HomeWelcome(props: HomeWelcomeProps) {
  return <div {...props} />;
}
