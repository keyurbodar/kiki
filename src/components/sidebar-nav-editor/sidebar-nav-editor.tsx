import { type ComponentProps, useState } from "react";
import {
  cx,
  menuCheckIcon,
  menuIconSlot,
} from "@/components/app-sidebar/classes";
import { Checkmark1Icon } from "@/components/app-sidebar/icons";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import {
  normalizeSidebarNav,
  type SidebarNavEntry,
  sidebarNavPages,
  toggleSidebarNavItem,
} from "./sidebar-nav";
import { SIDEBAR_NAV_CONFIG } from "./sidebar-nav-items";
import { useSidebarNavPreference } from "./sidebar-nav-preference";

export type SidebarNavEditorProps = ComponentProps<"div"> & {
  memory?: boolean;
};

export function SidebarNavEditor({ memory, ...props }: SidebarNavEditorProps) {
  const [entries, save] = useSidebarNavPreference();
  return (
    <div {...props}>
      <SidebarPagesMenuItems
        nav={{ entries, editable: true, save }}
        memory={memory}
      />
    </div>
  );
}

export type SidebarNavState = {
  entries: SidebarNavEntry[];
  editable: boolean;
  save: (entries: SidebarNavEntry[]) => void;
};

export type UseSidebarNavOptions = {
  value?: ReadonlyArray<{ item: string; hidden?: boolean }> | null;
  defaultValue?: ReadonlyArray<{ item: string; hidden?: boolean }> | null;
  onChange?: (entries: SidebarNavEntry[]) => void;
  editable?: boolean;
};

export function useSidebarNav({
  value,
  defaultValue,
  onChange,
  editable = true,
}: UseSidebarNavOptions = {}): SidebarNavState {
  const [local, setLocal] = useState(() => normalizeSidebarNav(defaultValue));
  const entries = value === undefined ? local : normalizeSidebarNav(value);
  return {
    entries,
    editable,
    save: (next) => {
      if (value === undefined) setLocal(next);
      onChange?.(next);
    },
  };
}

export type SidebarPagesMenuItemsProps = {
  nav: SidebarNavState;
  memory?: boolean;
};

export function SidebarPagesMenuItems({
  nav,
  memory,
}: SidebarPagesMenuItemsProps) {
  return sidebarNavPages(nav.entries, { memory }).map((page) => {
    const { label, icon: PageIcon } = SIDEBAR_NAV_CONFIG[page.item];
    return (
      <ResponsiveMenuItem
        key={page.item}
        data-track-owner="shared/sidebar-nav-editor.tsx#SidebarPagesMenuItems:ResponsiveMenuItem.1"
        closeOnClick={false}
        disabled={!nav.editable}
        onClick={() => nav.save(toggleSidebarNavItem(nav.entries, page.item))}
      >
        <span className={menuIconSlot}>
          <PageIcon />
        </span>
        {label}
        {page.hidden === true ? null : (
          <Checkmark1Icon className={cx(menuCheckIcon)} />
        )}
      </ResponsiveMenuItem>
    );
  });
}
