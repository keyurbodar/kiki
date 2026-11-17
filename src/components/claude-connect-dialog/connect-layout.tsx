import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  SideSheetBody,
  SideSheetDescription,
  SideSheetFooter,
  SideSheetHeader,
  SideSheetTitle,
} from "@/primitives/side-sheet";
import {
  ArrowUpRightGlyph,
  CheckGlyph,
  ChevronLeftGlyph,
  CopyGlyph,
} from "./glyphs.tsx";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type ConnectNest = { readonly onBack: () => void };

export type ConnectHelpLink = { readonly href: string; readonly label: string };

export function ConnectHelp({
  help,
  className,
}: {
  help: ConnectHelpLink;
  className?: string;
}) {
  return (
    <Button
      variant="link"
      size="auto-xs"
      className={cx("focus-gutter", className)}
      render={<a href={help.href} target="_blank" rel="noopener noreferrer" />}
    >
      {help.label}
      <ArrowUpRightGlyph className="size-(--icon-xs)" />
    </Button>
  );
}

export function ConnectBack({ onBack }: { onBack: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      aria-label="Back"
      className="-ml-2"
      onClick={onBack}
    >
      <ChevronLeftGlyph />
    </Button>
  );
}

export type ConnectFrameProps = {
  nest?: ConnectNest;
  title: ReactNode;
  description: ReactNode;
  onClose?: () => void;
  footer: ReactNode;
  children: ReactNode;
};

export function ConnectFrame({
  nest,
  title,
  description,
  onClose,
  footer,
  children,
}: ConnectFrameProps) {
  if (nest !== undefined)
    return (
      <>
        <SideSheetHeader>
          <SideSheetTitle className="flex items-center gap-1">
            <ConnectBack onBack={nest.onBack} />
            <span className="min-w-0 truncate">{title}</span>
          </SideSheetTitle>
          <SideSheetDescription>{description}</SideSheetDescription>
        </SideSheetHeader>
        <SideSheetBody>{children}</SideSheetBody>
        {footer}
      </>
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer}
      </DialogContent>
    </Dialog>
  );
}

export type ConnectFooterProps = {
  help?: ConnectHelpLink;
  onCancel?: () => void;
  cancelLabel?: string;
  disabled?: boolean;
  secondary?: ReactNode;
  children?: ReactNode;
  surface?: "dialog" | "sheet";
};

export function ConnectFooter({
  help,
  onCancel,
  cancelLabel = "Cancel",
  disabled,
  secondary,
  children,
  surface = "dialog",
}: ConnectFooterProps) {
  const Footer = surface === "sheet" ? SideSheetFooter : DialogFooter;
  return (
    <Footer className="items-center">
      {help === undefined ? null : (
        <ConnectHelp help={help} className="mr-auto" />
      )}
      {secondary}
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      {children}
    </Footer>
  );
}

export type ConnectStepProps = {
  number: number;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  status?: "done" | "current" | "upcoming";
};

export function ConnectStep({
  number,
  title,
  description,
  children,
  status = "current",
}: ConnectStepProps) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] items-baseline gap-x-2 gap-y-2">
      {status === "done" ? (
        <Icon name="circle-check" className="size-4 self-center text-success" />
      ) : (
        <span className="text-right text-sm text-muted-foreground-2 tabular-nums select-none">
          {number}.
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p
          className={cx(
            "text-sm",
            status === "upcoming" && "text-muted-foreground-2",
          )}
        >
          {title}
        </p>
        {description === undefined ? null : (
          <p className="text-xs text-muted-foreground-2">{description}</p>
        )}
      </div>
      {children === undefined ? null : (
        <div className="col-start-2 flex min-w-0 flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export type CopyRowProps = {
  value: string;
  label: string;
  className?: string;
};

export function CopyRow({ value, label, className }: CopyRowProps) {
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (copied === 0) return;
    const timer = setTimeout(() => setCopied(0), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = () =>
    navigator.clipboard.writeText(value).then(
      () => setCopied((n) => n + 1),
      () => toast.error(`Could not copy the ${label}`),
    );
  return (
    <div className={cx("relative flex w-full min-w-0", className)}>
      <Input
        readOnly
        value={value}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        className="text-ellipsis pr-8"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="absolute inset-y-0 right-1 flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copied > 0 ? "Copied" : `Copy ${label}`}
          onClick={() => void copy()}
        >
          {copied > 0 ? <CheckGlyph /> : <CopyGlyph />}
        </Button>
      </div>
    </div>
  );
}
