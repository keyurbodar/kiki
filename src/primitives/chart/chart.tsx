import type { ComponentProps } from "react";

export type ChartProps = ComponentProps<"div">;

export function Chart(props: ChartProps) {
  return <div data-slot="chart" {...props} />;
}
