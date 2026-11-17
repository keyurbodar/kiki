import type { ComponentProps } from "react";

export type BackgroundUploadStatusProps = ComponentProps<"div">;

export function BackgroundUploadStatus(props: BackgroundUploadStatusProps) {
  return <div data-slot="background-upload-status" {...props} />;
}
