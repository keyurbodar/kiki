import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { OrgId } from "../../api/schemas/ids.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, people, projects } from "../fixtures/world.ts";

interface Row {
  readonly id: string;
  readonly [key: string]: unknown;
}

const key = `organizations:${orgId}`;
const params = { orgId: OrgId.make(orgId) };
const surfaceParams = { orgId: orgId, surface: "web" };

const listAtom = ApiClient.query("organizations", "list", {
  reactivityKeys: [key],
});
const invitationsAtom = ApiClient.query("organizations", "listMyInvitations", {
  reactivityKeys: [key],
});
const domainsAtom = ApiClient.query("organizations", "listAllowedDomains", {
  params,
  reactivityKeys: [key],
});
const ssoAtom = ApiClient.query("organizations", "getSsoConnection", {
  params,
  reactivityKeys: [key],
});

const run = (
  registry: ReturnType<typeof AtomRegistry.make>,
  atom: unknown,
  input: object,
): Effect.Effect<unknown> => {
  const writable = atom as never;
  registry.set(writable, { ...input, reactivityKeys: [key] });
  return AtomRegistry.getResult(
    registry,
    writable,
  ) as unknown as Effect.Effect<unknown>;
};

const rows = (value: unknown) => value as ReadonlyArray<Row>;

