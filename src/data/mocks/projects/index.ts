import { Array as Arr, DateTime, Effect, Ref, Schema } from "effect";
import { UserId } from "../../api/schemas/ids.ts";
import {
  Project,
  ProjectMember,
  ProjectRepo,
} from "../../api/schemas/project.ts";
import {
  ProjectDependencyRepo,
  ProjectEnvironmentVariable,
  ProjectEnvironmentVariableValue,
  ProjectSettingsDirectoryEntry,
  ProjectSettingsDirectoryPage,
  ProjectSetup,
  ProjectSetupRepo,
  ProjectSnapshotConfig,
  SnapshotBuild,
  SnapshotBuildSummary,
} from "../../api/schemas/project-settings.ts";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { isoMinutesAgo, people, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  defaultProjectOwners,
  projectJson,
  sampleProjects,
} from "./fixtures.ts";
import {
  sampleBuilds,
  sampleDependencyRepos,
  samplePersonalVariables,
  sampleSetups,
  sampleSharedVariables,
  sampleSnapshotConfigs,
  sampleVariableValues,
} from "./settings-fixtures.ts";

type ByProject<A> = Record<string, A>;
type JsonRecord = Record<string, unknown>;

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const stringList = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? [value]
      : [];

const personFor = (id: string) =>
  Object.values(people).find((person) => person.id === id);

const directoryPageSize = 50;

const emptySetup = new ProjectSetup({
  machineSize: "large",
  hooks: null,
  repositories: [],
  activeVersionId: null,
  versionNumber: null,
});

const emptySnapshot = new ProjectSnapshotConfig({
  configured: false,
  enabled: false,
  building: false,
  buildSmallerTiers: false,
  repos: [],
  estimate: null,
  hasArtifact: false,
  tiers: [],
  freezeFailure: null,
});

