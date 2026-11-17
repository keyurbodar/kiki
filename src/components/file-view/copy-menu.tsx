import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuTrigger } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { copyText } from "./copy";
import { MenuIcon } from "./menu-icon";

const track = (owner: string) => `shared/files/file-view.tsx#CopyMenu:${owner}`;

export type CopyMenuProps = {
  copyPath: string | false;
  text?: string;
  link?: string;
};

export function CopyMenu({ copyPath, text, link }: CopyMenuProps) {
  if (copyPath === false && text === undefined && link === undefined)
    return null;
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
                  data-track-owner={track("Button[Copy]")}
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Copy"
                />
              }
            >
              <Icon name="clipboard" size="sm" />
            </MenuTrigger>
          }
        />
        <TooltipContent side="bottom">Copy</TooltipContent>
      </Tooltip>
      <MenuContent align="end" className="w-48">
        {copyPath !== false && (
          <ResponsiveMenuItem
            data-track-owner={track("ResponsiveMenuItem[Copy path]")}
            onClick={() =>
              void copyText(copyPath, "Path copied", "Could not copy path")
            }
          >
            <MenuIcon>
              <Icon name="folder-1" size="sm" />
            </MenuIcon>
            Copy path
          </ResponsiveMenuItem>
        )}
        <ResponsiveMenuItem
          data-track-owner={track("ResponsiveMenuItem[Copy content]")}
          disabled={text === undefined}
          onClick={() => {
            if (text !== undefined)
              void copyText(text, "Content copied", "Could not copy content");
          }}
        >
          <MenuIcon>
            <Icon name="file-text" size="sm" />
          </MenuIcon>
          Copy content
        </ResponsiveMenuItem>
        {link !== undefined && (
          <ResponsiveMenuItem
            data-track-owner={track("ResponsiveMenuItem[Copy link]")}
            onClick={() =>
              void copyText(link, "Link copied", "Could not copy link")
            }
          >
            <MenuIcon>
              <Icon name="chain-link-2" size="sm" />
            </MenuIcon>
            Copy link
          </ResponsiveMenuItem>
        )}
      </MenuContent>
    </ResponsiveMenu>
  );
}
