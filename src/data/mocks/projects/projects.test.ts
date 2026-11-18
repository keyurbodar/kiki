import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { HttpApiError } from "effect/http-api";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import {
  orgId,
  otherOrgId,
  people,
  projects,
  repos,
} from "../fixtures/world.ts";

const key = `projects:${orgId}`;
const projectId = projects.web.id;
const otherProjectId = projects.api.id;
const memberId = people.sam.id;
const repoName = repos[0].fullName;
const variableName = "NODE_ENV";

type QueryAtom = ReturnType<typeof ApiClient.query<"projects", "list">>;

const query = (endpoint: string, request: Record<string, unknown>) =>
  ApiClient.query(
    "projects",
    endpoint as never,
    {
      ...request,
      reactivityKeys: [key],
    } as never,
  ) as unknown as QueryAtom;

type MutationAtom = ReturnType<typeof ApiClient.mutation<"projects", "create">>;

const mutation = (endpoint: string, request: Record<string, unknown>) => {
  const atom = ApiClient.mutation(
    "projects",
    endpoint as never,
  ) as unknown as MutationAtom;
  return {
    atom,
    request: { ...request, reactivityKeys: [key] },
  };
};

const record = (value: unknown) => value as Record<string, unknown>;
const rows = (value: unknown) =>
  value as ReadonlyArray<Record<string, unknown>>;
const names = (value: unknown) =>
  rows(value).map((row) => String(row.name ?? row.fullName ?? ""));
const hasRowWith = (value: unknown, field: string, expected: unknown) =>
  rows(value).some((row) => row[field] === expected);

const projectParams = { orgId, projectId };
const orgParams = { orgId };

const getEndpoints = [
  ["listed", { params: orgParams }],
  ["settingsDirectory", { params: orgParams, query: {} }],
  ["list", { params: orgParams, query: {} }],
  ["get", { params: projectParams }],
  ["listDependencyRepos", { params: projectParams }],
  ["listEnvironmentVariables", { params: projectParams }],
  [
    "getEnvironmentVariableValue",
    { params: { ...projectParams, name: variableName } },
  ],
  ["listPersonalEnvironmentVariables", { params: projectParams }],
  [
    "getPersonalEnvironmentVariableValue",
    { params: { ...projectParams, name: "EDITOR" } },
  ],
  ["searchGithubAuthors", { params: projectParams, query: {} }],
  ["getSetup", { params: projectParams }],
  ["listSetupVersions", { params: projectParams }],
  ["getSnapshotConfig", { params: projectParams }],
  ["listSnapshotBuilds", { params: projectParams }],
] as const;

const mutationEndpoints = [
  [
    "create",
    { params: orgParams, payload: { name: "Mobile app", code: "MOB" } },
  ],
  [
    "update",
    {
      params: projectParams,
      payload: { name: "Web app renamed", visibility: "private" },
    },
  ],
  [
    "setEnvironmentVariables",
    {
      params: projectParams,
      payload: { variables: [{ name: variableName, value: "test" }] },
    },
  ],
  [
    "setEnvironmentVariable",
    {
      params: { ...projectParams, name: "DATABASE_URL" },
      payload: { value: "postgres://example.test/app" },
    },
  ],
  [
    "setPersonalEnvironmentVariables",
    {
      params: projectParams,
      payload: { variables: [{ name: variableName, value: "local" }] },
    },
  ],
  [
    "setPersonalEnvironmentVariable",
    { params: { ...projectParams, name: "EDITOR" }, payload: { value: "vim" } },
  ],
  [
    "uploadLogo",
    { params: projectParams, payload: { url: "https://example.com/logo.png" } },
  ],
  ["addMembers", { params: projectParams, payload: { memberIds: [memberId] } }],
  ["setOwner", { params: projectParams, payload: { ownerId: memberId } }],
  [
    "replaceRepos",
    {
      params: projectParams,
      payload: { repos: [{ repoFullName: repoName, baseBranch: "main" }] },
    },
  ],
  [
    "addRepos",
    {
      params: projectParams,
      payload: { repos: [{ repoFullName: repos[1].fullName }] },
    },
  ],
  [
    "setRepoMode",
    {
      params: { ...projectParams, owner: "acme", repo: "web" },
      payload: { mode: "lazy" },
    },
  ],
  [
    "replaceDependencyRepos",
    {
      params: projectParams,
      payload: {
        repos: [
          { repoFullName: repoName, githubRepoId: null, installationId: 1 },
        ],
      },
    },
  ],
  [
    "replaceSetup",
    {
      params: projectParams,
      payload: { machineSize: "medium", repositories: [] },
    },
  ],
  ["updateSetup", { params: projectParams, payload: { machineSize: "large" } }],
  ["startSnapshotBuild", { params: projectParams, payload: {} }],
  ["setSnapshotEnabled", { params: projectParams, payload: { enabled: true } }],
  [
    "replaceSnapshotRepos",
    { params: projectParams, payload: { repos: [repoName] } },
  ],
  [
    "setSnapshotSmallerTiers",
    { params: projectParams, payload: { buildSmallerTiers: true } },
  ],
  ["setAccess", { params: projectParams, payload: { access: "private" } }],
] as const;

