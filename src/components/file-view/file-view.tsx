import type { ComponentProps } from "react";

const join = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(" ");

export type FileViewProps = ComponentProps<"div">;

export function FileView({ className, ...props }: FileViewProps) {
  return (
    <div
      className={join(
        "flex min-h-0 min-w-0 flex-1 flex-col contain-inline-size",
        className,
      )}
      {...props}
    />
  );
}

export type PreviewProps = ComponentProps<"div">;

export function Preview({ className, ...props }: PreviewProps) {
  return (
    <div
      data-slot="preview"
      className={join("flex min-h-0 flex-1 flex-col bg-card", className)}
      {...props}
    />
  );
}

export type PreviewSourceProps = ComponentProps<"div">;

export function PreviewSource({ className, ...props }: PreviewSourceProps) {
  return (
    <div
      data-slot="preview-source"
      className={join(
        "diff-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-card",
        className,
      )}
      {...props}
    />
  );
}

export type PreviewMarkerProps = ComponentProps<"span">;

export function PreviewMarker(props: PreviewMarkerProps) {
  return <span data-slot="preview-marker" {...props} />;
}
