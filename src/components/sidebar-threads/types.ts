import type { ThreadPreviewProps } from "@/components/thread-preview";
import type { ThreadRunStatus } from "@/components/thread-status";
import type { ThreadCard } from "@/data/api/schemas/thread";

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

/**
 * Everything the hover card can draw that the data layer already carries. Each
 * field is optional: omitting it drops that part of the card, and the component
 * never fills a missing value in.
 */
export type SidebarThreadPreview = Pick<
  ThreadPreviewProps,
  | "code"
  | "description"
  | "project"
  | "model"
  | "members"
  | "asks"
  | "crew"
  | "issues"
  | "tasks"
  | "multirepo"
> & { card?: ThreadCard };

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
} & SidebarThreadPreview;

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
