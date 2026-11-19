import { useState } from "react";
import type {
  SidebarCaptainSort,
  SidebarDensity,
  SidebarGrouping,
  SidebarLayout,
  SidebarMode,
  SidebarShelf,
  SidebarThreadSort,
  SidebarThreadsView,
} from "@/components/sidebar-threads";
import type { ThreadFilters } from "@/features/threads/threads-page/model";
import {
  buildSidebarThreadsView,
  defaultSidebarPrefs,
  type SidebarPrefs,
  type SidebarSource,
} from "./build-view";
import { sampleSidebarSource } from "./sample";

export type SidebarThreadsController = {
  view: SidebarThreadsView;
  setMode: (mode: SidebarMode) => void;
  setDensity: (density: SidebarDensity) => void;
  setGrouping: (grouping: SidebarGrouping) => void;
  setSort: (sort: SidebarThreadSort) => void;
  setCaptainSort: (sort: SidebarCaptainSort) => void;
  setFilters: (filters: ThreadFilters) => void;
  setFilterText: (text: string) => void;
  setCollapse: (shelf: SidebarShelf, collapsed: boolean) => void;
  setSectionOpen: (sectionId: string, open: boolean) => void;
  showMore: (sectionId: string) => void;
};

export function useSidebarThreads(
  options: {
    source?: SidebarSource;
    /** Nothing has landed yet: the list draws Capy's `Loading threads` row. */
    loading?: boolean;
    layout?: SidebarLayout;
    initialPrefs?: Partial<SidebarPrefs>;
  } = {},
): SidebarThreadsController {
  const [fallbackSource] = useState(() => sampleSidebarSource(new Date()));
  const [prefs, setPrefs] = useState<SidebarPrefs>(() => ({
    ...defaultSidebarPrefs,
    ...options.initialPrefs,
  }));
  // The layout is a stored preference the settings page writes, not view state,
  // so it is read on every render instead of being copied into prefs.
  const view = buildSidebarThreadsView(
    options.loading === true
      ? { ...fallbackSource, loading: true }
      : (options.source ?? fallbackSource),
    {
      ...prefs,
      layout: options.layout ?? defaultSidebarPrefs.layout,
    },
  );
  const update = (patch: Partial<SidebarPrefs>) =>
    setPrefs((current) => ({ ...current, ...patch }));
  return {
    view,
    setMode: (mode) => update({ mode }),
    setDensity: (density) => update({ density }),
    setGrouping: (grouping) => update({ grouping }),
    setSort: (sort) => update({ sort }),
    setCaptainSort: (captainSort) => update({ captainSort }),
    setFilters: (filters) => update({ filters }),
    setFilterText: (filterText) => update({ filterText }),
    setCollapse: (shelf, collapsed) =>
      setPrefs((current) => {
        const open = { ...current.open };
        delete open[`closed:shelf:${shelf}`];
        return {
          ...current,
          open,
          collapse: { ...current.collapse, [shelf]: collapsed },
        };
      }),
    setSectionOpen: (sectionId, open) =>
      setPrefs((current) => ({
        ...current,
        open: { ...current.open, [sectionId]: open },
      })),
    showMore: (sectionId) =>
      setPrefs((current) => ({
        ...current,
        expanded: { ...current.expanded, [sectionId]: true },
      })),
  };
}
