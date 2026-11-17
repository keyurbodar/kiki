import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import type { Intent } from "@/primitives/intent";

export type SettingsConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  intent?: Intent;
  onConfirm: () => void;
  loading?: boolean;
  loadingLabel?: ReactNode;
  disabled?: boolean;
  closeOnConfirm?: boolean;
};

export function SettingsConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  intent = "danger",
  onConfirm,
  loading = false,
  loadingLabel,
  disabled = false,
  closeOnConfirm = true,
}: SettingsConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogOverlay />
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
            intent={intent}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) onOpenChange(false);
            }}
          >
            {loading && loadingLabel !== undefined
              ? loadingLabel
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
