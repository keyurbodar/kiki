import type { ComponentProps } from "react";

export type FileViewProps = ComponentProps<"div">;

export function FileView(props: FileViewProps) {
  return <div {...props} />;
}

export type PreviewProps = ComponentProps<"div">;

export function Preview(props: PreviewProps) {
  return <div data-slot="preview" {...props} />;
}

export type PreviewSourceProps = ComponentProps<"div">;

export function PreviewSource(props: PreviewSourceProps) {
  return <div data-slot="preview-source" {...props} />;
}

export type PreviewMarkerProps = ComponentProps<"span">;

export function PreviewMarker(props: PreviewMarkerProps) {
  return <span data-slot="preview-marker" {...props} />;
}
