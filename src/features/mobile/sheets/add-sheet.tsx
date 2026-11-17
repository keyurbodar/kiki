import type { ReactElement } from "react";
import {
  MobileSheet,
  MobileSheetRow,
  MobileSheetSeparator,
} from "./mobile-sheet";

export const mobileAddActions = [
  { id: "upload", label: "Upload attachment" },
  { id: "environment-variables", label: "Environment variables" },
] as const;

export const mobileAddContexts = [
  { id: "people", label: "People" },
  { id: "captains", label: "Captains" },
  { id: "threads", label: "Threads" },
  { id: "pulls", label: "Pull requests" },
  { id: "skills", label: "Skills" },
  { id: "plugins", label: "Plugins" },
  { id: "devices", label: "Devices" },
  { id: "files", label: "Files" },
] as const;

export type MobileAddItemId =
  | (typeof mobileAddActions)[number]["id"]
  | (typeof mobileAddContexts)[number]["id"];

export type MobileAddSheetProps = {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect: (id: MobileAddItemId) => void;
};

export function MobileAddSheet({
  trigger,
  open,
  onOpenChange,
  onSelect,
}: MobileAddSheetProps) {
  return (
    <MobileSheet
      label="Add to message"
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <div
        data-slot="responsive-menu-level"
        data-menu-list="true"
        className="flex flex-col"
      >
        {mobileAddActions.map((item) => (
          <MobileSheetRow
            key={item.id}
            label={item.label}
            onClick={() => onSelect(item.id)}
          />
        ))}
        <MobileSheetSeparator />
        {mobileAddContexts.map((item) => (
          <MobileSheetRow
            key={item.id}
            label={item.label}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </MobileSheet>
  );
}
