import type { ComponentProps } from "react";

export type AttachmentGalleryProps = ComponentProps<"div">;

export function AttachmentGallery(props: AttachmentGalleryProps) {
  return <div {...props} />;
}
