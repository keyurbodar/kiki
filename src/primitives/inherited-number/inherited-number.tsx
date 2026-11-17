import { cx } from "class-variance-authority";
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { InheritedTag } from "@/primitives/inherited-menu";
import { Input, type InputProps } from "@/primitives/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export type InheritedNumberProps = {
  value: number | undefined;
  inherited: number;
  inheritedTag?: string;
  inheritedLabel?: string;
  min?: number;
  max: number;
  saving?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (value: number | undefined) => void;
};

export type InheritedNumberInputProps = InputProps;

export function InheritedNumberInput({
  className,
  ...props
}: InheritedNumberInputProps) {
  return (
    <Input
      size="sm"
      type="number"
      className={cx("w-23 pr-8 text-right tabular-nums", className)}
      {...props}
    />
  );
}

/** Parses a typed draft; undefined when it is not a whole number in range. */
export const parseInheritedNumber = (
  draft: string,
  min: number,
  max: number,
) => {
  const parsed = Number(draft);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : undefined;
};

export function InheritedNumber({
  value,
  inherited,
  inheritedTag = "Org",
  inheritedLabel = "Use org default",
  min = 1,
  max,
  saving = false,
  disabled = false,
  disabledReason,
  className,
  "aria-label": ariaLabel,
  onChange,
}: InheritedNumberProps) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<{ value: number | undefined }>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new saved value also clears the optimistic one, as in Capy
  useEffect(() => {
    if (!saving) setPending(undefined);
  }, [saving, value]);
  const effective = pending === undefined ? value : pending.value;
  const [draft, setDraft] = useState(String(effective ?? inherited));
  const discarding = useRef(false);

  const open = () => {
    setDraft(String(effective ?? inherited));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (discarding.current) {
      discarding.current = false;
      return;
    }
    const parsed = parseInheritedNumber(draft, min, max);
    if (parsed === undefined) {
      setDraft(String(effective ?? inherited));
      return;
    }
    const next = parsed === inherited ? undefined : parsed;
    if (next === effective) return;
    setPending({ value: next });
    onChange(next);
  };

  const reset = () => {
    setEditing(false);
    setDraft(String(inherited));
    if (effective === undefined) return;
    setPending({ value: undefined });
    onChange(undefined);
  };

  if (effective === undefined && !editing)
    return (
      <Button
        variant="solid"
        size="sm"
        className={cx("tabular-nums", className)}
        disabled={disabled || saving}
        title={disabledReason}
        aria-label={ariaLabel}
        onClick={open}
      >
        {inherited}
        <InheritedTag>{inheritedTag}</InheritedTag>
        <Icon name="edit-small-1" size={null} />
      </Button>
    );

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (!editing) open();
    event.currentTarget.select();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      discarding.current = true;
      setDraft(String(effective ?? inherited));
      event.currentTarget.blur();
    }
  };

  const resetLabel = `${inheritedLabel} (${inherited})`;

  return (
    <div className={cx("relative", className)}>
      <InheritedNumberInput
        min={min}
        max={max}
        value={editing ? draft : String(effective ?? inherited)}
        aria-label={ariaLabel}
        disabled={disabled || saving}
        title={disabledReason}
        autoFocus={editing}
        onFocus={onFocus}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={resetLabel}
              disabled={disabled || saving}
              className="absolute inset-y-0 right-2 flex items-center text-icon-muted outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none"
              onMouseDown={(event) => event.preventDefault()}
              onClick={reset}
            >
              <Icon name="arrow-rotate-counter-clockwise" size="sm" />
            </button>
          }
        />
        <TooltipContent>
          {inheritedLabel} ({inherited})
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
