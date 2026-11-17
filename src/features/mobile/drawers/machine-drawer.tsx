import type { ReactElement } from "react";
import { MobileIcon } from "../thread/mobile-icon";
import {
  MobileDrawer,
  MobileDrawerItem,
  MobileDrawerRow,
  MobileDrawerSeparator,
} from "./mobile-drawer";

export type MobileMachineAction = { id: string; label: string; icon: string };

export type MobileMachineDrawerProps = {
  name: string;
  /** Second line, such as the workspace kind. */
  detail?: string;
  live: boolean;
  actions: ReadonlyArray<MobileMachineAction>;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction: (id: string) => void;
};

export function MobileMachineDrawer({
  name,
  detail,
  live,
  actions,
  trigger,
  open,
  onOpenChange,
  onAction,
}: MobileMachineDrawerProps) {
  return (
    <MobileDrawer
      label="Machine"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="relative flex h-auto min-h-9 w-full min-w-0 cursor-default items-center gap-2 rounded px-2 py-1 text-left text-sm font-normal text-foreground select-none">
        <MobileDrawerRow
          label={name}
          description={detail}
          trailing={
            <span
              aria-label={live ? "Online" : "Offline"}
              role="img"
              className={
                live
                  ? "size-1.5 shrink-0 rounded-full bg-success"
                  : "size-1.5 shrink-0 rounded-full bg-muted-foreground-3"
              }
            />
          }
        />
      </div>
      {actions.length > 0 && <MobileDrawerSeparator />}
      {actions.map((action) => (
        <MobileDrawerItem
          key={action.id}
          icon={<MobileIcon name={action.icon} />}
          label={action.label}
          onClick={() => onAction(action.id)}
        />
      ))}
    </MobileDrawer>
  );
}
