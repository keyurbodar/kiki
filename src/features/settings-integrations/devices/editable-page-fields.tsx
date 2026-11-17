import { type KeyboardEvent, useState } from "react";
import { Input } from "@/primitives/input";

const blurOnEnter =
  (reset: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") reset();
  };

export function EditableTitle({
  value,
  ariaLabel,
  maxLength,
  disabled,
  autoFocus,
  onSave,
}: {
  value: string;
  ariaLabel: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      variant="blank"
      aria-label={ariaLabel}
      className="px-0 text-xl font-medium"
      value={draft ?? value}
      maxLength={maxLength}
      disabled={disabled}
      autoFocus={autoFocus}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft?.trim();
        if (next === undefined || next === "" || next === value) setDraft(null);
        else onSave(next);
      }}
      onKeyDown={blurOnEnter(() => setDraft(null))}
    />
  );
}

export function EditableDescription({
  value,
  ariaLabel,
  placeholder = "Add a description",
  maxLength,
  disabled,
  onSave,
}: {
  value: string | null;
  ariaLabel: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  onSave: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      variant="blank"
      size="sm"
      aria-label={ariaLabel}
      placeholder={placeholder}
      className="px-0 text-sm font-normal"
      value={draft ?? value ?? ""}
      maxLength={maxLength}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft?.trim();
        if (next === undefined || next === (value ?? "")) setDraft(null);
        else onSave(next === "" ? null : next);
      }}
      onKeyDown={blurOnEnter(() => setDraft(null))}
    />
  );
}
