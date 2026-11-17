import type { ComponentProps } from "react";

export type OtpInputProps = ComponentProps<"div">;

export function OtpInput(props: OtpInputProps) {
  return <div data-slot="otp-input" {...props} />;
}
