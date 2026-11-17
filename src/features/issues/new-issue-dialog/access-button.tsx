import { cx } from "class-variance-authority";
import { IssuePickerCheck } from "@/components/issue-pickers";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { menuIconSlot, menuPopup, pillTrigger } from "./classes";
import { GlobeGlyph, LockGlyph } from "./icons";
import { accessLabel, type NewIssueAccess } from "./new-issue";

/** Capy's AccessButton: who can see the new issue. */
export function AccessButton({
  visibility,
  orgName,
  onChange,
}: {
  visibility: NewIssueAccess;
  orgName?: string;
  onChange: (visibility: NewIssueAccess) => void;
}) {
  const current = accessLabel(visibility, orgName);
  const item = (value: NewIssueAccess, Glyph: typeof GlobeGlyph) => (
    <MenuItem onClick={() => onChange(value)}>
      <span className={menuIconSlot}>
        <Glyph />
      </span>
      <span className="min-w-0 truncate">{accessLabel(value, orgName)}</span>
      <IssuePickerCheck checked={visibility === value} />
    </MenuItem>
  );
  return (
    <Menu>
      <MenuTrigger
        render={
          <button
            type="button"
            aria-label={`Access: ${current}`}
            title={`${visibility === "private" ? "Private" : "Shared"}: ${current}`}
            className={cx(pillTrigger, "w-(--h-control-sm) px-0")}
          >
            {visibility === "private" ? <LockGlyph /> : <GlobeGlyph />}
          </button>
        }
      />
      <MenuContent
        align="start"
        sideOffset={4}
        className={cx(menuPopup, "w-64")}
      >
        {item("shared", GlobeGlyph)}
        {item("private", LockGlyph)}
      </MenuContent>
    </Menu>
  );
}
