import type {
  PaletteAutomation,
  PaletteCaptain,
  PaletteCommand,
  PalettePull,
  PaletteThread,
} from "@/components/command-menu-search";

/**
 * What the palette searches. Each list comes from its own list atom once the
 * endpoint is typed (jams, pulls, automations, captains, projects); until then
 * the host reads neutral sample data through this interface.
 */
export type PaletteSearchSource = {
  captains: ReadonlyArray<PaletteCaptain>;
  threads: ReadonlyArray<PaletteThread>;
  pulls: ReadonlyArray<PalettePull>;
  automations: ReadonlyArray<PaletteAutomation>;
  projects: ReadonlyArray<{ id: string; name: string }>;
  repos: ReadonlyArray<{ fullName: string }>;
  machines: ReadonlyArray<{ id: string; name: string }>;
};

const hour = 60 * 60 * 1000;

import type {
  CommandMenuSearchData,
  RunOptions,
} from "@/components/command-menu-search";

export const sampleSearchSource = (now: number): PaletteSearchSource => ({
  captains: [
    { id: "cap-1", name: "Navigator", crewCount: 3, updatedAt: now - 2 * hour },
    { id: "cap-2", name: "Lookout", updatedAt: now - 20 * hour },
  ],
  threads: [
    {
      id: "thr-1",
      title: "Add retry to the upload worker",
      status: "working",
      updatedAt: now - 0.2 * hour,
      projectName: "Sample app",
    },
    {
      id: "thr-2",
      title: "Fix flaky settings test",
      status: "waiting",
      updatedAt: now - 3 * hour,
      projectName: "Sample app",
    },
    {
      id: "thr-3",
      title: "Draft the release notes",
      status: "idle",
      updatedAt: now - 26 * hour,
      projectName: "Docs",
    },
    {
      id: "thr-4",
      title: "Tidy the theme tokens",
      status: "idle",
      updatedAt: now - 50 * hour,
      projectName: "Sample app",
    },
    {
      id: "thr-5",
      title: "Investigate slow search",
      status: "failed",
      updatedAt: now - 5 * hour,
      projectName: "Sample app",
    },
    {
      id: "thr-6",
      title: "Update onboarding copy",
      status: "idle",
      updatedAt: now - 80 * hour,
      projectName: "Docs",
    },
  ],
  pulls: [
    {
      id: "pr-1",
      number: 12,
      title: "Add retry to the upload worker",
      repo: "example/sample-app",
      author: "sample-user",
      headRef: "upload-retry",
      state: "open",
      updatedAt: now - hour,
    },
    {
      id: "pr-2",
      number: 9,
      title: "Tidy the theme tokens",
      repo: "example/sample-app",
      author: "sample-user",
      headRef: "theme-tokens",
      state: "merged",
      updatedAt: now - 30 * hour,
    },
  ],
  automations: [
    { id: "auto-1", name: "Nightly dependency check", enabled: true },
    { id: "auto-2", name: "Weekly summary", enabled: false },
  ],
  projects: [
    { id: "proj-1", name: "Sample app" },
    { id: "proj-2", name: "Docs" },
  ],
  repos: [{ fullName: "example/sample-app" }, { fullName: "example/docs" }],
  machines: [],
});

export type PaletteActions = {
  go: (path: string, options?: RunOptions) => void;
  compose: () => void;
  project: () => void;
  copyUrl: () => void;
};

const nav = (
  id: string,
  title: string,
  icon: PaletteCommand["icon"],
  path: string,
  keywords: ReadonlyArray<string>,
  actions: PaletteActions,
): PaletteCommand => ({
  id,
  kind: "navigation",
  icon,
  title,
  searchTerms: [title.toLowerCase(), ...keywords],
  run: (options) => actions.go(path, options),
});

