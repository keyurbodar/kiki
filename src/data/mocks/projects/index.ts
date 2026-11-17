import { DateTime, Effect, Ref } from "effect";
import { Project, ProjectRepo } from "../../api/schemas/project.ts";
import {
  type ProjectDependencyRepo,
  ProjectEnvironmentVariable,
  ProjectEnvironmentVariableValue,
  ProjectSettingsDirectoryEntry,
  ProjectSettingsDirectoryPage,
  ProjectSetup,
  ProjectSetupRepo,
  ProjectSnapshotConfig,
  SnapshotBuild,
} from "../../api/schemas/project-settings.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleProjects } from "./fixtures.ts";
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
    const projects = yield* Ref.make<ReadonlyArray<Project>>(sampleProjects);
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

    return handlers
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
        Effect.gen(function* () {
          const current = yield* setupOf(params.projectId);
          const versionNumber = (current.versionNumber ?? 0) + 1;
          const next = new ProjectSetup({
            machineSize: payload.machineSize,
            hooks: current.hooks,
            repositories: payload.repositories.map(
              (repo) =>
                new ProjectSetupRepo({
                  ...repo,
                  source: "user",
                  sourceCommit: null,
                  sourceError: null,
                }),
            ),
            activeVersionId: `setupver_${params.projectId}_${versionNumber}`,
            versionNumber,
          });
          yield* Ref.update(setups, (all) => ({
            ...all,
            [params.projectId]: next,
          }));
          return next;
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
        Ref.get(builds).pipe(Effect.map((all) => all[params.projectId] ?? [])),
      )
      .handle("getSnapshotBuild", ({ params }) =>
        Ref.get(builds).pipe(
          Effect.flatMap((all) => {
            const build = (all[params.projectId] ?? []).find(
              (candidate) => candidate.id === params.buildId,
            );
            return build
              ? Effect.succeed(build)
              : Effect.die(new Error(`Unknown build ${params.buildId}`));
          }),
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
      );
  }),
);
