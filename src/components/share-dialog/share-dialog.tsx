import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent } from "@/primitives/dialog";
import {
  OpenShareDialogContext,
  type ShareTarget,
} from "./share-dialog-context";
import { ShareFolderBody } from "./share-folder-body";
import { ShareThreadBody } from "./share-thread-body";

export type ShareDialogProps = ComponentProps<"div"> & {
  target?: ShareTarget;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ShareDialog({
  target,
  open = false,
  onOpenChange,
  className,
  children,
  ...props
}: ShareDialogProps) {
  const [busy, setBusy] = useState(false);
  if (target === undefined) return null;
  const change = (next: boolean) => {
    if (!busy) onOpenChange?.(next);
  };
  const close = (next: boolean) => onOpenChange?.(next);
  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent
        data-slot="share-dialog"
        className={cn("max-w-md", className)}
        {...props}
      >
        {target.kind === "folder" ? (
          <ShareFolderBody
            section={target.folder}
            onOpenChange={close}
            onBusyChange={setBusy}
          />
        ) : (
          <ShareThreadBody
            id={target.id}
            name={target.name}
            onOpenChange={close}
            onBusyChange={setBusy}
          />
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

export const shareTargetKey = (target: ShareTarget) =>
  `${target.kind}:${target.kind === "folder" ? target.folder.id : target.id}`;

export function ShareDialogProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ShareTarget | null>(null);
  const [open, setOpen] = useState(false);
  const show = useCallback((next: ShareTarget) => {
    setTarget(next);
    setOpen(true);
  }, []);
  return (
    <OpenShareDialogContext.Provider value={show}>
      {children}
      {target === null ? null : (
        <ShareDialog
          key={`${shareTargetKey(target)}:${open ? "open" : "closed"}`}
          target={target}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </OpenShareDialogContext.Provider>
  );
}