export const ProjectsMock = mockGroup("projects", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const projects = yield* Ref.make<ReadonlyArray<Project>>(sampleProjects);
    const projectMembers = yield* Ref.make<ByProject<ReadonlyArray<string>>>(
      Object.fromEntries(
        sampleProjects.map((project) => [
          project.id,
          [people.alex.id, people.sam.id],
        ]),
      ),
    );
    const setupVersions = yield* Ref.make<ByProject<ReadonlyArray<JsonRecord>>>(
      Object.fromEntries(
        sampleProjects.map((project) => [
          project.id,
          [
            {
              id: `ver_sample_${project.id}`,
              versionNumber: sampleSetups[project.id]?.versionNumber ?? 1,
              machineSize: sampleSetups[project.id]?.machineSize ?? "large",
              createdAt: isoMinutesAgo(24 * 60),
            },
          ],
        ]),
      ),
    );
    const setups = yield* Ref.make<ByProject<ProjectSetup>>(sampleSetups);
    const snapshots = yield* Ref.make<ByProject<ProjectSnapshotConfig>>(
      sampleSnapshotConfigs,
    );
    const builds =
      yield* Ref.make<ByProject<ReadonlyArray<SnapshotBuild>>>(sampleBuilds);
    const shared = yield* Ref.make<
      ByProject<ReadonlyArray<ProjectEnvironmentVariable>>
    >(sampleSharedVariables);
    const personal = yield* Ref.make<
      ByProject<ReadonlyArray<ProjectEnvironmentVariable>>
    >(samplePersonalVariables);
    const values =
      yield* Ref.make<Record<string, string>>(sampleVariableValues);
    const dependencyRepos = yield* Ref.make<
      ByProject<ReadonlyArray<ProjectDependencyRepo>>
    >(sampleDependencyRepos);

    const findProject = (projectId: string) =>
      Ref.get(projects).pipe(
        Effect.flatMap((list) => {
          const project = list.find((candidate) => candidate.id === projectId);
          return project
            ? Effect.succeed(project)
            : Effect.die(new Error(`Unknown project ${projectId}`));
        }),
      );

    const updateProject = (
      projectId: string,
      change: (project: Project) => Partial<Project>,
    ) =>
      Effect.gen(function* () {
        const current = yield* findProject(projectId);
        const next = new Project({
          ...current,
          ...change(current),
          updatedAt: fixtureNow,
        });
        yield* Ref.update(projects, (list) =>
          list.map((project) => (project.id === projectId ? next : project)),
        );
        return next;
      });

    const setupOf = (projectId: string) =>
      Ref.get(setups).pipe(Effect.map((all) => all[projectId] ?? emptySetup));

    const syncSetupRepos = (project: Project) =>
      Ref.update(setups, (all) => {
        const setup = all[project.id] ?? emptySetup;
        const byName = new Map(
          setup.repositories.map((repo) => [repo.repository, repo]),
        );
        return {
          ...all,
          [project.id]: new ProjectSetup({
            ...setup,
            repositories: project.repos.map(
              (repo) =>
                new ProjectSetupRepo({
                  ...(byName.get(repo.repoFullName) ?? {
                    repository: repo.repoFullName,
                    scripts: { initialize: null, refresh: null },
                    startup: [],
                    commands: [],
                    source: "user" as const,
                    sourceCommit: null,
                    sourceError: null,
                  }),
                  branch: repo.baseBranch,
                }),
            ),
          }),
        };
      });

    const variablesStore = (scope: "shared" | "personal") =>
      scope === "shared" ? shared : personal;

    const listVariables = (scope: "shared" | "personal", projectId: string) =>
      Ref.get(variablesStore(scope)).pipe(
        Effect.map((all) => all[projectId] ?? []),
      );

    const writeVariables = (
      scope: "shared" | "personal",
      projectId: string,
      writes: ReadonlyArray<{
        readonly name: string;
        readonly value: string;
        readonly description?: string | null | undefined;
      }>,
    ) =>
      Effect.gen(function* () {
        const store = variablesStore(scope);
        yield* Ref.update(values, (all) => ({
          ...all,
          ...Object.fromEntries(writes.map((w) => [w.name, w.value])),
        }));
        yield* Ref.update(store, (all) => {
          const existing = all[projectId] ?? [];
          const written = new Map(writes.map((w) => [w.name, w]));
          const kept = existing.filter(
            (variable) => !written.has(variable.name),
          );
          const next = writes.map(
            (write) =>
              new ProjectEnvironmentVariable({
                name: write.name,
                description:
                  write.description === undefined
                    ? (existing.find((v) => v.name === write.name)
                        ?.description ?? null)
                    : write.description,
                configured: true,
                lastModifiedByUserId: viewer.id as never,
                updatedAt: fixtureNow,
              }),
          );
          return {
            ...all,
            [projectId]: [...kept, ...next].toSorted((a, b) =>
              a.name.localeCompare(b.name),
            ),
          };
        });
        return yield* listVariables(scope, projectId);
      });

    const removeVariable = (
      scope: "shared" | "personal",
      projectId: string,
      name: string,
    ) =>
      Ref.update(variablesStore(scope), (all) => ({
        ...all,
        [projectId]: (all[projectId] ?? []).filter((v) => v.name !== name),
      })).pipe(Effect.andThen(listVariables(scope, projectId)));

    const variableValue = (name: string) =>
      Ref.get(values).pipe(
        Effect.map(
          (all) =>
            new ProjectEnvironmentVariableValue({
              name,
              value: all[name] ?? "",
            }),
        ),
      );

    const snapshotOf = (projectId: string) =>
      Ref.get(snapshots).pipe(
        Effect.map((all) => all[projectId] ?? emptySnapshot),
      );

    const updateSnapshot = (
      projectId: string,
      change: Partial<ProjectSnapshotConfig>,
    ) =>
      Effect.gen(function* () {
        const next = new ProjectSnapshotConfig({
          ...(yield* snapshotOf(projectId)),
          ...change,
          configured: true,
        });
        yield* Ref.update(snapshots, (all) => ({ ...all, [projectId]: next }));
        return next;
      });

    const directoryEntry = (project: Project) =>
      Effect.gen(function* () {
        const setup = yield* setupOf(project.id);
        const snapshot = yield* snapshotOf(project.id);
        return new ProjectSettingsDirectoryEntry({
          id: project.id,
          name: project.name,
          nameIsDerived: project.nameIsDerived,
          icon: project.icon,
          logoUrl: project.logoUrl,
          repos: project.repos.map((repo) => repo.repoFullName),
          updatedAt: project.lastTouchedAt ?? project.updatedAt,
          setupConfigured: setup.versionNumber !== null,
          setupVersionNumber: setup.versionNumber,
          snapshotState: !snapshot.enabled
            ? "off"
            : snapshot.building
              ? "building"
              : snapshot.hasArtifact
                ? "ready"
                : "not_built",
          sharedVariableCount: (yield* listVariables("shared", project.id))
            .length,
          personalVariableCount: (yield* listVariables("personal", project.id))
            .length,
        });
      });

    const recordSetupVersion = (projectId: string, setup: ProjectSetup) =>
      Ref.update(setupVersions, (all) => ({
        ...all,
        [projectId]: [
          ...(all[projectId] ?? []),
          {
            id: newId("ver"),
            versionNumber: setup.versionNumber,
            machineSize: setup.machineSize,
            createdAt: isoMinutesAgo(0),
          },
        ],
      }));

    const replaceSetupWith = (
      projectId: string,
      change: Partial<ProjectSetup>,
    ) =>
      Effect.gen(function* () {
        const current = yield* setupOf(projectId);
        const versionNumber = (current.versionNumber ?? 0) + 1;
        const next = new ProjectSetup({
          ...current,
          ...change,
          activeVersionId: `setupver_${projectId}_${versionNumber}`,
          versionNumber,
        });
        yield* Ref.update(setups, (all) => ({ ...all, [projectId]: next }));
        yield* recordSetupVersion(projectId, next);
        return next;
      });

    const findBuild = (projectId: string, buildId: string) =>
      Ref.get(builds).pipe(
        Effect.flatMap((all) => {
          const build = (all[projectId] ?? []).find(
            (candidate) => candidate.id === buildId,
          );
          return build
            ? Effect.succeed(build)
            : Effect.die(new Error(`Unknown build ${buildId}`));
        }),
      );

    return handlers
      .handle("listed", () =>
        Effect.gen(function* () {
          const repoRows = yield* Ref.get(db.repos);
          const allMembers = yield* Ref.get(db.members);
          const allIssues = yield* Ref.get(db.issues);
          return (yield* Ref.get(projects))
            .filter((project) => !project.deleted)
            .map((project) => {
              const fullNames = project.repos.map((repo) => repo.repoFullName);
              return {
                id: project.id,
                name: project.name,
                code: project.code,
                icon: project.icon,
                color: project.color,
                logoUrl: project.logoUrl,
                repoNames: fullNames,
                repos: repoRows
                  .filter((repo) => fullNames.includes(repo.fullName))
                  .map((repo) => ({ ...repo, private: Boolean(repo.private) })),
                memberCount: allMembers.length,
                openIssueCount: allIssues.filter(
                  (issue) =>
                    issue.projectId === project.id &&
                    !["ist_sample_done", "ist_sample_canceled"].includes(
                      issue.stateId,
                    ),
                ).length,
                lastTouchedAt:
                  project.lastTouchedAt === null
                    ? null
                    : DateTime.formatIso(project.lastTouchedAt),
              };
            });
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const requested = Array.isArray(input.repos)
            ? (input.repos as ReadonlyArray<JsonRecord>)
            : [];
          const repoNames = requested.map((repo) =>
            asString(repo.repoFullName, ""),
          );
          const project = new Project({
            id: newId("proj") as never,
            name: asString(
              input.name,
              repoNames[0]?.split("/")[1] ?? "New project",
            ),
            nameIsDerived: typeof input.name !== "string",
            description:
              typeof input.description === "string" ? input.description : null,
            icon: asString(input.icon, "folder"),
            color: "default",
            logoUrl: null,
            code: asString(input.code, "NEW").toUpperCase(),
            tailscaleEnabled: false,
            tailscaleAcceptDns: false,
            deleted: false,
            createdAt: fixtureNow,
            updatedAt: fixtureNow,
            repos: requested.map(
              (repo, position) =>
                new ProjectRepo({
                  repoFullName: asString(repo.repoFullName, ""),
                  baseBranch: asString(repo.baseBranch, "main"),
                  position,
                  verificationSource: "installation",
                  mode: position === 0 ? "primary" : "lazy",
                }),
            ),
            visibility: asString(input.visibility, "org") as never,
            ownerUserId: viewer.id as never,
            members: [],
            viewerRole: "owner",
            lastTouchedAt: fixtureNow,
          });
          yield* Ref.update(projects, (list) => [...list, project]);
          yield* Ref.update(projectMembers, (all) => ({
            ...all,
            [project.id]: stringList(input.memberIds),
          }));
          yield* syncSetupRepos(project);
          return projectJson(project);
        }),
      )
      .handle("list", ({ query }) =>
        Ref.get(projects).pipe(
          Effect.map((list) =>
            list.filter(
              (project) => project.deleted === (query.deleted === "true"),
            ),
          ),
        ),
      )
      .handle("settingsDirectory", ({ query }) =>
        Effect.gen(function* () {
          const search = query.search?.toLowerCase() ?? "";
          const page = Math.max(1, Number(query.page ?? "1") || 1);
          const live = (yield* Ref.get(projects))
            .filter((project) => !project.deleted)
            .filter(
              (project) =>
                project.name.toLowerCase().includes(search) ||
                project.repos.some((repo) =>
                  repo.repoFullName.toLowerCase().includes(search),
                ),
            )
            .toSorted(
              (a, b) =>
                DateTime.toEpochMillis(b.lastTouchedAt ?? b.updatedAt) -
                DateTime.toEpochMillis(a.lastTouchedAt ?? a.updatedAt),
            );
          const pageItems = live.slice(
            (page - 1) * directoryPageSize,
            page * directoryPageSize,
          );
          return new ProjectSettingsDirectoryPage({
            items: yield* Effect.forEach(pageItems, directoryEntry),
            page,
            pageCount: Math.max(1, Math.ceil(live.length / directoryPageSize)),
            totalProjects: live.length,
          });
        }),
      )
      .handle("get", ({ params }) => findProject(params.projectId))
      .handle("update", ({ params, payload }) =>
        updateProject(params.projectId, (project) => ({
          name: payload.name ?? project.name,
          nameIsDerived:
            payload.name === undefined ? project.nameIsDerived : false,
          description:
            payload.description === undefined
              ? project.description
              : payload.description,
          icon: payload.icon ?? project.icon,
          color: payload.color ?? project.color,
          code: payload.code ?? project.code,
          tailscaleEnabled:
            payload.tailscaleEnabled ?? project.tailscaleEnabled,
          tailscaleAcceptDns:
            payload.tailscaleAcceptDns ?? project.tailscaleAcceptDns,
        })),
      )
      .handle("delete", ({ params }) =>
        updateProject(params.projectId, () => ({ deleted: true })),
      )
      .handle("restore", ({ params }) =>
        updateProject(params.projectId, () => ({ deleted: false })),
      )
      .handle("setRepoMode", ({ params, payload }) =>
        updateProject(params.projectId, (project) => ({
          repos: project.repos.map((repo) =>
            repo.repoFullName === `${params.owner}/${params.repo}`
              ? new ProjectRepo({ ...repo, mode: payload.mode })
              : repo,
          ),
        })),
      )
      .handle("addRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const next = yield* updateProject(params.projectId, (project) => ({
            repos: [
              ...project.repos,
              ...payload.repos
                .filter(
                  (added) =>
                    !project.repos.some(
                      (repo) => repo.repoFullName === added.repoFullName,
                    ),
                )
                .map(
                  (added, index) =>
                    new ProjectRepo({
                      repoFullName: added.repoFullName,
                      baseBranch: added.baseBranch ?? "main",
                      position: project.repos.length + index,
                      verificationSource: "installation",
                      mode:
                        added.mode ??
                        (project.repos.length + index === 0
                          ? "primary"
                          : "lazy"),
                    }),
                ),
            ],
          }));
          yield* syncSetupRepos(next);
          return next;
        }),
      )
      .handle("replaceRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const next = yield* updateProject(params.projectId, () => ({
            repos: payload.repos.map(
              (repo, position) =>
                new ProjectRepo({
                  repoFullName: repo.repoFullName,
                  baseBranch: repo.baseBranch,
                  position,
                  verificationSource: "installation",
                  mode: repo.mode ?? (position === 0 ? "primary" : "lazy"),
                }),
            ),
          }));
          yield* syncSetupRepos(next);
          return next;
        }),
      )
      .handle("getSetup", ({ params }) => setupOf(params.projectId))
      .handle("replaceSetup", ({ params, payload }) =>
        replaceSetupWith(params.projectId, {
          machineSize: payload.machineSize,
          repositories: payload.repositories.map(
            (repo) =>
              new ProjectSetupRepo({
                ...repo,
                source: "user",
                sourceCommit: null,
                sourceError: null,
              }),
          ),
        }),
      )
      .handle("updateSetup", ({ params, payload }) => {
        const machineSize = fields(payload).machineSize;
        return replaceSetupWith(
          params.projectId,
          typeof machineSize === "string" ? { machineSize } : {},
        ).pipe(Effect.map(Schema.encodeSync(ProjectSetup)));
      })
      .handle("listSetupVersions", ({ params }) =>
        Ref.get(setupVersions).pipe(
          Effect.map((all) => all[params.projectId] ?? []),
        ),
      )
      .handle("rollbackSetup", ({ params }) =>
        Effect.gen(function* () {
          const version = (
            (yield* Ref.get(setupVersions))[params.projectId] ?? []
          ).find((candidate) => candidate.id === params.versionId);
          if (version === undefined)
            return yield* Effect.die(
              new Error(`Unknown setup version ${params.versionId}`),
            );
          return Schema.encodeSync(ProjectSetup)(
            yield* replaceSetupWith(params.projectId, {
              machineSize: asString(version.machineSize, "large"),
            }),
          );
        }),
      )
      .handle("getSnapshotConfig", ({ params }) => snapshotOf(params.projectId))
      .handle("setSnapshotEnabled", ({ params, payload }) =>
        updateSnapshot(params.projectId, { enabled: payload.enabled }),
      )
      .handle("replaceSnapshotRepos", ({ params, payload }) =>
        updateSnapshot(params.projectId, { repos: payload.repos }),
      )
      .handle("setSnapshotSmallerTiers", ({ params, payload }) =>
        updateSnapshot(params.projectId, {
          buildSmallerTiers: payload.buildSmallerTiers,
        }),
      )
      .handle("startSnapshotBuild", ({ params, payload }) =>
        Effect.gen(function* () {
          const existing = (yield* Ref.get(builds))[params.projectId] ?? [];
          const build = new SnapshotBuild({
            id: `snapbuild_${params.projectId}_${existing.length + 1}`,
            trigger: payload.test ? "test" : "manual",
            status: "building",
            reason: payload.reason ?? null,
            failureReason: null,
            createdAt: fixtureNow,
            startedAt: fixtureNow,
            completedAt: null,
            steps: [],
            phases: [],
          });
          yield* Ref.update(builds, (all) => ({
            ...all,
            [params.projectId]: [build, ...existing],
          }));
          return build;
        }),
      )
      .handle("listSnapshotBuilds", ({ params }) =>
        Ref.get(builds).pipe(
          Effect.map((all) =>
            (all[params.projectId] ?? []).map(
              ({ steps: _steps, phases: _phases, ...summary }) =>
                new SnapshotBuildSummary(summary),
            ),
          ),
        ),
      )
      .handle("getSnapshotBuild", ({ params }) =>
        findBuild(params.projectId, params.buildId),
      )
      .handle("getSnapshotBuildLog", ({ params }) =>
        findBuild(params.projectId, params.buildId).pipe(
          Effect.map((build) => ({
            buildId: build.id,
            projectId: params.projectId,
            status: build.status,
            lines: [
              `Preparing snapshot for ${params.projectId}`,
              ...build.steps.map((step) => `${step.step}: ${step.status}`),
              ...build.phases.flatMap((phase) =>
                (phase.outputTail ?? "").split("\n").filter(Boolean),
              ),
            ],
          })),
        ),
      )
      .handle("listEnvironmentVariables", ({ params }) =>
        listVariables("shared", params.projectId),
      )
      .handle("listPersonalEnvironmentVariables", ({ params }) =>
        listVariables("personal", params.projectId),
      )
      .handle("setEnvironmentVariables", ({ params, payload }) =>
        writeVariables("shared", params.projectId, payload.variables),
      )
      .handle("setPersonalEnvironmentVariables", ({ params, payload }) =>
        writeVariables("personal", params.projectId, payload.variables),
      )
      .handle("setEnvironmentVariable", ({ params, payload }) =>
        writeVariables("shared", params.projectId, [
          { name: params.name, ...payload },
        ]),
      )
      .handle("setPersonalEnvironmentVariable", ({ params, payload }) =>
        writeVariables("personal", params.projectId, [
          { name: params.name, ...payload },
        ]),
      )
      .handle("deleteEnvironmentVariable", ({ params }) =>
        removeVariable("shared", params.projectId, params.name),
      )
      .handle("deletePersonalEnvironmentVariable", ({ params }) =>
        removeVariable("personal", params.projectId, params.name),
      )
      .handle("getEnvironmentVariableValue", ({ params }) =>
        variableValue(params.name),
      )
      .handle("getPersonalEnvironmentVariableValue", ({ params }) =>
        variableValue(params.name),
      )
      .handle("listDependencyRepos", ({ params }) =>
        Ref.get(dependencyRepos).pipe(
          Effect.map((all) => all[params.projectId] ?? []),
        ),
      )
      .handle("replaceDependencyRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const next = payload.repos.map(
            (repo) =>
              new ProjectDependencyRepo({ ...repo, reachability: "reachable" }),
          );
          yield* Ref.update(dependencyRepos, (all) => ({
            ...all,
            [params.projectId]: next,
          }));
          return next;
        }),
      )
      .handle("searchGithubAuthors", ({ params, query }) =>
        Effect.gen(function* () {
          const term = String(query.search ?? query.q ?? "").toLowerCase();
          return (yield* Ref.get(db.members)).flatMap((member) => {
            const person = personFor(member.id);
            if (
              person &&
              term &&
              !person.githubLogin.toLowerCase().includes(term)
            )
              return [];
            return [
              {
                id: member.id,
                login: person?.githubLogin ?? "",
                name: person
                  ? `${person.firstName} ${person.lastName}`
                  : member.id,
                avatarUrl: `https://example.com/avatars/${member.id}.png`,
                projectId: params.projectId,
              },
            ];
          });
        }),
      )
      .handle("uploadLogo", ({ params, payload }) =>
        updateProject(params.projectId, () => ({
          logoUrl: asString(
            fields(payload).url,
            "https://example.com/logos/project.png",
          ),
        })).pipe(Effect.map(projectJson)),
      )
      .handle("removeLogo", ({ params }) =>
        updateProject(params.projectId, () => ({ logoUrl: null })).pipe(
          Effect.map(projectJson),
        ),
      )
      .handle("addMembers", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const validIds = (yield* Ref.get(db.members)).map((row) => row.id);
          const requested = stringList(input.memberIds ?? input.userIds);
          const additions = requested.length > 0 ? requested : validIds;
          const invalid = additions.find((id) => !validIds.includes(id));
          if (invalid !== undefined) return yield* missing("members", invalid);
          const current = (yield* Ref.get(projectMembers))[params.projectId];
          const updated = Arr.dedupe([...(current ?? []), ...additions]);
          yield* Ref.update(projectMembers, (all) => ({
            ...all,
            [params.projectId]: updated,
          }));
          const project = yield* updateProject(params.projectId, () => ({
            members: updated.map(
              (id) =>
                new ProjectMember({
                  userId: UserId.make(id),
                  kind: "human",
                  invitedBy: UserId.make(people.alex.id),
                  createdAt: fixtureNow,
                }),
            ),
          }));
          return projectJson(project).members;
        }),
      )
      .handle("removeMembers", ({ params, query }) =>
        Effect.gen(function* () {
          const requested = stringList(
            query.memberIds ?? query.userIds ?? query.id,
          );
          yield* Ref.update(projectMembers, (all) => ({
            ...all,
            [params.projectId]: (all[params.projectId] ?? []).filter(
              (id) => !requested.includes(id),
            ),
          }));
          yield* updateProject(params.projectId, (project) => ({
            members: project.members.filter(
              (member) => !requested.includes(member.userId),
            ),
          }));
          return { ok: true };
        }),
      )
      .handle("setOwner", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const ownerId = asString(
            input.ownerId ?? input.userId,
            defaultProjectOwners[0],
          );
          const validIds = (yield* Ref.get(db.members)).map((row) => row.id);
          if (!validIds.includes(ownerId))
            return yield* missing("members", ownerId);
          return projectJson(
            yield* updateProject(params.projectId, () => ({
              ownerUserId: UserId.make(ownerId),
            })),
          );
        }),
      )
      .handle("setAccess", ({ params, payload }) =>
        updateProject(params.projectId, () => ({
          visibility: asString(
            fields(payload).access ?? fields(payload).visibility,
            "org",
          ) as never,
        })).pipe(Effect.map(projectJson)),
      );
  }),
);