export const paletteCommands = (actions: PaletteActions): PaletteCommand[] => [
  {
    id: "shortcut-thread.new",
    kind: "action",
    icon: "page-edit-text",
    title: "New thread",
    searchTerms: ["new thread", "create", "compose", "start"],
    shortcut: ["⇧", "⌘", "O"],
    keepOpen: true,
    run: actions.compose,
  },
  {
    id: "issue-new",
    kind: "action",
    icon: "ticket",
    title: "New issue",
    searchTerms: [
      "new issue",
      "create issue",
      "file issue",
      "bug",
      "ticket",
      "task",
    ],
    run: (options) => actions.go("/issues", options),
  },
  {
    id: "automation-new",
    kind: "action",
    icon: "calendar-repeat",
    title: "New automation",
    searchTerms: ["new automation", "create automation", "schedule", "cron"],
    run: (options) => actions.go("/automation/new", options),
  },
  {
    id: "project-new",
    kind: "action",
    icon: "folder-1",
    title: "New project",
    searchTerms: [
      "new project",
      "create project",
      "add project",
      "open folder",
      "repository",
    ],
    keepOpen: true,
    run: actions.project,
  },
  {
    id: "members-invite",
    kind: "action",
    icon: "people-add",
    title: "Invite members",
    searchTerms: [
      "invite members",
      "invite teammates",
      "add teammate",
      "add people",
      "team",
    ],
    run: (options) => actions.go("/settings/org/members", options),
  },
  {
    id: "connect-github",
    kind: "action",
    icon: "github",
    title: "Connect GitHub",
    searchTerms: [
      "connect github",
      "github integration",
      "install github app",
      "repositories",
    ],
    run: (options) => actions.go("/settings/integrations/github", options),
  },
  {
    id: "copy-url",
    kind: "action",
    icon: "chain-link-2",
    title: "Copy current URL",
    searchTerms: ["copy url", "copy link", "share page"],
    run: actions.copyUrl,
  },
  nav(
    "go-threads",
    "Go to threads",
    "bubble-text",
    "/threads",
    ["threads", "all threads", "view threads"],
    actions,
  ),
  nav(
    "go-issues",
    "Go to issues",
    "ticket",
    "/issues",
    ["go to issues", "issues", "tickets", "assigned to me"],
    actions,
  ),
  nav(
    "go-pullRequests",
    "Go to pull requests",
    "branch-simple",
    "/pulls",
    ["pull requests", "prs", "pulls"],
    actions,
  ),
  nav(
    "go-automations",
    "Go to automations",
    "calendar-repeat",
    "/automations",
    ["automations", "scheduled", "cron"],
    actions,
  ),
  nav(
    "go-explore",
    "Go to Explore",
    "store-1",
    "/explore",
    ["explore", "marketplace", "plugins", "templates", "themes", "skills"],
    actions,
  ),
  nav(
    "go-memory",
    "Go to Memory",
    "brain",
    "/memory",
    ["memory", "memories", "remember", "preferences"],
    actions,
  ),
  nav(
    "go-volumes",
    "Go to Drive",
    "folder-open",
    "/drive",
    ["drive", "volumes", "files", "skills", "artifacts"],
    actions,
  ),
  nav(
    "go-shared",
    "Go to shared links",
    "chain-link-2",
    "/drive/shared",
    ["go to shared links", "shared files", "share links", "drive shares"],
    actions,
  ),
  nav(
    "go-projects",
    "Go to projects",
    "folder-1",
    "/settings/projects",
    ["projects", "repositories", "repos"],
    actions,
  ),
  ...(["light", "dark", "system"] as const).map(
    (value): PaletteCommand => ({
      id: "theme-" + value,
      kind: "appearance",
      icon:
        value === "light"
          ? "sun"
          : value === "dark"
            ? "moon"
            : "appearance-dark-mode",
      title: "Switch to " + value + " mode",
      searchTerms: [
        value + " mode",
        value + " theme",
        "appearance",
        "mode",
        "theme",
      ],
      run: () => undefined,
    }),
  ),
  {
    id: "docs",
    kind: "account",
    icon: "book",
    title: "Documentation",
    searchTerms: ["documentation", "docs", "help", "support"],
    run: () =>
      void window.open("https://docs.capy.ai", "_blank", "noopener,noreferrer"),
  },
];

