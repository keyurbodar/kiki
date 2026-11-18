import type { ReactNode } from "react";
import { copyText } from "@/components/file-view/copy";
import type { PullCard } from "@/features/pulls/pulls-page/data/pull";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { MenuItem } from "@/primitives/menu";

const pullPath = (pull: PullCard) => {
  const owner = pull.repo.slice(0, pull.repo.indexOf("/"));
  const repo = pull.repo.slice(pull.repo.indexOf("/") + 1);
  return `/pull/${owner}/${repo}/${pull.number}`;
};

const iconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";

export type PullRowMenuProps = {
  pull: PullCard;
  pinned: boolean;
  onTogglePin: (id: string) => void;
  children: ReactNode;
};

/**
 * Capy's pull row context menu: right-click or long-press a row and the five
 * items it offers — open in a new tab, pin, open on GitHub, copy the branch and
 * copy the link.
 */
export function PullRowMenu({
  pull,
  pinned,
  onTogglePin,
  children,
}: PullRowMenuProps) {
  const open = (href: string) => window.open(href, "_blank", "noopener");
  return (
    <ContextMenu>
      <ContextMenuTrigger className="block">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <MenuItem onClick={() => open(pullPath(pull))}>
          <span className={iconSlot}>
            <Icon name="arrow-up-right" size="sm" />
          </span>
          Open in new tab
        </MenuItem>
        <MenuItem onClick={() => onTogglePin(pull.id)}>
          <span className={iconSlot}>
            <Icon name="pin" size="sm" />
          </span>
          {pinned ? "Unpin" : "Pin"}
        </MenuItem>
        <MenuItem onClick={() => open(pull.url)}>
          <span className={iconSlot}>
            <Icon name="github" size="sm" />
          </span>
          Open in GitHub
        </MenuItem>
        <MenuItem
          onClick={() =>
            void copyText(
              pull.headRef,
              "Branch copied",
              "Could not copy the branch",
            )
          }
        >
          <span className={iconSlot}>
            <Icon name="branch" size="sm" />
          </span>
          Copy branch
        </MenuItem>
        <MenuItem
          onClick={() =>
            void copyText(
              `${window.location.origin}${pullPath(pull)}`,
              "Link copied",
              "Could not copy link",
            )
          }
        >
          <span className={iconSlot}>
            <Icon name="chain-link-1" size="sm" />
          </span>
          Copy link
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
