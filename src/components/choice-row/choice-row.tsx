import type { ComponentProps } from "react";

export type ChoiceRowProps = ComponentProps<"div">;

export function ChoiceRow(props: ChoiceRowProps) {
  return <div {...props} />;
}
