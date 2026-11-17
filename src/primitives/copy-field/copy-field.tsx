import { cx } from "class-variance-authority";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

const MASK = "••••••••••••••••••••••••";
const COPIED_RESET_DELAY = 1500;

export type CopyFieldProps = {
  value: string;
  label: string;
  secret?: boolean;
  size?: "sm" | "base";
  className?: string;
};

export function CopyField({
  value,
  label,
  secret = false,
  size = "base",
  className,
}: CopyFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copies, setCopies] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    if (copies === 0) return;
    const timer = setTimeout(() => setCopies(0), COPIED_RESET_DELAY);
    return () => clearTimeout(timer);
  }, [copies]);

  const masked = secret && !revealed;
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => setCopies((count) => count + 1),
      () => toast.error(`Could not copy the ${label}`),
    );

  return (
    <span
      data-slot="copy-field"
      className={cx("relative flex w-full min-w-0", className)}
    >
      <Tooltip
        open={tooltipOpen && !masked}
        onOpenChange={(open) => {
          const input = inputRef.current;
          setTooltipOpen(
            open && input !== null && input.scrollWidth > input.clientWidth,
          );
        }}
      >
        <TooltipTrigger
          render={
            <Input
              ref={inputRef}
              readOnly
              size={size}
              value={masked ? MASK : value}
              aria-label={label}
              spellCheck={false}
              autoComplete="off"
              className={cx(
                "text-ellipsis",
                secret
                  ? size === "sm"
                    ? "pr-13"
                    : "pr-14"
                  : size === "sm"
                    ? "pr-7"
                    : "pr-8",
              )}
              onFocus={(event) => event.currentTarget.select()}
            />
          }
        />
        <TooltipContent side="top" className="max-w-sm break-all">
          {value}
        </TooltipContent>
      </Tooltip>
      <span
        className={cx(
          "absolute inset-y-0 flex items-center",
          size === "sm" ? "right-0.5" : "right-1",
        )}
      >
        {secret && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={revealed ? `Hide ${label}` : `Reveal ${label}`}
            aria-pressed={revealed}
            onClick={() => setRevealed((shown) => !shown)}
          >
            <Icon name={revealed ? "eye-slash" : "eye-open"} size={null} />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copies > 0 ? "Copied" : `Copy ${label}`}
          onClick={() => void copy()}
        >
          <Icon
            name={copies > 0 ? "checkmark-1" : "square-behind-square-2"}
            size={null}
          />
        </Button>
      </span>
    </span>
  );
}
