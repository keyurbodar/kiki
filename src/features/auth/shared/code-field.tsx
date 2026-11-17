import { OtpInput } from "@/primitives/otp-input";

export const codeLength = 6;

export const sanitizeCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, codeLength);

export function CodeField({
  value,
  onChange,
  onComplete,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <OtpInput
      value={value}
      onChange={(next) => onChange(sanitizeCode(next))}
      onComplete={onComplete}
      length={codeLength}
      autoFocus={autoFocus}
    />
  );
}
