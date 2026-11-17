import type { ComponentProps } from "react";

export type ClusterRowProps = ComponentProps<"div">;

export function ClusterRow(props: ClusterRowProps) {
  return <div {...props} />;
}
