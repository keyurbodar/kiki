import { cx } from "class-variance-authority";
import { useState } from "react";

export type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  disabled,
  invalid,
  className,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, length - 1);
  return (
    <div
      data-slot="otp-input"
      className={cx(
        "relative",
        disabled && "pointer-events-none opacity-55",
        className,
      )}
    >
      <input
        value={value}
        // biome-ignore lint/a11y/noAutofocus: callers opt in when the code input is the only field
        autoFocus={autoFocus}
        disabled={disabled}
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="One-time code"
        aria-invalid={invalid || undefined}
        className="absolute inset-0 size-full cursor-text opacity-0"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, length);
          onChange(next);
          if (next.length === length && next !== value) onComplete?.(next);
        }}
      />
      <div aria-hidden className="pointer-events-none flex gap-1.5">
        {Array.from({ length }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: cells are fixed positions
            key={index}
            data-active={(focused && index === activeIndex) || undefined}
            className={cx(
              "flex h-(--h-control-base) min-w-0 flex-1 items-center justify-center rounded border-hairline bg-input text-base font-medium tabular-nums text-foreground",
              invalid ? "border-destructive" : "border-border-2",
              "data-[active]:outline-ring-inset",
            )}
          >
            {value[index] ? (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: the key restarts the enter transition when a cell's digit changes
                key={`${index}-${value[index]}`}
                className="transition-[opacity,translate] duration-fast ease-out-quint starting:opacity-0 motion-safe:starting:translate-y-0.5"
              >
                {value[index]}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
