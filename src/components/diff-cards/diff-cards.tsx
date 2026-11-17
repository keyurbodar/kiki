import type { ComponentProps } from "react";

export type DiffCardsProps = ComponentProps<"div">;

export function DiffCards(props: DiffCardsProps) {
  return <div {...props} />;
}
