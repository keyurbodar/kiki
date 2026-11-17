import type { ComponentProps } from "react";

export type DriveReferenceCardsProps = ComponentProps<"div">;

export function DriveReferenceCards(props: DriveReferenceCardsProps) {
  return <div data-slot="drive-references" {...props} />;
}
