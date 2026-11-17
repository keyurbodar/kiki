import { Fragment, type ReactNode, useContext } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuSeparator, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { DiffWrapContext } from "./file-context";
import { MenuIcon } from "./menu-icon";

const track = (owner: string) => `shared/files/file-view.tsx#FileMenu:${owner}`;

export function DiffWrapMenuItem() {
  const { wrap, setWrap } = useContext(DiffWrapContext);
  return (
    <ResponsiveMenuItem
      data-track-owner="shared/diff-wrap-menu-item.tsx#DiffWrapMenuItem:ResponsiveMenuItem[Wrap lines]"
      closeOnClick={false}
      onClick={() => setWrap(!wrap)}
    >
      <MenuIcon>
        <Icon name="linebreak" size="sm" />
      </MenuIcon>
      Wrap lines
      {wrap && (
        <Icon
          name="checkmark-1"
          size="sm"
          className="ml-auto shrink-0 text-foreground"
        />
      )}
    </ResponsiveMenuItem>
  );
}

export type FileMenuProps = {
  actions?: ReactNode;
  onOpenDiffs?: () => void;
  wrap: boolean;
};

export function FileMenu({ actions, onOpenDiffs, wrap }: FileMenuProps) {
  const groups = [
    { key: "actions", node: actions },
    {
      key: "diff",
      node:
        onOpenDiffs === undefined ? null : (
          <ResponsiveMenuItem
            data-track-owner={track("ResponsiveMenuItem[View thread diff]")}
            onClick={onOpenDiffs}
          >
            <MenuIcon>
              <Icon name="changes" size="sm" />
            </MenuIcon>
            View thread diff
          </ResponsiveMenuItem>
        ),
    },
    { key: "wrap", node: wrap ? <DiffWrapMenuItem /> : null },
  ].filter((group) => group.node !== null && group.node !== undefined);
  if (groups.length === 0) return null;
  return (
    <ResponsiveMenu>
      <Tooltip>
        <TooltipTrigger
          data-track-owner={track("TooltipTrigger.1")}
          render={
            <MenuTrigger
              data-track-owner={track("ResponsiveMenuTrigger.1")}
              render={
                <Button
                  data-track-owner={track("Button[File options]")}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="File options"
                />
              }
            >
              <Icon name="bubble-dots" size="sm" />
            </MenuTrigger>
          }
        />
        <TooltipContent side="bottom">Options</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-56">
        {groups.map((group, index) => (
          <Fragment key={group.key}>
            {index > 0 && <MenuSeparator />}
            {group.node}
          </Fragment>
        ))}
      </MenuContent>
    </ResponsiveMenu>
  );
}
