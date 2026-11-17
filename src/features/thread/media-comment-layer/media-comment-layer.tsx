import type { ComponentProps } from "react";

export type MediaCommentLayerProps = ComponentProps<"div">;

export function MediaCommentLayer(props: MediaCommentLayerProps) {
  return <div data-slot="media-comment-layer" {...props} />;
}

export type MediaCommentMarkerProps = ComponentProps<"div">;

export function MediaCommentMarker(props: MediaCommentMarkerProps) {
  return <div data-slot="media-comment-marker" {...props} />;
}

export type MediaCommentMarkerPendingProps = ComponentProps<"div">;

export function MediaCommentMarkerPending(
  props: MediaCommentMarkerPendingProps,
) {
  return <div data-slot="media-comment-marker-pending" {...props} />;
}

export type MediaCommentOpenProps = ComponentProps<"div">;

export function MediaCommentOpen(props: MediaCommentOpenProps) {
  return <div data-slot="media-comment-open" {...props} />;
}

export type MediaCommentRowProps = ComponentProps<"div">;

export function MediaCommentRow(props: MediaCommentRowProps) {
  return <div data-slot="media-comment-row" {...props} />;
}
