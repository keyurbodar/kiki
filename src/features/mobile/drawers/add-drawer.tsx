import { Fragment, type ReactElement } from "react";
import { mentionCategories } from "../composer/composer-menus";
import { MobileIcon } from "../thread/mobile-icon";
import {
  MobileDrawer,
  MobileDrawerItem,
  MobileDrawerSeparator,
} from "./mobile-drawer";

export type MobileAddAction = { id: string; label: string; icon: string };

/** The composer's "Add to message" groups: side thread, attachments, then @ references. */
export const mobileAddGroups: ReadonlyArray<ReadonlyArray<MobileAddAction>> = [
  [{ id: "side-thread", label: "New side thread", icon: "side-thread" }],
  [
    { id: "upload", label: "Upload attachment", icon: "paperclip-1" },
    { id: "environment", label: "Environment variables", icon: "key-2" },
  ],
  mentionCategories.map(({ id, label, icon }) => ({ id, label, icon })),
];

export type MobileAddDrawerProps = {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: string) => void;
};

export function MobileAddDrawer({
  trigger,
  open,
  onOpenChange,
  onSelect,
}: MobileAddDrawerProps) {
  return (
    <MobileDrawer
      label="Add to message"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      {mobileAddGroups.map((group, index) => (
        <Fragment key={group.map((action) => action.id).join(" ")}>
          {index > 0 && <MobileDrawerSeparator />}
          {group.map((action) => (
            <MobileDrawerItem
              key={action.id}
              icon={<MobileIcon name={action.icon} />}
              label={action.label}
              onClick={() => onSelect(action.id)}
            />
          ))}
        </Fragment>
      ))}
    </MobileDrawer>
  );
}
