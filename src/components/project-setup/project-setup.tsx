import type { ComponentProps } from "react";

export type ProjectSetupProps = ComponentProps<"div">;

export function ProjectSetup(props: ProjectSetupProps) {
  return <div {...props} />;
}
