import type { ReactNode } from "react";
import type { ButtonVariants } from "@/primitives/button";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: ReactNode;
  intent?: ButtonVariants["intent"];
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: ReactNode;
  closeOnConfirm?: boolean;
  nested?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  intent = "danger",
  onConfirm,
  loading = false,
  disabled = false,
  loadingLabel,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
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
            {loading && loadingLabel != null ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
