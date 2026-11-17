import type { ComponentProps } from "react";

export type MediaGalleryMixedProps = ComponentProps<"div">;

export function MediaGalleryMixed(props: MediaGalleryMixedProps) {
  return <div data-slot="media-gallery-mixed" {...props} />;
}

export type ImageUnavailableProps = ComponentProps<"div">;

export function ImageUnavailable(props: ImageUnavailableProps) {
  return <div data-slot="image-unavailable" {...props} />;
}
