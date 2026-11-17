import type { ComponentProps } from "react";

export type UploadSendFailureProps = ComponentProps<"div">;

export function UploadSendFailure(props: UploadSendFailureProps) {
  return <div data-slot="upload-send-failure" {...props} />;
}