describe("organizations mock", () => {
  it.effect("answers every read endpoint with sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const reads = {
        invitations: invitationsAtom,
        joinable: ApiClient.query(
          "organizations",
          "listJoinableOrganizations",
          {
            reactivityKeys: [key],
          },
        ),
        list: listAtom,
        deleted: ApiClient.query("organizations", "listDeleted", {
          reactivityKeys: [key],
        }),
        get: ApiClient.query("organizations", "get", {
          params,
          reactivityKeys: [key],
        }),
        domains: domainsAtom,
        surfaceModel: ApiClient.query("organizations", "surfaceDefaultModel", {
          params: surfaceParams,
          reactivityKeys: [key],
        }),
        departed: ApiClient.query("organizations", "listDepartedPrivateWork", {
          params,
          reactivityKeys: [key],
        }),
        sso: ssoAtom,
      } as const;
      const results = yield* Effect.all(
        Object.entries(reads).map(([endpoint, atom]) =>
          AtomRegistry.getResult(registry, atom).pipe(
            Effect.map((value) => [endpoint, value] as const),
          ),
        ),
      );
      for (const [endpoint, value] of results) {
        assert.isDefined(value, endpoint);
        assert.isNotEmpty(value as object, endpoint);
      }
      assert.equal((results[4]![1] as Row).id, orgId);
      assert.equal(
        (results[5]![1] as ReadonlyArray<Row>)[0]?.domain,
        "example.com",
      );
      assert.equal((results[6]![1] as Row).modelId, "anthropic/claude-sonnet");
    }),
  );

  it.effect("mutations refresh the matching organization queries", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(listAtom);
      registry.mount(domainsAtom);
      registry.mount(ssoAtom);
      yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });

      const created = (yield* run(
        registry,
        ApiClient.mutation("organizations", "create"),
        {
          payload: { name: "Sandbox" },
        },
      )) as Row;
      assert.equal(created.name, "Sandbox");
      const afterCreate = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.equal(
        rows(afterCreate).find((row) => row.id === created.id)?.name,
        "Sandbox",
      );

      const added = (yield* run(
        registry,
        ApiClient.mutation("organizations", "addAllowedDomain"),
        { params, payload: { domain: "example.org" } },
      )) as Row;
      assert.equal(added.verified, false);
      yield* run(
        registry,
        ApiClient.mutation("organizations", "verifyAllowedDomain"),
        { params: { orgId: orgId, domainId: added.id } },
      );
      const verified = (yield* run(
        registry,
        ApiClient.mutation("organizations", "setAllowedDomainSsoRequired"),
        {
          params: { orgId, domainId: added.id },
          payload: { ssoRequired: true },
        },
      )) as Row;
      assert.isTrue(verified.verified);
      assert.isTrue(verified.ssoRequired);

      yield* run(
        registry,
        ApiClient.mutation("organizations", "removeAllowedDomain"),
        { params: { orgId: orgId, domainId: added.id } },
      );
      const afterRemove = yield* AtomRegistry.getResult(registry, domainsAtom, {
        suspendOnWaiting: true,
      });
      assert.notInclude(
        rows(afterRemove).map((row) => row.id),
        added.id,
      );

      const mfa = (yield* run(
        registry,
        ApiClient.mutation("organizations", "setMfaRequired"),
        { params, payload: { required: true } },
      )) as Row;
      assert.isTrue(mfa.mfaRequired);
      const afterMfa = yield* AtomRegistry.getResult(registry, listAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue((rows(afterMfa)[0] as Row).mfaRequired);

      const sso = (yield* run(
        registry,
        ApiClient.mutation("organizations", "setOrgSsoRequired"),
        { params, payload: { ssoRequired: true } },
      )) as Row;
      assert.isTrue(sso.ssoRequired);
      const afterSso = yield* AtomRegistry.getResult(registry, ssoAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue((afterSso as Row).ssoRequired);
    }),
  );

  it.effect("exercises every remaining mutation endpoint", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const mutation = (endpoint: string, input: object) =>
        run(
          registry,
          ApiClient.mutation("organizations", endpoint as never),
          input,
        );

      assert.isDefined(
        yield* mutation("setDefaultModel", {
          params,
          payload: { modelId: "openai/gpt" },
        }),
      );
      assert.isDefined(
        yield* mutation("setSurfaceDefaultModel", {
          params: surfaceParams,
          payload: { modelId: "google/gemini" },
        }),
      );
      assert.isDefined(yield* mutation("joinByDomain", { params }));
      assert.isDefined(
        yield* mutation("setDefaultProject", {
          params,
          payload: { projectId: projects.api.id },
        }),
      );
      assert.isDefined(
        yield* mutation("setDefaultVisibility", {
          params,
          payload: { visibility: "private" },
        }),
      );
      assert.isDefined(
        yield* mutation("setTitlePrompt", {
          params,
          payload: { titlePrompt: "Summarize the thread" },
        }),
      );
      assert.isDefined(
        yield* mutation("setTitleTriggers", {
          params,
          payload: { titleTriggers: ["pull_opened"] },
        }),
      );
      assert.isDefined(
        yield* mutation("transferPrivateWork", {
          params: { orgId, userId: people.casey.id },
          payload: { toUserId: people.alex.id },
        }),
      );
      assert.isDefined(
        yield* mutation("setPersonalThreads", {
          params,
          payload: { enabled: false },
        }),
      );
      assert.isDefined(
        yield* mutation("setPullGuides", {
          params,
          payload: { enabled: false },
        }),
      );
      assert.isDefined(
        yield* mutation("setSharing", {
          params,
          payload: { sharing: "org" },
        }),
      );
      assert.isDefined(
        yield* mutation("connectSsoConnection", {
          params,
          payload: { provider: "google", domain: "example.com" },
        }),
      );
      assert.isDefined(yield* mutation("disconnectSsoConnection", { params }));
      assert.isDefined(
        yield* mutation("configureSsoConnection", {
          params,
          payload: { clientId: "sample-client" },
        }),
      );
      assert.isDefined(
        yield* mutation("setSsoConnectionActive", {
          params,
          payload: { active: true },
        }),
      );
      assert.isDefined(
        yield* mutation("addSsoCertificate", {
          params,
          payload: { name: "Backup certificate" },
        }),
      );
      assert.isDefined(
        yield* mutation("draftSsoConnection", {
          params,
          payload: { provider: "google" },
        }),
      );
      assert.isDefined(
        yield* mutation("setTaskLimits", {
          params,
          payload: { concurrent: 8, nested: 4 },
        }),
      );
      assert.isDefined(
        yield* mutation("setOrgTitlePrompt", {
          params,
          payload: { titlePrompt: "Org summary" },
        }),
      );
      assert.isDefined(
        yield* mutation("setOrgTitleTriggers", {
          params,
          payload: { titleTriggers: ["first_run_ended"] },
        }),
      );
    }),
  );
});
