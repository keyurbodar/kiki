import type { ThreadRunStatus } from "@/components/thread-status";

export type SidebarMode = "threads" | "captains";
export type SidebarDensity = "compact" | "detailed";
export type SidebarGrouping = "folders" | "projects";
export type SidebarThreadSort = "lastActive" | "createdAt";
export type SidebarCaptainSort = "drag" | "activity" | "createdAt";
export type SidebarShelf = "working" | "settled";
export type SidebarCollapse = Record<SidebarShelf, boolean>;

export type SidebarProject = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type SidebarMachine = { kind: "cloud" | "device"; name: string };

export type SidebarThread = {
  id: string;
  title: string | null;
  status: ThreadRunStatus;
  needsYou: boolean;
  ask: string | null;
  hasUnreads: boolean;
  age: string;
  projectId: string | null;
  machine: SidebarMachine | null;
};

export type SidebarSectionKind =
  | "pinned"
  | "folder"
  | "project"
  | "recent"
  | "working"
  | "settled";

export type SidebarSection = {
  id: string;
  kind: SidebarSectionKind;
  label: string;
  count: number;
  countAtRest: boolean;
  open: boolean;
  threads: SidebarThread[];
  hidden: number;
};

export type SidebarCaptain = {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: ThreadRunStatus;
  needsYou: boolean;
  ask: string | null;
  preview: string | null;
  hasUnreads: boolean;
  crewMentionCount: number;
  age: string;
};

export type SidebarThreadsView = {
  mode: SidebarMode;
  density: SidebarDensity;
  grouping: SidebarGrouping;
  sort: SidebarThreadSort;
  captainSort: SidebarCaptainSort;
  collapse: SidebarCollapse;
  sections: SidebarSection[];
  captains: SidebarCaptain[];
  projects: Record<string, SidebarProject>;
  activeId: string | null;
};
