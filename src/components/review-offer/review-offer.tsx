import type { ComponentProps } from "react";

export type ReviewOfferProps = ComponentProps<"div">;

export function ReviewOffer(props: ReviewOfferProps) {
  return <div data-slot="review-offer" {...props} />;
}
