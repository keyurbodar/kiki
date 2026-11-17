import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { CheckmarkIcon, CopyIcon } from "../api/icons";
import { cx } from "./cx";

/**
 * ui/copy-field.tsx `CopyField` (non-secret path) until the primitive takes
 * value/label/size. Copied state clears on Capy's timer.
 */
export function CopyValue({
  value,
  label,
  size = "base",
  className,
}: {
  value: string;
  label: string;
  size?: "sm" | "base";
  className?: string;
}) {
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (copied === 0) return;
    const timer = setTimeout(() => setCopied(0), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => setCopied((count) => count + 1),
      () => toast.error(`Could not copy the ${label}`),
    );
  return (
    <span
      data-slot="copy-field"
      className={cx("relative flex min-w-0", className)}
    >
      <Input
        readOnly
        size={size}
        value={value}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        className={cx("text-ellipsis", size === "sm" ? "pr-7" : "pr-8")}
        onFocus={(event) => event.currentTarget.select()}
      />
      <span
        className={cx(
          "absolute inset-y-0 flex items-center",
          size === "sm" ? "right-0.5" : "right-1",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copied > 0 ? "Copied" : `Copy ${label}`}
          onClick={() => void copy()}
        >
          {copied > 0 ? <CheckmarkIcon /> : <CopyIcon />}
        </Button>
      </span>
    </span>
  );
}
