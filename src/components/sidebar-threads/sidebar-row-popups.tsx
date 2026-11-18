import { type ComponentProps, type ReactNode, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import type { SidebarCaptain, SidebarThread } from "./types";

export type SidebarRowPopupsProps = Omit<ComponentProps<"div">, "children"> & {
  threads: ReadonlyMap<string, SidebarThread>;
  /** Captains, so a right-click on a Captain row opens the Captain's menu. */
  captains?: ReadonlyMap<string, SidebarCaptain>;
  /**
   * Capy's thread menu, mounted here and in each row's `…` cluster. The row's
   * section is passed along so a thread rendered in two sections edits one row.
   */
  renderMenu?: (thread: SidebarThread, rowKey?: string) => ReactNode;
  /** Capy's Captain menu for the Captain rows. */
  renderCaptainMenu?: (captain: SidebarCaptain) => ReactNode;
  mode?: string;
  children: ReactNode;
};

/**
 * Capy's `SidebarRowPopups`: one context menu for the whole thread list rather
 * than one per row. The trigger resolves the row under the pointer from its
 * `data-row-menu` marker and opens the list's menu anchored there, so a
 * right-click on empty list space opens nothing.
 */
export function SidebarRowPopups({
  threads,
  captains,
  renderMenu,
  renderCaptainMenu,
  mode,
  className,
  onClickCapture,
  children,
  ...props
}: SidebarRowPopupsProps) {
  const [thread, setThread] = useState<SidebarThread | null>(null);
  const [rowKey, setRowKey] = useState<string | null>(null);
  const [captain, setCaptain] = useState<SidebarCaptain | null>(null);
  const row = useRef<Element | null>(null);
  const resolveFrom = (
    target: EventTarget | null,
    preventDefault: () => void,
  ) => {
    const found =
      target instanceof Element ? target.closest("[data-row-menu]") : null;
    const marker =
      found?.getAttribute("data-sidebar-target") ??
      found
        ?.querySelector("[data-sidebar-target]")
        ?.getAttribute("data-sidebar-target");
    const captainRow = found?.hasAttribute("data-captain-row") === true;
    const match =
      marker === null || marker === undefined
        ? undefined
        : captainRow
          ? captains?.get(marker)
          : threads.get(marker);
    if (match === undefined) {
      preventDefault();
      setThread(null);
      setCaptain(null);
      return;
    }
    setCaptain(captainRow ? (match as SidebarCaptain) : null);
    setThread(captainRow ? null : (match as SidebarThread));
    setRowKey(
      found?.closest("[data-section-id]")?.getAttribute("data-section-id") ??
        null,
    );
    if (row.current !== found) {
      row.current?.removeAttribute("data-popup-open");
      row.current = found;
    }
  };
  return (
    <ContextMenu
      onOpenChange={(open) => {
        row.current?.toggleAttribute("data-popup-open", open);
        if (!open) {
          row.current = null;
          setThread(null);
          setRowKey(null);
          setCaptain(null);
        }
      }}
    >
      <ContextMenuTrigger
        data-track-owner="shared/sidebar-threads.tsx#SidebarRowPopups:ContextMenuTrigger.1"
        data-sidebar-mode={mode}
        className={className}
        onContextMenu={(event) =>
          resolveFrom(event.target, () => event.preventDefault())
        }
        onTouchStart={(event) => resolveFrom(event.target, () => {})}
        onClickCapture={onClickCapture}
        {...props}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {thread === null || renderMenu === undefined
          ? null
          : renderMenu(thread, rowKey ?? undefined)}
        {captain === null || renderCaptainMenu === undefined
          ? null
          : renderCaptainMenu(captain)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
