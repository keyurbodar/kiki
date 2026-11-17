import { useState } from "react";
import type {
  SidebarCaptainSort,
  SidebarDensity,
  SidebarGrouping,
  SidebarMode,
  SidebarShelf,
  SidebarThreadSort,
  SidebarThreadsView,
} from "@/components/sidebar-threads";
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
  setCollapse: (shelf: SidebarShelf, collapsed: boolean) => void;
  setSectionOpen: (sectionId: string, open: boolean) => void;
  showMore: (sectionId: string) => void;
};

export function useSidebarThreads(
  options: {
    source?: SidebarSource;
    initialPrefs?: Partial<SidebarPrefs>;
  } = {},
): SidebarThreadsController {
  const [fallbackSource] = useState(() => sampleSidebarSource(new Date()));
  const [prefs, setPrefs] = useState<SidebarPrefs>(() => ({
    ...defaultSidebarPrefs,
    ...options.initialPrefs,
  }));
  const update = (patch: Partial<SidebarPrefs>) =>
    setPrefs((current) => ({ ...current, ...patch }));
  return {
    view: buildSidebarThreadsView(options.source ?? fallbackSource, prefs),
    setMode: (mode) => update({ mode }),
    setDensity: (density) => update({ density }),
    setGrouping: (grouping) => update({ grouping }),
    setSort: (sort) => update({ sort }),
    setCaptainSort: (captainSort) => update({ captainSort }),
    setCollapse: (shelf, collapsed) =>
      setPrefs((current) => {
        const open = { ...current.open };
        delete open[`closed:shelf:${shelf}`];
        return { ...current, open, collapse: { ...current.collapse, [shelf]: collapsed } };
      }),
    setSectionOpen: (sectionId, open) =>
      setPrefs((current) => ({ ...current, open: { ...current.open, [sectionId]: open } })),
    showMore: (sectionId) =>
      setPrefs((current) => ({
        ...current,
        expanded: { ...current.expanded, [sectionId]: true },
      })),
  };
}
