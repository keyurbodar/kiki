import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { CopyField } from "@/primitives/copy-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { cx } from "../shared";

export function CodeBlock({
  text,
  language,
  blockKey,
}: {
  text: string;
  language: string;
  blockKey: string;
}) {
  return (
    <pre
      data-slot="code-block"
      data-language={language}
      data-block-key={blockKey}
    >
      <code>{text}</code>
    </pre>
  );
}

export function CopyValue({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <CopyField
      value={value}
      label={label}
      size="sm"
      className={cx("relative flex min-w-0", className)}
    />
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  loading = false,
  closeOnConfirm = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  closeOnConfirm?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="pb-2" />
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            intent="danger"
            disabled={loading}
            aria-busy={loading || undefined}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SetupStep({
  title,
  description,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="pl-1">
      <h3 className="font-medium text-foreground">{title}</h3>
      {description !== undefined && <p className="mt-1">{description}</p>}
      {children}
    </li>
  );
}

export const setupListClass =
  "flex list-decimal flex-col gap-5 pl-5 text-sm text-muted-foreground-1 marker:text-muted-foreground-2";

export const menuItemIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
