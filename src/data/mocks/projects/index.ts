import { Array as Arr, DateTime, Effect, Ref } from "effect";
import { ProjectId, UserId } from "../../api/schemas/ids.ts";
import {
  Project,
  ProjectMember,
  ProjectRepo,
} from "../../api/schemas/project.ts";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import {
  isoMinutesAgo,
  people,
  repos as worldRepos,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { defaultProjectOwners, sampleProjectJson } from "./fixtures.ts";

type JsonRecord = Record<string, unknown>;

const minutesPerHour = 60;
const minutesPerDay = 24 * minutesPerHour;

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const asStrings = (value: unknown): ReadonlyArray<string> =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const stringList = (
  value: unknown,
  fallback: ReadonlyArray<string> = [],
): ReadonlyArray<string> => {
  const parsed = asStrings(value);
  return parsed.length > 0 ? parsed : fallback;
};

const requireRow = <T>(
  rows: ReadonlyArray<T>,
  id: string,
  table: string,
): Effect.Effect<T> =>
  Effect.gen(function* () {
    const option = yield* Effect.succeed(
      Arr.findFirst(rows, (row) => (row as { id?: unknown }).id === id),
    );
    if (option._tag === "None") return yield* missing(table as never, id);
    return option.value;
  });

const requirePrivate = <T>(
  map: Record<string, T>,
  id: string,
  label: string,
) =>
  id in map
    ? Effect.succeed(map[id] as T)
    : Effect.die(new Error(`projects.${label}: no state for ${id}`));

const variable = (
  name: string,
  value: unknown,
  createdAt: string,
): JsonRecord => ({
  name,
  value: asString(value, ""),
  createdAt,
  updatedAt: createdAt,
});

export const ProjectsMock = mockGroup("projects", (handlers) =>
  Effect.gen(function* () {
    const { members, repos, issues } = yield* MockDb;
    const projects = yield* Ref.make<ReadonlyArray<JsonRecord>>(
      structuredClone(sampleProjectJson) as ReadonlyArray<JsonRecord>,
    );
    const dependencyRepos = yield* Ref.make<
      Record<string, ReadonlyArray<string>>
    >({});
    const environmentVariables = yield* Ref.make<
      Record<string, ReadonlyArray<JsonRecord>>
    >({});
    const personalEnvironmentVariables = yield* Ref.make<
      Record<string, ReadonlyArray<JsonRecord>>
    >({});
    const logos = yield* Ref.make<Record<string, string>>({});
    const projectMembers = yield* Ref.make<
      Record<string, ReadonlyArray<string>>
    >({});
    const owners = yield* Ref.make<Record<string, string>>({});
    const setups = yield* Ref.make<Record<string, JsonRecord>>({});
    const setupVersions = yield* Ref.make<
      Record<string, ReadonlyArray<JsonRecord>>
    >({});
    const snapshotConfigs = yield* Ref.make<Record<string, JsonRecord>>({});
    const snapshotBuilds = yield* Ref.make<
      Record<string, ReadonlyArray<JsonRecord>>
    >({});
    const access = yield* Ref.make<Record<string, string>>({});

    const getProject = (id: string) =>
      Ref.get(projects).pipe(
        Effect.flatMap((rows) => requireRow(rows, id, "projects")),
      );

    const updateProject = (
      id: string,
      change: (row: JsonRecord) => JsonRecord,
    ) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(projects);
        const current = yield* requireRow(rows, id, "projects");
        const updated = { ...current, ...change(current) };
        yield* Ref.set(
          projects,
          rows.map((row) => (row.id === id ? updated : row)),
        );
        return updated;
      });

    const getMapValue = <T>(
      ref: Ref.Ref<Record<string, T>>,
      id: string,
      label: string,
    ) =>
      Ref.get(ref).pipe(
        Effect.flatMap((map) => requirePrivate(map, id, label)),
      );

    const setMapValue = <T>(
      ref: Ref.Ref<Record<string, T>>,
      id: string,
      value: T,
    ) => Ref.update(ref, (map) => ({ ...map, [id]: value }));

    const repoNames = () =>
      Ref.get(repos).pipe(
        Effect.map((rows) => rows.map((row) => row.fullName)),
      );

    const memberIds = () =>
      Ref.get(members).pipe(Effect.map((rows) => rows.map((row) => row.id)));

    const setupVersion = (
      projectId: string,
      versionId: string,
      setup: JsonRecord,
    ): JsonRecord => ({
      id: versionId,
      projectId,
      instruction: String(setup.instruction ?? ""),
      script: String(setup.script ?? ""),
      machineSize: String(setup.machineSize ?? "medium"),
      createdAt: isoMinutesAgo(minutesPerDay),
    });

    const snapshotBuild = (projectId: string, buildId: string): JsonRecord => ({
      id: buildId,
      projectId,
      status: "succeeded",
      machineSize: "medium",
      repos: [],
      createdAt: isoMinutesAgo(minutesPerHour),
      finishedAt: isoMinutesAgo(minutesPerHour - minutesPerHour / 12),
    });

    for (const row of sampleProjectJson) {
      const projectId = String(row.id);
      const names = (row.repos as ReadonlyArray<JsonRecord>).map((repo) =>
        String(repo.repoFullName),
      );
      yield* setMapValue(
        dependencyRepos,
        projectId,
        names.length > 1 ? names.slice(1) : names,
      );
      yield* setMapValue(environmentVariables, projectId, [
        variable("NODE_ENV", "test", isoMinutesAgo(minutesPerHour * 6)),
        variable(
          "API_BASE_URL",
          "https://api.example.com",
          isoMinutesAgo(minutesPerDay),
        ),
      ]);
      yield* setMapValue(personalEnvironmentVariables, projectId, [
        variable("EDITOR", "vim", isoMinutesAgo(minutesPerHour * 3)),
      ]);
      yield* setMapValue(projectMembers, projectId, [
        people.alex.id,
        people.sam.id,
      ]);
      yield* setMapValue(owners, projectId, people.alex.id);
      const setup: JsonRecord = {
        projectId,
        instruction: "Install dependencies and run the test suite.",
        script: "bun install && bun run test",
        machineSize: "medium",
        baseBranch: "main",
        updatedAt: isoMinutesAgo(minutesPerDay),
      };
      yield* setMapValue(setups, projectId, setup);
      yield* setMapValue(setupVersions, projectId, [
        setupVersion(projectId, `ver_sample_${projectId}`, setup),
      ]);
      yield* setMapValue(snapshotConfigs, projectId, {
        projectId,
        enabled: false,
        smallerTiers: false,
        repos: names,
        machineSize: "medium",
        baseBranch: "main",
        createdAt: isoMinutesAgo(minutesPerDay),
      });
      yield* setMapValue(snapshotBuilds, projectId, [
        snapshotBuild(projectId, `build_sample_${projectId}`),
      ]);
      yield* setMapValue(access, projectId, String(row.visibility));
    }

    return handlers
      .handle("listed", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(projects);
          const visible = rows.filter((row) => row.deleted !== true);
          const repoRows = yield* Ref.get(repos);
          const allMembers = yield* Ref.get(members);
          const allIssues = yield* Ref.get(issues);
          return visible.map((row) => {
            const projectRepos = (row.repos ?? []) as ReadonlyArray<JsonRecord>;
            const fullNames = projectRepos.map((repo) =>
              String(repo.repoFullName ?? ""),
            );
            return {
              id: row.id,
              name: row.name,
              code: row.code,
              icon: row.icon,
              color: row.color,
              logoUrl: row.logoUrl ?? null,
              repoNames: fullNames,
              repos: repoRows
                .filter((repo) => fullNames.includes(repo.fullName))
                .map((repo) => ({ ...repo, private: Boolean(repo.private) })),
              memberCount: allMembers.length,
              openIssueCount: allIssues.filter(
                (issue) =>
                  issue.projectId === row.id &&
                  !["ist_sample_done", "ist_sample_canceled"].includes(
                    issue.stateId,
                  ),
              ).length,
              lastTouchedAt: row.lastTouchedAt ?? null,
            };
          });
        }),
      )
      .handle("settingsDirectory", ({ params, query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(projects);
          const term = String(query.search ?? query.q ?? "").toLowerCase();
          return rows
            .filter((row) => row.deleted !== true)
            .filter(
              (row) => !term || String(row.name).toLowerCase().includes(term),
            )
            .map((row) => ({
              id: row.id,
              name: row.name,
              code: row.code,
              icon: row.icon,
              color: row.color,
              logoUrl: row.logoUrl ?? null,
              orgId: params.orgId,
            }));
        }),
      )
      .handle("list", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(projects);
          const deleted = query.deleted === "true";
          return rows
            .filter((row) => Boolean(row.deleted) === deleted)
            .map((row) => {
              const repos = (row.repos ?? []) as ReadonlyArray<JsonRecord>;
              const members = (row.members ?? []) as ReadonlyArray<JsonRecord>;
              return new Project({
                id: ProjectId.make(String(row.id)),
                name: String(row.name),
                nameIsDerived: Boolean(row.nameIsDerived),
                description:
                  typeof row.description === "string" ? row.description : null,
                icon: String(row.icon),
                color: row.color as never,
                logoUrl: typeof row.logoUrl === "string" ? row.logoUrl : null,
                code: String(row.code),
                tailscaleEnabled: Boolean(row.tailscaleEnabled),
                tailscaleAcceptDns: Boolean(row.tailscaleAcceptDns),
                deleted: Boolean(row.deleted),
                createdAt: DateTime.makeUnsafe(
                  String(row.createdAt ?? isoMinutesAgo(0)),
                ),
                updatedAt: DateTime.makeUnsafe(
                  String(row.updatedAt ?? isoMinutesAgo(0)),
                ),
                repos: repos.map(
                  (repo, position) =>
                    new ProjectRepo({
                      repoFullName: String(repo.repoFullName),
                      baseBranch: String(repo.baseBranch ?? "main"),
                      position,
                      verificationSource:
                        repo.verificationSource === "device"
                          ? "device"
                          : "installation",
                      mode: repo.mode === "primary" ? "primary" : "lazy",
                    }),
                ),
                visibility: row.visibility as never,
                ownerUserId:
                  typeof row.ownerUserId === "string"
                    ? UserId.make(row.ownerUserId)
                    : null,
                members: members.map(
                  (member) =>
                    new ProjectMember({
                      userId: UserId.make(String(member.userId)),
                      kind: member.kind === "service" ? "service" : "human",
                      invitedBy:
                        typeof member.invitedBy === "string"
                          ? UserId.make(member.invitedBy)
                          : null,
                      createdAt: DateTime.makeUnsafe(
                        String(member.createdAt ?? isoMinutesAgo(0)),
                      ),
                    }),
                ),
                viewerRole: row.viewerRole as never,
                lastTouchedAt:
                  typeof row.lastTouchedAt === "string"
                    ? DateTime.makeUnsafe(row.lastTouchedAt)
                    : null,
              });
            });
        }),
      )
      .handle("create", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const id = newId("proj");
          const now = isoMinutesAgo(0);
          const code = asString(input.code, "NEW").toUpperCase();
          const row: JsonRecord = {
            id,
            name: asString(input.name, "New project"),
            nameIsDerived: false,
            description:
              typeof input.description === "string" ? input.description : null,
            icon: asString(input.icon, "folder"),
            color: asString(input.color, "default"),
            logoUrl: null,
            code,
            tailscaleEnabled: false,
            tailscaleAcceptDns: false,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            repos: [],
            visibility: asString(input.visibility, "org"),
            ownerUserId: null,
            members: [],
            viewerRole: "owner",
            lastTouchedAt: now,
          };
          yield* Ref.update(projects, (rows) => [...rows, row]);
          yield* setMapValue(projectMembers, id, stringList(input.memberIds));
          return row;
        }),
      )
      .handle("get", ({ params }) => getProject(params.projectId))
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const allowed = [
            "name",
            "description",
            "icon",
            "color",
            "code",
            "tailscaleEnabled",
            "tailscaleAcceptDns",
            "visibility",
          ];
          const updated = yield* updateProject(params.projectId, () => ({
            ...Object.fromEntries(
              allowed
                .filter((key) => key in input)
                .map((key) => [key, input[key]]),
            ),
            updatedAt: isoMinutesAgo(0),
          }));
          if ("visibility" in input) {
            yield* setMapValue(
              access,
              params.projectId,
              String(input.visibility),
            );
          }
          return updated;
        }),
      )
      .handle("delete", ({ params }) =>
        Effect.gen(function* () {
          yield* updateProject(params.projectId, () => ({
            deleted: true,
            updatedAt: isoMinutesAgo(0),
          }));
          return { ok: true };
        }),
      )
      .handle("listDependencyRepos", ({ params }) =>
        getMapValue(dependencyRepos, params.projectId, "dependencyRepos").pipe(
          Effect.map((names) =>
            names.map((fullName) => ({ fullName, repoFullName: fullName })),
          ),
        ),
      )
      .handle("replaceDependencyRepos", ({ params, payload }) => {
        const names = stringList(
          fields(payload).repos ?? fields(payload).repositories,
        );
        return setMapValue(dependencyRepos, params.projectId, names).pipe(
          Effect.as(
            names.map((fullName) => ({ fullName, repoFullName: fullName })),
          ),
        );
      })
      .handle("listEnvironmentVariables", ({ params }) =>
        getMapValue(
          environmentVariables,
          params.projectId,
          "environmentVariables",
        ),
      )
      .handle("setEnvironmentVariables", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const now = isoMinutesAgo(0);
          const entries = Array.isArray(input.variables)
            ? input.variables.filter(
                (item): item is JsonRecord =>
                  typeof item === "object" && item !== null,
              )
            : Object.entries(input).map(([name, value]) => ({ name, value }));
          const rows = entries.map((entry) =>
            variable(
              asString(entry.name, ""),
              entry.value,
              "createdAt" in entry ? asString(entry.createdAt, now) : now,
            ),
          );
          const current = yield* Ref.get(environmentVariables);
          const merged = new Map(
            [...(current[params.projectId] ?? []), ...rows].map((row) => [
              String(row.name),
              row,
            ]),
          );
          const result = [...merged.values()];
          yield* setMapValue(environmentVariables, params.projectId, result);
          return result;
        }),
      )
      .handle("setEnvironmentVariable", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(environmentVariables);
          const row = variable(
            params.name,
            fields(payload).value,
            isoMinutesAgo(0),
          );
          const result = [
            ...(current[params.projectId] ?? []).filter(
              (entry) => entry.name !== params.name,
            ),
            row,
          ];
          yield* setMapValue(environmentVariables, params.projectId, result);
          return row;
        }),
      )
      .handle("deleteEnvironmentVariable", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(environmentVariables);
          const existing = current[params.projectId] ?? [];
          if (!existing.some((row) => row.name === params.name)) {
            yield* Effect.die(
              new Error(
                `projects.environmentVariables: no variable ${params.name} for ${params.projectId}`,
              ),
            );
          }
          yield* setMapValue(
            environmentVariables,
            params.projectId,
            existing.filter((row) => row.name !== params.name),
          );
          return { ok: true };
        }),
      )
      .handle("getEnvironmentVariableValue", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* getMapValue(
            environmentVariables,
            params.projectId,
            "environmentVariables",
          );
          const option = Arr.findFirst(rows, (row) => row.name === params.name);
          if (option._tag === "None") {
            return yield* Effect.die(
              new Error(
                `projects.environmentVariables: no variable ${params.name} for ${params.projectId}`,
              ),
            );
          }
          return { name: params.name, value: option.value.value };
        }),
      )
      .handle("setPersonalEnvironmentVariables", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const now = isoMinutesAgo(0);
          const entries = Array.isArray(input.variables)
            ? input.variables.filter(
                (item): item is JsonRecord =>
                  typeof item === "object" && item !== null,
              )
            : Object.entries(input).map(([name, value]) => ({ name, value }));
          const rows = entries.map((entry) =>
            variable(asString(entry.name, ""), entry.value, now),
          );
          const current = yield* Ref.get(personalEnvironmentVariables);
          const merged = new Map(
            [...(current[params.projectId] ?? []), ...rows].map((row) => [
              String(row.name),
              row,
            ]),
          );
          const result = [...merged.values()];
          yield* setMapValue(
            personalEnvironmentVariables,
            params.projectId,
            result,
          );
          return result;
        }),
      )
      .handle("listPersonalEnvironmentVariables", ({ params }) =>
        getMapValue(
          personalEnvironmentVariables,
          params.projectId,
          "personalEnvironmentVariables",
        ),
      )
      .handle("setPersonalEnvironmentVariable", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(personalEnvironmentVariables);
          const row = variable(
            params.name,
            fields(payload).value,
            isoMinutesAgo(0),
          );
          const result = [
            ...(current[params.projectId] ?? []).filter(
              (entry) => entry.name !== params.name,
            ),
            row,
          ];
          yield* setMapValue(
            personalEnvironmentVariables,
            params.projectId,
            result,
          );
          return row;
        }),
      )
      .handle("deletePersonalEnvironmentVariable", ({ params }) =>
        Effect.gen(function* () {
          const current = yield* Ref.get(personalEnvironmentVariables);
          const existing = current[params.projectId] ?? [];
          if (!existing.some((row) => row.name === params.name)) {
            yield* Effect.die(
              new Error(
                `projects.personalEnvironmentVariables: no variable ${params.name} for ${params.projectId}`,
              ),
            );
          }
          yield* setMapValue(
            personalEnvironmentVariables,
            params.projectId,
            existing.filter((row) => row.name !== params.name),
          );
          return { ok: true };
        }),
      )
      .handle("getPersonalEnvironmentVariableValue", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* getMapValue(
            personalEnvironmentVariables,
            params.projectId,
            "personalEnvironmentVariables",
          );
          const option = Arr.findFirst(rows, (row) => row.name === params.name);
          if (option._tag === "None") {
            return yield* Effect.die(
              new Error(
                `projects.personalEnvironmentVariables: no variable ${params.name} for ${params.projectId}`,
              ),
            );
          }
          return { name: params.name, value: option.value.value };
        }),
      )
      .handle("searchGithubAuthors", ({ params, query }) =>
        Effect.gen(function* () {
          const term = String(query.search ?? query.q ?? "").toLowerCase();
          const allMembers = yield* Ref.get(members);
          return allMembers
            .filter((member) => {
              const person = Object.values(people).find(
                (candidate) => candidate.id === member.id,
              );
              return (
                !person ||
                !term ||
                person.githubLogin.toLowerCase().includes(term)
              );
            })
            .map((member) => {
              const person = Object.values(people).find(
                (candidate) => candidate.id === member.id,
              );
              return {
                id: member.id,
                login: person?.githubLogin ?? "",
                name: person
                  ? `${person.firstName} ${person.lastName}`
                  : member.id,
                avatarUrl: `https://example.com/avatars/${member.id}.png`,
                projectId: params.projectId,
              };
            });
        }),
      )
      .handle("uploadLogo", ({ params, payload }) => {
        const url = asString(
          fields(payload).url,
          "https://example.com/logos/project.png",
        );
        return Effect.gen(function* () {
          yield* setMapValue(logos, params.projectId, url);
          return yield* updateProject(params.projectId, () => ({
            logoUrl: url,
            updatedAt: isoMinutesAgo(0),
          }));
        });
      })
      .handle("removeLogo", ({ params }) =>
        Effect.gen(function* () {
          yield* Ref.update(logos, (map) => {
            const next = { ...map };
            delete next[params.projectId];
            return next;
          });
          return yield* updateProject(params.projectId, () => ({
            logoUrl: null,
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("addMembers", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const requested = stringList(input.memberIds ?? input.userIds);
          const validIds = yield* memberIds();
          const additions =
            requested.length > 0
              ? requested
              : validIds.slice(0, validIds.length);
          const invalid = additions.filter((id) => !validIds.includes(id));
          if (invalid.length > 0)
            return yield* missing("members", invalid[0] ?? "");
          const current = yield* Ref.get(projectMembers);
          const updated = Arr.dedupe([
            ...(current[params.projectId] ?? []),
            ...additions,
          ]);
          yield* setMapValue(projectMembers, params.projectId, updated);
          return updated.map((id) => {
            const person = Object.values(people).find(
              (candidate) => candidate.id === id,
            );
            return {
              userId: id,
              kind: "human",
              invitedBy: people.alex.id,
              createdAt: person?.joinedAt ?? isoMinutesAgo(0),
            };
          });
        }),
      )
      .handle("removeMembers", ({ params, query }) =>
        Effect.gen(function* () {
          const requested = stringList(
            query.memberIds ?? query.userIds ?? query.id,
          );
          const current = yield* Ref.get(projectMembers);
          const updated = (current[params.projectId] ?? []).filter(
            (id) => !requested.includes(id),
          );
          yield* setMapValue(projectMembers, params.projectId, updated);
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
          const validIds = yield* memberIds();
          if (!validIds.includes(ownerId))
            return yield* missing("members", ownerId);
          yield* setMapValue(owners, params.projectId, ownerId);
          return yield* updateProject(params.projectId, () => ({
            ownerUserId: ownerId,
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("replaceRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const names = stringList(
            fields(payload).repos ?? fields(payload).repoFullNames,
          );
          const validNames = yield* repoNames();
          const invalid = names.filter((name) => !validNames.includes(name));
          if (invalid.length > 0)
            return yield* missing("repos", invalid[0] ?? "");
          return yield* updateProject(params.projectId, (row) => ({
            repos: names.map((repoFullName, position) => ({
              ...(((row.repos ?? []) as ReadonlyArray<JsonRecord>).find(
                (repo) => repo.repoFullName === repoFullName,
              ) ?? {
                baseBranch:
                  worldRepos.find((repo) => repo.fullName === repoFullName)
                    ?.defaultBranch ?? "main",
                verificationSource: "installation",
              }),
              repoFullName,
              position,
              mode: position === 0 ? "primary" : "lazy",
            })),
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("addRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const names = stringList(
            fields(payload).repos ?? fields(payload).repoFullNames,
          );
          const validNames = yield* repoNames();
          const invalid = names.filter((name) => !validNames.includes(name));
          if (invalid.length > 0)
            return yield* missing("repos", invalid[0] ?? "");
          return yield* updateProject(params.projectId, (row) => {
            const existing = (row.repos ?? []) as ReadonlyArray<JsonRecord>;
            const merged = Arr.dedupeWith(
              [
                ...existing,
                ...names.map((fullName) => ({ repoFullName: fullName })),
              ],
              (left, right) => left.repoFullName === right.repoFullName,
            );
            return {
              repos: merged.map((repo, position) => ({
                baseBranch:
                  worldRepos.find((item) => item.fullName === repo.repoFullName)
                    ?.defaultBranch ?? "main",
                verificationSource: "installation",
                ...repo,
                position,
                mode: position === 0 ? "primary" : "lazy",
              })),
              updatedAt: isoMinutesAgo(0),
            };
          });
        }),
      )
      .handle("setRepoMode", ({ params, payload }) =>
        Effect.gen(function* () {
          const fullName = `${params.owner}/${params.repo}`;
          const mode = asString(fields(payload).mode, "lazy");
          return yield* updateProject(params.projectId, (row) => ({
            repos: ((row.repos ?? []) as ReadonlyArray<JsonRecord>).map(
              (repo) =>
                repo.repoFullName === fullName ? { ...repo, mode } : repo,
            ),
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      )
      .handle("restore", ({ params }) =>
        updateProject(params.projectId, () => ({
          deleted: false,
          updatedAt: isoMinutesAgo(0),
        })),
      )
      .handle("getSetup", ({ params }) =>
        getMapValue(setups, params.projectId, "setup"),
      )
      .handle("replaceSetup", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const setup: JsonRecord = {
            projectId: params.projectId,
            instruction: asString(input.instruction, ""),
            script: asString(input.script, ""),
            machineSize: asString(input.machineSize, "medium"),
            baseBranch: asString(input.baseBranch, "main"),
            updatedAt: isoMinutesAgo(0),
          };
          yield* setMapValue(setups, params.projectId, setup);
          const version = setupVersion(params.projectId, newId("ver"), setup);
          yield* setMapValue(setupVersions, params.projectId, [
            ...((yield* Ref.get(setupVersions))[params.projectId] ?? []),
            version,
          ]);
          return setup;
        }),
      )
      .handle("updateSetup", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const current = yield* getMapValue(setups, params.projectId, "setup");
          const setup = {
            ...current,
            ...Object.fromEntries(
              ["instruction", "script", "machineSize", "baseBranch"]
                .filter((key) => key in input)
                .map((key) => [key, input[key]]),
            ),
            updatedAt: isoMinutesAgo(0),
          };
          yield* setMapValue(setups, params.projectId, setup);
          const version = setupVersion(params.projectId, newId("ver"), setup);
          yield* setMapValue(setupVersions, params.projectId, [
            ...((yield* Ref.get(setupVersions))[params.projectId] ?? []),
            version,
          ]);
          return setup;
        }),
      )
      .handle("listSetupVersions", ({ params }) =>
        getMapValue(setupVersions, params.projectId, "setupVersions"),
      )
      .handle("rollbackSetup", ({ params }) =>
        Effect.gen(function* () {
          const versions = yield* getMapValue(
            setupVersions,
            params.projectId,
            "setupVersions",
          );
          const options = versions.map((version) => ({
            id: String(version.id),
            version,
          }));
          const found = Arr.findFirst(
            options,
            (option) => option.id === params.versionId,
          );
          if (found._tag === "None") {
            return yield* Effect.die(
              new Error(
                `projects.setupVersions: no version ${params.versionId} for ${params.projectId}`,
              ),
            );
          }
          const selected = found.value.version;
          const setup: JsonRecord = {
            projectId: params.projectId,
            instruction: String(selected.instruction ?? ""),
            script: String(selected.script ?? ""),
            machineSize: String(selected.machineSize ?? "medium"),
            baseBranch: String(selected.baseBranch ?? "main"),
            updatedAt: isoMinutesAgo(0),
          };
          yield* setMapValue(setups, params.projectId, setup);
          return setup;
        }),
      )
      .handle("getSnapshotConfig", ({ params }) =>
        getMapValue(snapshotConfigs, params.projectId, "snapshotConfig"),
      )
      .handle("startSnapshotBuild", ({ params, payload }) =>
        Effect.gen(function* () {
          const config = yield* getMapValue(
            snapshotConfigs,
            params.projectId,
            "snapshotConfig",
          );
          const build = snapshotBuild(params.projectId, newId("build"));
          const current = yield* Ref.get(snapshotBuilds);
          yield* setMapValue(snapshotBuilds, params.projectId, [
            build,
            ...(current[params.projectId] ?? []),
          ]);
          return {
            ...build,
            repos: config.repos,
            reason: asString(fields(payload).reason, ""),
          };
        }),
      )
      .handle("listSnapshotBuilds", ({ params }) =>
        getMapValue(snapshotBuilds, params.projectId, "snapshotBuilds"),
      )
      .handle("getSnapshotBuild", ({ params }) =>
        getMapValue(snapshotBuilds, params.projectId, "snapshotBuilds").pipe(
          Effect.flatMap((builds) =>
            requirePrivate(
              Object.fromEntries(
                builds.map((build) => [String(build.id), build]),
              ),
              params.buildId,
              "snapshotBuilds",
            ),
          ),
        ),
      )
      .handle("getSnapshotBuildLog", ({ params }) =>
        getMapValue(snapshotBuilds, params.projectId, "snapshotBuilds").pipe(
          Effect.flatMap((builds) =>
            requirePrivate(
              Object.fromEntries(
                builds.map((build) => [String(build.id), build]),
              ),
              params.buildId,
              "snapshotBuilds",
            ),
          ),
          Effect.map((build) => ({
            buildId: build.id,
            projectId: params.projectId,
            lines: [
              `Preparing snapshot for ${params.projectId}`,
              `Restoring ${(build.repos as ReadonlyArray<string>).join(", ") || "no repositories"}`,
              "Snapshot completed",
            ],
            status: build.status,
          })),
        ),
      )
      .handle("setSnapshotEnabled", ({ params, payload }) =>
        Effect.gen(function* () {
          const config = yield* getMapValue(
            snapshotConfigs,
            params.projectId,
            "snapshotConfig",
          );
          const updated = {
            ...config,
            enabled: asBoolean(fields(payload).enabled, !config.enabled),
          };
          yield* setMapValue(snapshotConfigs, params.projectId, updated);
          return updated;
        }),
      )
      .handle("replaceSnapshotRepos", ({ params, payload }) =>
        Effect.gen(function* () {
          const config = yield* getMapValue(
            snapshotConfigs,
            params.projectId,
            "snapshotConfig",
          );
          const updated = {
            ...config,
            repos: stringList(
              fields(payload).repos ?? fields(payload).repoFullNames,
            ),
          };
          yield* setMapValue(snapshotConfigs, params.projectId, updated);
          return updated;
        }),
      )
      .handle("setSnapshotSmallerTiers", ({ params, payload }) =>
        Effect.gen(function* () {
          const config = yield* getMapValue(
            snapshotConfigs,
            params.projectId,
            "snapshotConfig",
          );
          const updated = {
            ...config,
            smallerTiers: asBoolean(
              fields(payload).smallerTiers ?? fields(payload).enabled,
              !config.smallerTiers,
            ),
          };
          yield* setMapValue(snapshotConfigs, params.projectId, updated);
          return updated;
        }),
      )
      .handle("setAccess", ({ params, payload }) =>
        Effect.gen(function* () {
          const accessLevel = asString(
            fields(payload).access ?? fields(payload).visibility,
            "org",
          );
          yield* setMapValue(access, params.projectId, accessLevel);
          return yield* updateProject(params.projectId, () => ({
            visibility: accessLevel,
            updatedAt: isoMinutesAgo(0),
          }));
        }),
      );
  }),
);