export const threadCommands = (): PaletteCommand[] => [
  {
    id: "thread-pin",
    kind: "threadAction",
    icon: "pin",
    title: "Pin thread",
    searchTerms: ["pin thread"],
    run: () => undefined,
  },
  {
    id: "thread-rename",
    kind: "threadAction",
    icon: "pencil",
    title: "Rename thread",
    searchTerms: ["rename thread", "title"],
    run: () => undefined,
  },
  {
    id: "thread-share",
    kind: "threadAction",
    icon: "arrow-share-left",
    title: "Copy thread link",
    searchTerms: ["copy thread link", "share thread"],
    run: () => undefined,
  },
  {
    id: "thread-unread",
    kind: "threadAction",
    icon: "bubble-dots",
    title: "Mark as unread",
    searchTerms: ["mark as unread", "unread"],
    run: () => undefined,
  },
  {
    id: "thread-retitle",
    kind: "threadAction",
    icon: "rotate",
    title: "Regenerate title",
    searchTerms: ["regenerate title", "auto title"],
    run: () => undefined,
  },
  {
    id: "thread-archive",
    kind: "threadAction",
    icon: "draft-simple",
    title: "Archive thread",
    searchTerms: ["archive thread"],
    run: () => undefined,
  },
  {
    id: "thread-delete",
    kind: "threadAction",
    icon: "x",
    title: "Delete thread",
    searchTerms: ["delete thread", "remove thread"],
    intent: "danger",
    run: () => undefined,
  },
];

export const threadIdFromPath = (pathname: string) =>
  /^\/thread\/([^/]+)/.exec(pathname)?.[1];

export const buildSearchData = (
  source: PaletteSearchSource,
  actions: PaletteActions,
  pathname: string,
): CommandMenuSearchData => {
  const threadId = threadIdFromPath(pathname);
  const thread =
    threadId === undefined
      ? undefined
      : (source.threads.find((candidate) => candidate.id === threadId) ?? {
          id: threadId,
          title: "Untitled thread",
          status: "idle" as const,
          updatedAt: 0,
        });
  return {
    captains: source.captains,
    threads: source.threads,
    pulls: source.pulls,
    automations: source.automations,
    commands: paletteCommands(actions),
    currentThread:
      thread === undefined ? undefined : { thread, commands: threadCommands() },
    settings: [],
    settingsSections: [],
  };
};

const isoToMillis = (value: unknown) => {
  if (typeof value !== "string") return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

type ThreadRow = {
  id?: string;
  title?: string | null;
  status?: string;
  updatedAt?: unknown;
  lastActivityAt?: unknown;
  projectId?: string | null;
  archived?: boolean;
  hasUnreads?: boolean;
};

type ProjectRow = { id?: string; name?: string };

export const sourceFromAtoms = (
  threads: ReadonlyArray<ThreadRow>,
  projects: ReadonlyArray<ProjectRow>,
  now: number,
): PaletteSearchSource => ({
  captains: [],
  threads: threads.map(
    (thread): PaletteThread => ({
      id: thread.id ?? "",
      title: thread.title ?? "Untitled thread",
      status:
        thread.status === "working" ||
        thread.status === "waiting" ||
        thread.status === "failed" ||
        thread.status === "idle" ||
        thread.status === "archived"
          ? thread.status
          : "idle",
      updatedAt: isoToMillis(thread.lastActivityAt ?? thread.updatedAt) || now,
      projectName: projects.find((project) => project.id === thread.projectId)
        ?.name,
      archived: thread.archived,
      hasUnreads: thread.hasUnreads,
    }),
  ),
  pulls: [],
  automations: [],
  projects: projects.flatMap((project) =>
    project.id === undefined
      ? []
      : [{ id: project.id, name: project.name ?? "" }],
  ),
  repos: [],
  machines: [],
});
