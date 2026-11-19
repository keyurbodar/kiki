import type { ThreadPreviewProps } from "@/components/thread-preview";
import type { ThreadRunStatus } from "@/components/thread-status";
import type { CaptainCard } from "@/data/api/schemas/captain";
import type { ThreadCard, ThreadOrigin } from "@/data/api/schemas/thread";
import type { ThreadFilters } from "@/features/threads/threads-page/model";
import type { CaptainAvatarValue } from "@/primitives/captain-avatar";

export type SidebarMode = "threads" | "captains";
/** Hybrid lists Captains above threads; Split shows one list at a time. */
export type SidebarLayout = "hybrid" | "split";
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
  /** Capy's project icon name; "folder" is the unchosen default that falls back to initials. */
  icon?: string;
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
  /** Settled threads sit on the settled shelf; the row menu offers Un-settle for them. */
  settled: boolean;
  pinned: boolean;
  archived: boolean;
  /** Whether the viewer owns the thread, gating Rename, Regenerate title and Delete. */
  owner: boolean;
  /** Where the thread was started; the sidebar's filter lists these. */
  origin: ThreadOrigin;
} & SidebarThreadPreview;

export type SidebarSectionKind =
  | "pinned"
  | "folder"
  | "project"
  | "recent"
  | "working"
  | "settled";

export type SidebarFolder = {
  id: string;
  name: string;
  visibility?: "private" | "shared";
  viewerRole?: "owner" | "member" | "none";
  ownerUserId?: string | null;
  members?: ReadonlyArray<{ userId: string }>;
  hidden?: boolean;
};

export type SidebarSection = {
  id: string;
  kind: SidebarSectionKind;
  /** Set on folder-backed sections, whose header carries a folder menu. */
  folder?: SidebarFolder;
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
  avatar: CaptainAvatarValue;
  status: ThreadRunStatus;
  needsYou: boolean;
  ask: string | null;
  preview: string | null;
  hasUnreads: boolean;
  crewMentionCount: number;
  age: string;
  card?: CaptainCard;
};

export type SidebarHiddenFolder = { id: string; name: string };

export type SidebarThreadsView = {
  mode: SidebarMode;
  layout: SidebarLayout;
  density: SidebarDensity;
  grouping: SidebarGrouping;
  sort: SidebarThreadSort;
  captainSort: SidebarCaptainSort;
  collapse: SidebarCollapse;
  /** The facets the list is narrowed to, on the threads page's filter model. */
  filters: ThreadFilters;
  /** The inline filter row's text; empty means no text filter. */
  filterText: string;
  sections: SidebarSection[];
  /** Folders hidden from the list, which the thread options menu offers back. */
  hiddenFolders: ReadonlyArray<SidebarHiddenFolder>;
  captains: SidebarCaptain[];
  projects: Record<string, SidebarProject>;
  activeId: string | null;
};
