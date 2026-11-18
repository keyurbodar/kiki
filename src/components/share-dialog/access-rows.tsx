import { type ComponentType, useState } from "react";
import { Button } from "@/primitives/button";
import { MenuGroup, MenuLabel } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import {
  CheckIcon,
  ChevronDownSmallIcon,
  GlobeIcon,
  LockIcon,
  type ShareDialogIconProps,
} from "./icons";
import { useActiveOrg, type Visibility } from "./share-data";

export type AccessRowsProps = {
  visibility: Visibility;
  onChange?: (visibility: Visibility) => void;
  sharedLabel?: string;
  disabled?: boolean;
  confirmPrivate?: boolean;
};

export function AccessRows({
  visibility,
  onChange,
  sharedLabel,
  disabled = false,
  confirmPrivate = false,
}: AccessRowsProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const org = useActiveOrg();
  const shared =
    sharedLabel ??
    (org === undefined
      ? "Everyone in organization"
      : `Everyone at ${org.name}`);
  const label = visibility === "private" ? "Only specific people" : shared;
  const icon =
    visibility === "private" ? (
      <LockIcon className="size-(--icon-sm) translate-y-hairline" />
    ) : (
      <GlobeIcon className="size-(--icon-sm) translate-y-hairline" />
    );
  const needsConfirm = (choice: Visibility) =>
    choice === "private" && visibility !== "private" && confirmPrivate;
  const item = (
    choice: Visibility,
    Glyph: ComponentType<ShareDialogIconProps>,
    text: string,
  ) => (
    <ResponsiveMenuItem
      data-track-owner="shared/share-dialog.tsx#item:ResponsiveMenuItem.1"
      closeOnClick={!needsConfirm(choice)}
      onClick={() => {
        if (needsConfirm(choice)) setConfirming(true);
        else onChange?.(choice);
      }}
    >
      <span className="flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive">
        <Glyph />
      </span>
      <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
        {text}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
        {visibility === choice ? (
          <CheckIcon className="size-(--icon-sm) shrink-0 text-foreground" />
        ) : null}
      </span>
    </ResponsiveMenuItem>
  );
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground">Access</span>
      {onChange === undefined ? (
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground-1">
          {icon}
          <span className="min-w-0 truncate">{label}</span>
        </span>
      ) : (
        <ResponsiveMenu
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setConfirming(false);
          }}
        >
          <ResponsiveMenuTrigger
            data-track-owner="shared/share-dialog.tsx#AccessRows:ResponsiveMenuTrigger.1"
            render={
              <Button
                data-track-owner="shared/share-dialog.tsx#AccessRows:Button[Access]"
                variant="bare"
                size="auto-sm"
                aria-label="Access"
                className="-m-1 p-1"
                disabled={disabled}
              >
                {icon}
                <span className="min-w-0 truncate">{label}</span>
                <ChevronDownSmallIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
              </Button>
            }
          />
          <ResponsiveMenuContent className="w-72">
            {confirming ? (
              <MenuGroup>
                <MenuLabel>Making this private makes you its owner</MenuLabel>
                <ResponsiveMenuItem
                  data-track-owner="shared/share-dialog.tsx#AccessRows:ResponsiveMenuItem[Confirm]"
                  onClick={() => onChange("private")}
                >
                  Confirm
                </ResponsiveMenuItem>
                <ResponsiveMenuItem
                  data-track-owner="shared/share-dialog.tsx#AccessRows:ResponsiveMenuItem[Cancel]"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </ResponsiveMenuItem>
              </MenuGroup>
            ) : (
              <>
                {item("shared", GlobeIcon, shared)}
                {item("private", LockIcon, "Only specific people")}
              </>
            )}
          </ResponsiveMenuContent>
        </ResponsiveMenu>
      )}
    </div>
  );
}
