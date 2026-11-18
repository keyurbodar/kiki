import { type ReactNode, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { Icon } from "@/primitives/icon";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";

/** The nav row a right-click resolved, as the link itself declares it. */
type SettingsNavRow = { to: string; label: string };

const menuIconClassName =
  "flex size-4 shrink-0 items-center justify-center text-icon-muted";

const copyLink = async (to: string) => {
  const url = `${window.location.origin}${to}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    return;
  }
};

export type SettingsNavPopupsProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Capy's settings nav rows each carry a context menu. As in the app sidebar,
 * one menu serves the whole list: the trigger resolves the row under the
 * pointer from its `[data-nav-row]` marker, so a right-click on empty list
 * space opens nothing.
 */
export function SettingsNavPopups({
  className,
  children,
}: SettingsNavPopupsProps) {
  const [row, setRow] = useState<SettingsNavRow | null>(null);
  const resolveFrom = (
    target: EventTarget | null,
    preventDefault: () => void,
  ) => {
    const link =
      target instanceof Element ? target.closest("[data-nav-row]") : null;
    const to = link?.getAttribute("data-nav-row");
    if (to === null || to === undefined || to === "") {
      preventDefault();
      setRow(null);
      return;
    }
    setRow({ to, label: link?.getAttribute("data-nav-label") ?? "" });
  };
  return (
    <ContextMenu onOpenChange={(open) => !open && setRow(null)}>
      <ContextMenuTrigger
        className={className}
        onContextMenu={(event) =>
          resolveFrom(event.target, () => event.preventDefault())
        }
        onTouchStart={(event) => resolveFrom(event.target, () => {})}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {row === null ? null : (
          <>
            <ResponsiveMenuItem
              onClick={() => window.open(row.to, "_blank")}
              aria-label={`Open ${row.label} in a new tab`}
            >
              <span className={menuIconClassName}>
                <Icon name="square-arrow-top-right" size="sm" />
              </span>
              Open in new tab
            </ResponsiveMenuItem>
            <ResponsiveMenuItem
              onClick={() => void copyLink(row.to)}
              aria-label={`Copy link to ${row.label}`}
            >
              <span className={menuIconClassName}>
                <Icon name="chain-link-1" size="sm" />
              </span>
              Copy link
            </ResponsiveMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
