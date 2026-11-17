import type {
  ImportPlacement,
  ImportRunner,
} from "@/components/import-job-indicator";

export type ImportSource = "claude-code" | "codex";

export type ImportSession = {
  source: ImportSource;
  sessionId: string;
  title: string;
  endedAt: string;
  cwd: string | null;
  folderExists?: boolean;
  repos: readonly string[];
  projectId: string | null;
  projectName?: string | null;
  via: string;
  imported: boolean;
  updatable: boolean;
  destinationLocked?: boolean;
};

export type ImportProject = {
  id: string;
  name: string;
  repos: readonly string[];
};

export type ImportManifest = {
  sessions: readonly ImportSession[];
  projects: readonly ImportProject[];
  versions: { claude: string | null; codex: string | null };
};

export type ImportManifestResult =
  | { ok: true; manifest: ImportManifest }
  | { ok: false; detail: string };

export type ImportBridge = ImportRunner & {
  manifest: (orgId: string) => Promise<ImportManifestResult>;
};

export type ImportStep = "sessions" | "projects" | "progress";

export type ProjectGroup = {
  id: string;
  name: string;
  repos: readonly string[];
  existing: boolean;
  unresolved?: boolean;
  sessions: ImportSession[];
};

export type FolderGroup = {
  key: string;
  name: string;
  path: string;
  exists: boolean;
  sessions: ImportSession[];
};

export type SessionGroups = {
  projects: ProjectGroup[];
  folders: FolderGroup[];
};

export type PlacementRow = {
  key: string;
  source: string;
  repository: boolean;
  projectId: string | null;
  name: string;
  unresolved: boolean;
  editable: boolean;
  locked: boolean;
  count: number;
  sessions: ImportSession[];
};

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const sessionKey = (session: { source: string; sessionId: string }) =>
  `${session.source}:${session.sessionId}`;

export const isMovable = (session: ImportSession) =>
  !session.imported && !session.updatable && session.destinationLocked !== true;

export const isDraftProject = (id: string) => id.startsWith("project_dry_");

export const lastSegment = (path: string) =>
  path
    .split("/")
    .filter((part) => part.length > 0)
    .at(-1) ?? path;

export const tildePath = (path: string) => {
  const home = /^\/Users\/[^/]+|^\/home\/[^/]+/.exec(path)?.[0];
  return home === undefined ? path : `~${path.slice(home.length)}`;
};

export const formatEndedAt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export const sourceLabel = (source: ImportSource) =>
  source === "claude-code" ? "Claude Code" : "Codex";

