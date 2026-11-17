import type { ComponentProps } from "react";

export type MediaLightboxProps = ComponentProps<"div">;

export function MediaLightbox(props: MediaLightboxProps) {
  return <div {...props} />;
}

export type LightboxActionsProps = ComponentProps<"div">;

export function LightboxActions(props: LightboxActionsProps) {
  return <div data-slot="lightbox-actions" {...props} />;
}

export type LightboxStripProps = ComponentProps<"div">;

export function LightboxStrip(props: LightboxStripProps) {
  return <div data-slot="lightbox-strip" {...props} />;
}
