import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { CardListHeader, cx } from "../shared";
import type { ApiKeyState } from "./api-state";
import { formatShortDate } from "./api-state";
import {
  ArrowUpRightIcon,
  CheckmarkIcon,
  CopyIcon,
  CrossIcon,
  SearchIcon,
} from "./icons";

/** api-dialogs.tsx `Field`: a label with an optional "Optional" hint. */
export function Field({
  label,
  optional,
  children,
}: {
  label: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      <span>
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground-2">
            Optional
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const dotColors = {
  neutral: "bg-muted-foreground-3",
  accent: "bg-primary",
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
} as const;

/** ui/status-dot: the dot inside status badges. */
export function StatusDot({
  color = "neutral",
}: {
  color?: keyof typeof dotColors;
}) {
  return (
    <span
      aria-hidden
      className={cx("size-1.5 shrink-0 rounded-full", dotColors[color])}
    />
  );
}

/** api-page.tsx `ApiKeyStatusBadge`. */
export function ApiKeyStatusBadge({
  state,
  expiresAt,
}: {
  state: ApiKeyState;
  expiresAt: Date | null;
}) {
  if (state === "revoked") return <Badge color="neutral">Revoked</Badge>;
  if (state === "disabled")
    return <Badge color="warning">Service user disabled</Badge>;
  if (state === "unavailable")
    return <Badge color="warning">Principal unavailable</Badge>;
  if (state === "expired") return <Badge color="danger">Expired</Badge>;
  if (state === "expires" && expiresAt !== null)
    return <Badge color="neutral">Expires {formatShortDate(expiresAt)}</Badge>;
  return (
    <Badge color="neutral">
      <StatusDot color="success" />
      Active
    </Badge>
  );
}

/**
 * Capy's CardListHeader `search` prop, composed over the shared header
 * (whose local copy has no search yet).
 */
export function SearchCardListHeader({
  label,
  search,
  tools,
  action,
}: {
  label: ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  };
  tools?: ReactNode;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const searching = search !== undefined && (open || search.value !== "");
  return (
    <CardListHeader
      label={
        searching ? (
          <Input
            variant="blank"
            size="sm"
            className="-ml-2"
            autoFocus
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                search.onChange("");
                setOpen(false);
              }
            }}
            onBlur={() => search.value === "" && setOpen(false)}
          />
        ) : (
          label
        )
      }
      tools={
        <>
          {search !== undefined && !searching && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={search.placeholder}
              title={search.placeholder}
              onClick={() => setOpen(true)}
            >
              <SearchIcon />
            </Button>
          )}
          {searching && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => {
                search.onChange("");
                setOpen(false);
              }}
            >
              <CrossIcon />
            </Button>
          )}
          {tools}
        </>
      }
      action={action}
    />
  );
}

/**
 * ui/copy-field.tsx `CopyField` (non-secret path) until the primitive takes
 * value/label/size. Copied state clears after 1.5s like Capy's.
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
      className={cx("relative flex w-full min-w-0", className)}
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

/** shared/confirm-dialog.tsx `ConfirmDialog` until the component takes props. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="pb-2" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            intent="danger"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** shared/connect-layout.tsx `ConnectFooter` (dialog surface). */
export function ConnectFooter({
  help,
  onCancel,
  cancelLabel = "Cancel",
  disabled,
  children,
}: {
  help?: { href: string; label: string };
  onCancel: () => void;
  cancelLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <DialogFooter className="items-center">
      {help !== undefined && (
        <Button
          variant="link"
          size="auto-xs"
          className="focus-gutter mr-auto"
          render={
            // biome-ignore lint/a11y/useAnchorContent: Button renders the label into the anchor
            <a href={help.href} target="_blank" rel="noopener noreferrer" />
          }
        >
          {help.label}
          <ArrowUpRightIcon className="size-(--icon-xs)" />
        </Button>
      )}
      <Button type="button" variant="ghost" disabled={disabled} onClick={onCancel}>
        {cancelLabel}
      </Button>
      {children}
    </DialogFooter>
  );
}

/** Button's `loading`/`loadingLabel` until the primitive grows them. */
export const busyLabel = (busy: boolean, label: string, loadingLabel: string) =>
  busy ? loadingLabel : label;

/** editable-page-fields.tsx `EditablePageTitle`. */
export function EditablePageTitle({
  value,
  ariaLabel,
  maxLength,
  disabled,
  onSave,
}: {
  value: string;
  ariaLabel: string;
  maxLength?: number;
  disabled?: boolean;
  onSave: (value: string) => unknown;
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
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft?.trim();
        if (next === undefined || next === "" || next === value) setDraft(null);
        else onSave(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(null);
      }}
    />
  );
}

/** editable-page-fields.tsx `EditablePageDescription`. */
export function EditablePageDescription({
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
  onSave: (value: string | null) => unknown;
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
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") setDraft(null);
      }}
    />
  );
}

/** Focus target after a destructive action, like Capy's headingRef focus. */
export const useFocusAfter = () => useRef<HTMLHeadingElement>(null);
