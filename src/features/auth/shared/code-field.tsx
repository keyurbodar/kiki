import { Input } from "@/primitives/input";
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
    <OtpInput>
      <Input
        aria-label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        font="numeric"
        maxLength={codeLength}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => {
          const next = sanitizeCode(event.currentTarget.value);
          onChange(next);
          if (next.length === codeLength && next !== value) onComplete(next);
        }}
      />
    </OtpInput>
  );
}
