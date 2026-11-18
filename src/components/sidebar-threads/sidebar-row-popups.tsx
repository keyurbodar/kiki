import { type ComponentProps, type ReactNode, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import type { SidebarThread } from "./types";

export type SidebarRowPopupsProps = Omit<ComponentProps<"div">, "children"> & {
  threads: ReadonlyMap<string, SidebarThread>;
  /** Capy's thread menu, mounted here and in each row's `…` cluster. */
  renderMenu?: (thread: SidebarThread) => ReactNode;
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
  renderMenu,
  mode,
  className,
  onClickCapture,
  children,
  ...props
}: SidebarRowPopupsProps) {
  const [thread, setThread] = useState<SidebarThread | null>(null);
  const row = useRef<Element | null>(null);
  const resolveFrom = (
    target: EventTarget | null,
    preventDefault: () => void,
  ) => {
    const found =
      target instanceof Element ? target.closest("[data-row-menu]") : null;
    const id = found
      ?.querySelector("[data-sidebar-target]")
      ?.getAttribute("data-sidebar-target");
    const match = id === null || id === undefined ? undefined : threads.get(id);
    if (match === undefined) {
      preventDefault();
      setThread(null);
      return;
    }
    if (row.current !== found) {
      row.current?.removeAttribute("data-popup-open");
      row.current = found;
    }
    setThread(match);
  };
  return (
    <ContextMenu
      onOpenChange={(open) => {
        row.current?.toggleAttribute("data-popup-open", open);
        if (!open) {
          row.current = null;
          setThread(null);
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
          : renderMenu(thread)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