const joinNames = (names: readonly string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

export function sessionsSummary(
  manifest: ImportManifest | undefined,
  source: ImportSource | undefined,
) {
  if (manifest === undefined)
    return source === undefined
      ? "Finding sessions"
      : `Finding ${sourceLabel(source)} sessions`;
  const tools = [
    ...(source === "codex" || manifest.versions.claude === null
      ? []
      : [`Claude Code ${manifest.versions.claude}`]),
    ...(source === "claude-code" || manifest.versions.codex === null
      ? []
      : [`Codex ${manifest.versions.codex}`]),
  ];
  const count = `${manifest.sessions.length} ${manifest.sessions.length === 1 ? "session" : "sessions"}`;
  return tools.length === 0 ? count : `${count} from ${joinNames(tools)}`;
}

export function scopeManifest(
  manifest: ImportManifest,
  source: ImportSource | undefined,
  doneKeys: ReadonlySet<string>,
) {
  const sessions = manifest.sessions.flatMap((session) =>
    source !== undefined && session.source !== source
      ? []
      : [session.updatable ? { ...session, imported: false } : session],
  );
  return {
    manifest: { ...manifest, sessions },
    selected: new Set(
      sessions
        .filter(
          (session) => !session.imported && !doneKeys.has(sessionKey(session)),
        )
        .map(sessionKey),
    ),
  };
}

export function groupSessions(
  manifest: ImportManifest | undefined,
): SessionGroups {
  const sessions = manifest?.sessions ?? [];
  const known = manifest?.projects ?? [];
  const projects = [
    ...new Map<string, ImportProject>([
      ...known.map((project): [string, ImportProject] => [project.id, project]),
      ...sessions.flatMap(
        (session): Array<[string, ImportProject]> =>
          session.projectId !== null &&
          !isMovable(session) &&
          !known.some((project) => project.id === session.projectId)
            ? [
                [
                  session.projectId,
                  {
                    id: session.projectId,
                    name: session.projectName ?? "Unavailable project",
                    repos: session.repos,
                  },
                ],
              ]
            : [],
      ),
    ]).values(),
  ].filter(
    (project) => project.repos.length > 0 || !isDraftProject(project.id),
  );
  const projectIds = new Set(projects.map((project) => project.id));
  const byProject = new Map<string, ImportSession[]>();
  const byFolder = new Map<string, ImportSession[]>();
  const ambiguous = new Map<string, ImportSession[]>();
  const push = (
    map: Map<string, ImportSession[]>,
    key: string,
    session: ImportSession,
  ) => map.set(key, [...(map.get(key) ?? []), session]);
  for (const session of sessions) {
    if (session.via === "ambiguous" && isMovable(session))
      push(
        ambiguous,
        session.repos
          .map((repo) => repo.toLowerCase())
          .toSorted()
          .join(","),
        session,
      );
    else if (session.projectId !== null && projectIds.has(session.projectId))
      push(byProject, session.projectId, session);
    else push(byFolder, session.cwd ?? "", session);
  }
  return {
    projects: [
      ...[...ambiguous].map(
        ([key, group]): ProjectGroup => ({
          id: `ambiguous:${key}`,
          name: lastSegment(
            group[0]?.repos[0] ?? group[0]?.cwd ?? "Imported sessions",
          ),
          repos: group[0]?.repos ?? [],
          existing: false,
          unresolved: true,
          sessions: group,
        }),
      ),
      ...projects.flatMap((project): ProjectGroup[] => {
        const group = byProject.get(project.id);
        return group === undefined
          ? []
          : [
              {
                id: project.id,
                name: project.name,
                repos: project.repos,
                existing: sessions.some(
                  (session) =>
                    session.projectId === project.id &&
                    session.via !== "unlinked",
                ),
                sessions: group,
              },
            ];
      }),
    ],
    folders: [...byFolder]
      .map(
        ([key, group]): FolderGroup => ({
          key,
          name: lastSegment(key),
          path: tildePath(key),
          exists: group[0]?.folderExists ?? false,
          sessions: group,
        }),
      )
      .toSorted((a, b) => b.sessions.length - a.sessions.length),
  };
}

export const selectableKeys = (group: { sessions: readonly ImportSession[] }) =>
  group.sessions.filter((session) => !session.imported).map(sessionKey);

export function setKeys(
  selected: ReadonlySet<string>,
  keys: readonly string[],
  checked: boolean,
) {
  const next = new Set(selected);
  for (const key of keys) {
    if (checked) next.add(key);
    else next.delete(key);
  }
  return next;
}

export function toggleSelection(
  selected: ReadonlySet<string>,
  groups: SessionGroups,
  anchor: string | undefined,
  key: string,
  shift: boolean,
): { selected: Set<string>; anchor: string | undefined } {
  const range =
    anchor === undefined
      ? undefined
      : [...groups.projects, ...groups.folders]
          .map(selectableKeys)
          .find((keys) => keys.includes(key) && keys.includes(anchor));
  if (shift && anchor !== undefined && range !== undefined) {
    const from = range.indexOf(anchor);
    const to = range.indexOf(key);
    return {
      selected: setKeys(
        selected,
        range.slice(Math.min(from, to), Math.max(from, to) + 1),
        !selected.has(key),
      ),
      anchor,
    };
  }
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return { selected: next, anchor: key };
}

export function placementRows(
  groups: SessionGroups,
  manifest: ImportManifest | undefined,
  selected: ReadonlySet<string>,
  overrides: ReadonlyMap<string, string>,
): PlacementRow[] {
  return [...groups.projects, ...groups.folders].flatMap((group) =>
    [false, true].flatMap((locked): PlacementRow[] => {
      const picked = group.sessions.filter(
        (session) =>
          selected.has(sessionKey(session)) && !isMovable(session) === locked,
      );
      const first = picked[0];
      if (first === undefined) return [];
      const projectId = overrides.get(sessionKey(first)) ?? first.projectId;
      return [
        {
          key: `${"id" in group ? group.id : group.key}:${locked}`,
          source: first.repos[0] ?? tildePath(first.cwd ?? group.name),
          repository: first.repos.length > 0,
          projectId,
          name:
            (locked && projectId === null ? "No project" : undefined) ??
            manifest?.projects.find((project) => project.id === projectId)
              ?.name ??
            first.projectName ??
            group.name,
          unresolved: picked.some(
            (session) =>
              session.via === "ambiguous" &&
              !overrides.has(sessionKey(session)),
          ),
          editable:
            !locked &&
            picked.some(
              (session) =>
                session.repos.length > 0 && session.via !== "unlinked",
            ),
          locked,
          count: picked.length,
          sessions: group.sessions,
        },
      ];
    }),
  );
}

export const hasUnresolved = (
  selected: readonly ImportSession[],
  overrides: ReadonlyMap<string, string>,
) =>
  selected.some(
    (session) =>
      isMovable(session) &&
      session.via === "ambiguous" &&
      !overrides.has(sessionKey(session)),
  );

export function assignProject(
  overrides: ReadonlyMap<string, string>,
  sessions: readonly ImportSession[],
  projectId: string,
) {
  return new Map([
    ...overrides,
    ...sessions
      .filter(isMovable)
      .map((session): [string, string] => [sessionKey(session), projectId]),
  ]);
}

export function buildPlacements(
  selected: readonly ImportSession[],
  overrides: ReadonlyMap<string, string>,
  projects: readonly ImportProject[],
): ImportPlacement[] {
  return selected.map((session) => {
    const moved = overrides.get(sessionKey(session));
    return {
      source: session.source,
      sessionId: session.sessionId,
      projectId: moved ?? session.projectId,
      movedToRepos:
        moved === undefined
          ? undefined
          : projects.find((project) => project.id === moved)?.repos,
    };
  });
}

export function destinationProjects(
  projects: readonly ImportProject[],
  sessions: readonly ImportSession[],
  query: string,
) {
  const repos = new Set(
    sessions.flatMap((session) =>
      session.repos.map((repo) => repo.toLowerCase()),
    ),
  );
  const needle = query.trim().toLowerCase();
  return projects.filter(
    (project) =>
      !isDraftProject(project.id) &&
      project.repos.some((repo) => repos.has(repo.toLowerCase())) &&
      project.name.toLowerCase().includes(needle),
  );
}

export const destinationLabel = (
  name: string,
  projectId: string | null,
  unresolved: boolean,
) =>
  unresolved
    ? "Choose project"
    : projectId === null || isDraftProject(projectId)
      ? `New project: ${name}`
      : name;

export const footerStatus = (
  selectedCount: number,
  step: ImportStep,
  ready: boolean,
) =>
  selectedCount === 0
    ? "Nothing to import"
    : step === "projects" && !ready
      ? "Choose a project to continue"
      : `${selectedCount} selected`;

export const deviceNoun = (platform: string) =>
  /mac/i.test(platform) ? "Mac" : /win/i.test(platform) ? "PC" : "computer";
