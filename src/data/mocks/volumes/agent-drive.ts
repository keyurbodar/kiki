import { captains, models, projects, viewer } from "../fixtures/world.ts";

/**
 * Capy-shaped drive scopes for the Instructions and Skills settings: one
 * `artifacts` volume per exact scope (org, project, user, project-user,
 * captain) holding AGENTS.md, CREW.md and skills/<name>/SKILL.md files. The
 * provisional volumes fixtures above keep serving every other caller.
 */

export type AgentDriveScope = {
  readonly projectId?: string | undefined;
  readonly userId?: string | undefined;
  readonly automationId?: string | undefined;
  readonly captainJamId?: string | undefined;
};

export type AgentDriveFiles = ReadonlyMap<string, string>;

export type AgentDriveState = ReadonlyMap<string, AgentDriveFiles>;

export const agentVersionPrefix = "vver_agent_";

const skill = (name: string, description: string) =>
  [
    `skills/${name}/SKILL.md`,
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nWhen to use this skill and the steps Capy follows.\n`,
  ] as const;

export const agentDriveScopeKey = (scope: AgentDriveScope) =>
  [
    scope.projectId ?? "",
    scope.userId ?? "",
    scope.automationId ?? "",
    scope.captainJamId ?? "",
  ].join("|");

export const agentDriveSeed: AgentDriveState = new Map([
  [
    agentDriveScopeKey({ projectId: projects.web.id }),
    new Map([
      skill(
        "api-review",
        "Reviews a change to the public API for breaking changes, naming and docs. Use when a pull request touches routes or schemas.",
      ),
      skill(
        "changelog",
        "Writes the changelog entry for a release from merged pull requests. Use when cutting a release or when asked for release notes.",
      ),
      skill(
        "dependency-audit",
        "Checks dependency updates for licence, size and security changes before they merge. Use when a lockfile changes.",
      ),
      skill(
        "flaky-test-triage",
        "Reproduces an intermittent test failure, finds the race and proposes a fix. Use when CI fails on a test that passes locally.",
      ),
      skill(
        "release-check",
        "Runs the pre-release checklist for the web app: build, smoke tests, migrations and rollback notes. Use before every deploy.",
      ),
      skill(
        "ui-polish",
        "Tightens spacing, states and copy on a screen before it ships, keeping to the design tokens. Use when a page looks unfinished.",
      ),
    ]),
  ],
]);

/** Deterministic 64-character hex digest, standing in for sha256. */
export const agentDigest = (text: string) => {
  let out = "";
  for (let round = 0; out.length < 64; round++) {
    let hash = 0x811c9dc5 ^ round;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    out += hash.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
};

const volumeIdFor = (key: string) =>
  `vol_agent_${agentDigest(key).slice(0, 12)}`;

const digestOf = (files: AgentDriveFiles) =>
  agentDigest(
    [...files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, content]) => `${path}:${content}`)
      .join("\n"),
  );

const scopeOfKey = (key: string): AgentDriveScope => {
  const [projectId, userId, automationId, captainJamId] = key.split("|");
  return {
    projectId: projectId || undefined,
    userId: userId || undefined,
    automationId: automationId || undefined,
    captainJamId: captainJamId || undefined,
  };
};

export const agentVolume = (key: string, files: AgentDriveFiles) => {
  const scope = scopeOfKey(key);
  const digest = digestOf(files);
  return {
    id: volumeIdFor(key),
    namespace: "artifacts",
    name: "artifacts",
    projectId: scope.projectId ?? null,
    userId: scope.userId ?? null,
    automationId: scope.automationId ?? null,
    captainJamId: scope.captainJamId ?? null,
    description: null,
    archived: false,
    headVersionId: `${agentVersionPrefix}${digest.slice(0, 20)}`,
    headDigest: digest,
    fileCount: files.size,
    totalBytes: [...files.values()].reduce((sum, text) => sum + text.length, 0),
    headUpdatedAt: null,
  };
};

export const agentScopeByVolume = (state: AgentDriveState, volumeId: string) =>
  [...state.keys()].find((key) => volumeIdFor(key) === volumeId);

export const agentManifest = (key: string, files: AgentDriveFiles) => {
  const volume = agentVolume(key, files);
  return {
    versionId: volume.headVersionId,
    volumeId: volume.id,
    digest: volume.headDigest,
    parentDigest: null,
    entries: [...files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, content]) => ({
        path,
        mode: 420,
        sizeBytes: content.length,
        sha256: agentDigest(content),
      })),
    fileCount: volume.fileCount,
    totalBytes: volume.totalBytes,
  };
};

export const agentFileBySha = (state: AgentDriveState, sha256: string) =>
  [...state.values()]
    .flatMap((files) => [...files.values()])
    .find((content) => agentDigest(content) === sha256);

export type AgentWriteChange =
  | { readonly path: string; readonly content: string }
  | { readonly path: string; readonly delete: true };

export const applyAgentWrite = (
  state: AgentDriveState,
  key: string,
  changes: ReadonlyArray<AgentWriteChange>,
): AgentDriveState => {
  const files = new Map(state.get(key) ?? []);
  for (const change of changes) {
    if ("content" in change) files.set(change.path, change.content);
    else files.delete(change.path);
  }
  const next = new Map(state);
  if (files.size === 0) next.delete(key);
  else next.set(key, files);
  return next;
};

const defaultContextWindow = 1_000_000;

export const agentModels = models.map((model, index) => ({
  id: model.id,
  name: model.label,
  provider: model.provider,
  defaultFavorite: index === 0,
  contextWindow:
    model.provider === "anthropic" ? defaultContextWindow : 400_000,
}));

const skillDescription = (content: string) =>
  /^description:\s*(.*)$/m.exec(content)?.[1]?.trim() ?? "";

/** Capy's agent context preview for one project, from the scopes it loads. */
export const agentContextPreview = (
  state: AgentDriveState,
  query: { projectId: string; model?: string; captainJamId?: string },
) => {
  const model =
    agentModels.find((candidate) => candidate.id === query.model) ??
    agentModels[0];
  const project = Object.values(projects).find(
    (candidate) => candidate.id === query.projectId,
  );
  const captain = captains.find(
    (candidate) => candidate.id === query.captainJamId,
  );
  const scopes = [
    { kind: "org" as const, label: "Organization", scope: {} },
    {
      kind: "project" as const,
      label: project?.name ?? "Project",
      scope: { projectId: query.projectId },
    },
    { kind: "user" as const, label: "You", scope: { userId: viewer.id } },
    {
      kind: "project-user" as const,
      label: `You in ${project?.name ?? "this project"}`,
      scope: { projectId: query.projectId, userId: viewer.id },
    },
    ...(captain === undefined
      ? []
      : [
          {
            kind: "captain" as const,
            label: captain.name,
            scope: { captainJamId: captain.id },
          },
        ]),
  ];
  const instructionParts = scopes.map(({ kind, label, scope }) => {
    const chars =
      state.get(agentDriveScopeKey(scope))?.get("AGENTS.md")?.length ?? 0;
    return { kind, label, file: "AGENTS.md", chars, loaded: chars };
  });
  const skills = scopes.flatMap(({ scope }) =>
    [...(state.get(agentDriveScopeKey(scope)) ?? new Map<string, string>())]
      .filter(([path]) => /^skills\/[^/]+\/SKILL\.md$/.test(path))
      .map(([path, content]) => ({
        name: path.split("/")[1] ?? "",
        description: skillDescription(content),
      })),
  );
  const skillChars = skills.reduce(
    (sum, item) => sum + item.name.length + item.description.length + 16,
    0,
  );
  const parts = [
    ...instructionParts,
    {
      kind: "skills" as const,
      label: skills.length === 1 ? "1 skill" : `${skills.length} skills`,
      file: "skills",
      chars: skillChars,
      loaded: skillChars,
      skillCount: skills.length,
    },
  ];
  const budget = { total: 128_000, skills: 32_000, perFile: 32_000 };
  return {
    modelId: model?.id ?? "",
    contextWindow: model?.contextWindow ?? defaultContextWindow,
    budget,
    used: parts.reduce((sum, part) => sum + part.loaded, 0),
    parts,
  };
};
