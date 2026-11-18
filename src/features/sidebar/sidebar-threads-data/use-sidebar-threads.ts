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
import type { ThreadOrigin } from "@/data/api/schemas/thread";
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
  setFilterOrigins: (origins: ReadonlyArray<ThreadOrigin>) => void;
  setCollapse: (shelf: SidebarShelf, collapsed: boolean) => void;
  setSectionOpen: (sectionId: string, open: boolean) => void;
  showMore: (sectionId: string) => void;
};

export function useSidebarThreads(
  options: {
    source?: SidebarSource;
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
  const view = buildSidebarThreadsView(options.source ?? fallbackSource, {
    ...prefs,
    layout: options.layout ?? defaultSidebarPrefs.layout,
  });
  const update = (patch: Partial<SidebarPrefs>) =>
    setPrefs((current) => ({ ...current, ...patch }));
  return {
    view,
    setMode: (mode) => update({ mode }),
    setDensity: (density) => update({ density }),
    setGrouping: (grouping) => update({ grouping }),
    setSort: (sort) => update({ sort }),
    setCaptainSort: (captainSort) => update({ captainSort }),
    setFilterOrigins: (filterOrigins) => update({ filterOrigins }),
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