const buildAtoms = () => {
  const atoms = new Map<string, QueryAtom>();
  for (const [endpoint, request] of getEndpoints) {
    atoms.set(endpoint, query(endpoint, request));
  }
  return atoms;
};

const get = (
  registry: ReturnType<typeof AtomRegistry.make>,
  atoms: Map<string, QueryAtom>,
  endpoint: string,
  suspendOnWaiting = false,
) =>
  AtomRegistry.getResult(registry, atoms.get(endpoint) as QueryAtom, {
    suspendOnWaiting,
  });

const runMutation = (
  registry: ReturnType<typeof AtomRegistry.make>,
  endpoint: string,
  request: Record<string, unknown>,
) =>
  Effect.gen(function* () {
    const change = mutation(endpoint, request);
    registry.set(change.atom, change.request as never);
    return yield* AtomRegistry.getResult(registry, change.atom);
  });

describe("projects mock", () => {
  it.effect("serves every read endpoint with sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const atoms = buildAtoms();
      const listed = yield* get(registry, atoms, "listed");
      assert.isTrue(rows(listed).length > 0);
      assert.isTrue(rows(listed).some((row) => row.id === projectId));

      const directory = record(
        yield* get(registry, atoms, "settingsDirectory"),
      );
      assert.isTrue(rows(directory.items).some((row) => row.id === projectId));

      const list = yield* get(registry, atoms, "list");
      assert.isTrue(rows(list).some((row) => row.id === projectId));

      const project = record(yield* get(registry, atoms, "get"));
      assert.strictEqual(project.id, projectId);
      assert.strictEqual(project.name, "Web app");

      assert.isTrue(
        rows(yield* get(registry, atoms, "listDependencyRepos")).length > 0,
      );
      assert.isTrue(
        rows(yield* get(registry, atoms, "listEnvironmentVariables")).length >
          0,
      );
      assert.isFalse(
        record(yield* get(registry, atoms, "getEnvironmentVariableValue"))
          .value === undefined,
      );
      assert.isTrue(
        rows(yield* get(registry, atoms, "listPersonalEnvironmentVariables"))
          .length > 0,
      );
      assert.isFalse(
        record(
          yield* get(registry, atoms, "getPersonalEnvironmentVariableValue"),
        ).value === undefined,
      );
      assert.isTrue(
        rows(yield* get(registry, atoms, "searchGithubAuthors")).length > 0,
      );
      assert.isTrue(
        rows(record(yield* get(registry, atoms, "getSetup")).repositories)
          .length > 0,
      );
      assert.isTrue(
        rows(yield* get(registry, atoms, "listSetupVersions")).length > 0,
      );
      assert.isTrue(
        record(yield* get(registry, atoms, "getSnapshotConfig")).configured ===
          true,
      );
      assert.isTrue(
        rows(yield* get(registry, atoms, "listSnapshotBuilds")).length > 0,
      );
    }),
  );

  it.effect("refreshes queries after create, update and delete mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const atoms = buildAtoms();
      const projectList = atoms.get("list") as QueryAtom;
      registry.mount(projectList);
      yield* AtomRegistry.getResult(registry, projectList);

      const created = record(
        yield* runMutation(registry, "create", {
          params: orgParams,
          payload: { name: "Mobile app", code: "MOB" },
        }),
      );
      const afterCreate = yield* AtomRegistry.getResult(registry, projectList, {
        suspendOnWaiting: true,
      });
      assert.isTrue(
        rows(afterCreate).some(
          (row) =>
            String(row.id ?? row.name) === String(created.id ?? created.name),
        ),
      );

      yield* runMutation(registry, "update", {
        params: { orgId, projectId: created.id as string },
        payload: { name: "Mobile app renamed" },
      });
      const afterUpdate = yield* AtomRegistry.getResult(registry, projectList, {
        suspendOnWaiting: true,
      });
      assert.isTrue(names(afterUpdate).includes("Mobile app renamed"));

      yield* runMutation(registry, "delete", {
        params: { orgId, projectId: created.id as string },
      });
      const afterDelete = yield* AtomRegistry.getResult(registry, projectList, {
        suspendOnWaiting: true,
      });
      assert.isFalse(
        rows(afterDelete).some(
          (row) =>
            String(row.id ?? row.name) === String(created.id ?? created.name),
        ),
      );

      yield* runMutation(registry, "restore", {
        params: { orgId, projectId: created.id as string },
      });
      const afterRestore = yield* AtomRegistry.getResult(
        registry,
        projectList,
        {
          suspendOnWaiting: true,
        },
      );
      assert.isTrue(
        rows(afterRestore).some(
          (row) =>
            String(row.id ?? row.name) === String(created.id ?? created.name),
        ),
      );
    }),
  );

  it.effect(
    "keeps variables, members, setup and snapshots in sync with queries",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const atoms = buildAtoms();
        for (const atom of atoms.values()) registry.mount(atom);
        for (const atom of atoms.values())
          yield* AtomRegistry.getResult(registry, atom);

        yield* runMutation(registry, "setEnvironmentVariable", {
          params: { ...projectParams, name: "API_TOKEN" },
          payload: { value: "secret-test" },
        });
        let variables = yield* get(
          registry,
          atoms,
          "listEnvironmentVariables",
          true,
        );
        assert.isTrue(hasRowWith(variables, "name", "API_TOKEN"));
        const value = record(
          yield* AtomRegistry.getResult(
            registry,
            query("getEnvironmentVariableValue", {
              params: { ...projectParams, name: "API_TOKEN" },
            }),
            { suspendOnWaiting: true },
          ),
        );
        assert.strictEqual(value.value, "secret-test");

        yield* runMutation(registry, "deleteEnvironmentVariable", {
          params: { ...projectParams, name: "API_TOKEN" },
        });
        variables = yield* get(
          registry,
          atoms,
          "listEnvironmentVariables",
          true,
        );
        assert.isFalse(hasRowWith(variables, "name", "API_TOKEN"));

        yield* runMutation(registry, "setPersonalEnvironmentVariable", {
          params: { ...projectParams, name: "PERSONAL_TOKEN" },
          payload: { value: "personal-test" },
        });
        const personal = yield* get(
          registry,
          atoms,
          "listPersonalEnvironmentVariables",
          true,
        );
        assert.isTrue(hasRowWith(personal, "name", "PERSONAL_TOKEN"));

        yield* runMutation(registry, "deletePersonalEnvironmentVariable", {
          params: { ...projectParams, name: "PERSONAL_TOKEN" },
        });

        yield* runMutation(registry, "removeMembers", {
          params: projectParams,
          query: { memberIds: [memberId] },
        });
        yield* runMutation(registry, "addMembers", {
          params: projectParams,
          payload: { memberIds: [memberId] },
        });

        yield* runMutation(registry, "replaceSetup", {
          params: projectParams,
          payload: { machineSize: "medium", repositories: [] },
        });
        yield* runMutation(registry, "updateSetup", {
          params: projectParams,
          payload: { machineSize: "large" },
        });
        const versions = yield* get(registry, atoms, "listSetupVersions", true);
        assert.isTrue(rows(versions).length > 1);

        const setup = record(yield* get(registry, atoms, "getSetup", true));
        assert.strictEqual(setup.machineSize, "large");
        yield* runMutation(registry, "rollbackSetup", {
          params: {
            ...projectParams,
            versionId: `ver_sample_${projectId}`,
          },
        });

        const build = record(
          yield* runMutation(registry, "startSnapshotBuild", {
            params: projectParams,
            payload: { reason: "wiring test" },
          }),
        );
        const buildParams = { ...projectParams, buildId: build.id as string };
        const singleBuild = yield* AtomRegistry.getResult(
          registry,
          query("getSnapshotBuild", { params: buildParams }),
          { suspendOnWaiting: true },
        );
        assert.strictEqual(record(singleBuild).id, build.id);
        const log = yield* AtomRegistry.getResult(
          registry,
          query("getSnapshotBuildLog", { params: buildParams, query: {} }),
          { suspendOnWaiting: true },
        );
        assert.isTrue(rows(record(log).lines as unknown).length > 0);

        yield* runMutation(registry, "setSnapshotEnabled", {
          params: projectParams,
          payload: { enabled: true },
        });
        const snapshot = record(
          yield* get(registry, atoms, "getSnapshotConfig", true),
        );
        assert.isTrue(snapshot.enabled === true);

        yield* runMutation(registry, "setAccess", {
          params: projectParams,
          payload: { access: "private" },
        });
        const project = record(yield* get(registry, atoms, "get", true));
        assert.strictEqual(project.visibility, "private");
      }),
  );

  it.effect("calls every remaining endpoint without a 501", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      for (const [endpoint, request] of mutationEndpoints) {
        const result = yield* runMutation(registry, endpoint, request);
        assert.isFalse(
          typeof result === "object" && result !== null && "_tag" in result,
          `${endpoint} returned a mock error`,
        );
      }

      const calls = [
        ["removeLogo", { params: projectParams }],
        [
          "rollbackSetup",
          {
            params: { ...projectParams, versionId: `ver_sample_${projectId}` },
          },
        ],
        [
          "removeMembers",
          { params: projectParams, query: { memberIds: [memberId] } },
        ],
        [
          "deleteEnvironmentVariable",
          { params: { ...projectParams, name: "DATABASE_URL" } },
        ],
        [
          "deletePersonalEnvironmentVariable",
          { params: { ...projectParams, name: "EDITOR" } },
        ],
        [
          "setEnvironmentVariables",
          {
            params: { orgId, projectId: otherProjectId },
            payload: { variables: [{ name: "MODE", value: "test" }] },
          },
        ],
        [
          "setPersonalEnvironmentVariables",
          {
            params: { orgId, projectId: otherProjectId },
            payload: { variables: [{ name: "MODE", value: "local" }] },
          },
        ],
        ["restore", { params: { orgId, projectId: projects.old.id } }],
        [
          "setRepoMode",
          {
            params: { ...projectParams, owner: "acme", repo: "api" },
            payload: { mode: "primary" },
          },
        ],
        [
          "uploadLogo",
          {
            params: { orgId, projectId: otherProjectId },
            payload: { url: "https://example.com/other.png" },
          },
        ],
      ] as const;

      for (const [endpoint, request] of calls) {
        const result = yield* runMutation(registry, endpoint, request);
        assert.isFalse(
          typeof result === "object" && result !== null && "_tag" in result,
          `${endpoint} returned a mock error`,
        );
      }

      const ownOrg = yield* AtomRegistry.getResult(
        registry,
        query("list", { params: { orgId }, query: {} }),
      );
      assert.isTrue(rows(ownOrg).length > 0);
      const otherOrg = yield* AtomRegistry.getResult(
        registry,
        query("list", { params: { orgId: otherOrgId }, query: {} }),
      );
      assert.strictEqual(rows(otherOrg).length, 0);
    }),
  );

  it.effect(
    "answers the 404 every project endpoint declares for an unknown id",
    () =>
      Effect.gen(function* () {
        const registry = AtomRegistry.make();
        const nobody = { orgId, projectId: "proj_nobody" };
        const misses = [
          ["get", { params: nobody }],
          ["update", { params: nobody, payload: { name: "Nobody" } }],
          ["delete", { params: nobody }],
          ["restore", { params: nobody }],
          [
            "setRepoMode",
            {
              params: { ...nobody, owner: "acme", repo: "api" },
              payload: { mode: "primary" },
            },
          ],
          [
            "addRepos",
            {
              params: nobody,
              payload: { repos: [{ repoFullName: "acme/ghost" }] },
            },
          ],
          [
            "replaceRepos",
            {
              params: nobody,
              payload: {
                repos: [{ repoFullName: "acme/ghost", baseBranch: "main" }],
              },
            },
          ],
          [
            "uploadLogo",
            {
              params: nobody,
              payload: { url: "https://example.com/ghost.png" },
            },
          ],
          ["removeLogo", { params: nobody }],
          [
            "removeMembers",
            { params: nobody, query: { memberIds: [memberId] } },
          ],
          ["setAccess", { params: nobody, payload: { access: "org" } }],
          [
            "getSnapshotBuild",
            { params: { ...nobody, buildId: "snapbuild_nobody" } },
          ],
          [
            "getSnapshotBuildLog",
            { params: { ...nobody, buildId: "snapbuild_nobody" }, query: {} },
          ],
          ["rollbackSetup", { params: { ...nobody, versionId: "ver_nobody" } }],
        ] as const;

        for (const [endpoint, request] of misses) {
          const error = yield* runMutation(
            registry,
            endpoint,
            request as unknown as Record<string, unknown>,
          ).pipe(Effect.flip);
          assert.instanceOf(error, HttpApiError.NotFound, endpoint);
        }
      }),
  );
});
