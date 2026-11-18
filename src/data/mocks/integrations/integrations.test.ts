import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { InvalidRequest } from "../../api/schemas/errors.ts";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId, threads, world } from "../fixtures/world.ts";

const org = { orgId };
const thread = { orgId, threadId: threads.darkMode.id };
const key = `integrations:${orgId}`;

const githubUserAtom = ApiClient.query("integrations", "getGitHubUser", {
  reactivityKeys: [key],
});
const githubInstallationAtom = ApiClient.query(
  "integrations",
  "getGitHubInstallation",
  { params: org, reactivityKeys: [key] },
);
const linearAtom = ApiClient.query("integrations", "getLinear", {
  params: org,
  reactivityKeys: [key],
});
const linearLinksAtom = ApiClient.query("integrations", "listLinearLinks", {
  params: org,
  reactivityKeys: [key],
});
const paperAtom = ApiClient.query("integrations", "getPaper", {
  reactivityKeys: [key],
});
const slackAtom = ApiClient.query("integrations", "getSlack", {
  params: org,
  reactivityKeys: [key],
});
const slackLinksAtom = ApiClient.query("integrations", "listSlackLinks", {
  params: org,
  reactivityKeys: [key],
});
const slackUserReadAtom = ApiClient.query("integrations", "getSlackUserRead", {
  params: org,
  reactivityKeys: [key],
});
const tailscaleAtom = ApiClient.query("integrations", "getTailscale", {
  params: org,
  reactivityKeys: [key],
});

interface Row {
  readonly id: string;
  readonly threadId?: string;
  readonly defaultChannelId?: string;
  readonly notificationsEnabled?: boolean;
  readonly fullName?: string;
  readonly email?: string;
  readonly connected?: boolean;
  readonly tailnet?: string;
  readonly teamId?: string;
  readonly autoLinkEnabled?: boolean;
  readonly access?: string;
  readonly enabled?: boolean;
  readonly valid?: boolean;
  readonly requests?: ReadonlyArray<{
    readonly id: string;
    readonly status: string;
  }>;
}

const rows = (value: unknown) => value as ReadonlyArray<Row>;
const typed = (value: unknown) =>
  value as {
    readonly state?: string;
    readonly configured?: boolean;
    readonly connection?: unknown;
    readonly teamMappings?: ReadonlyArray<{ readonly linearTeamId: string }>;
  } | null;
const row = (value: unknown) => value as Row;

describe("integrations mock", () => {
  it.effect("every GET endpoint returns connected, sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const queries = [
        githubUserAtom,
        ApiClient.query("integrations", "listGitHubReachableInstallations", {
          params: org,
        }),
        ApiClient.query("integrations", "listGitHubInstallationRepos", {
          params: org,
        }),
        ApiClient.query("integrations", "getGitHubWorkspace", { params: org }),
        githubInstallationAtom,
        linearAtom,
        ApiClient.query("integrations", "listLinearLabels", { params: org }),
        linearLinksAtom,
        ApiClient.query("integrations", "listLinearTeams", { params: org }),
        paperAtom,
        slackAtom,
        ApiClient.query("integrations", "listSlackChannels", { params: org }),
        ApiClient.query("integrations", "listSlackEmojis", { params: org }),
        slackLinksAtom,
        ApiClient.query("integrations", "listSlackUsers", {
          params: org,
          query: {},
        }),
        slackUserReadAtom,
        tailscaleAtom,
        ApiClient.query("integrations", "listThreadSlackUserReadAccess", {
          params: thread,
        }),
      ];
      const results = yield* Effect.forEach(queries, (query) =>
        AtomRegistry.getResult(registry, query),
      );

      for (const result of results) {
        assert.isDefined(result);
      }
      assert.strictEqual(typed(results[0])?.state, "connected");
      assert.strictEqual(typed(results[4])?.state, "active");
      assert.isNull(results[5]);
      assert.isTrue(typed(results[9])?.configured);
      assert.isNull(typed(results[9])?.connection);
      assert.isNull(results[10]);
      assert.isTrue(row(results[15]).connected);
      assert.isNull(results[16]);
      assert.isTrue(rows(results[1]).length > 0);
      assert.isTrue(rows(results[2]).length > 0);
      assert.isTrue(rows(results[7]).length > 0);
      assert.isTrue(rows(results[17]).length > 0);
      assert.deepStrictEqual(
        rows(results[2]).map((item) => item.fullName),
        world.repos.map((repo) => repo.fullName),
      );
      assert.deepStrictEqual(
        rows(results[14]).map((item) => item.email),
        world.members.map((member) => member.email),
      );
    }),
  );

  it.effect("refetches connection queries after connect and disconnect", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(githubInstallationAtom);
      registry.mount(linearAtom);
      registry.mount(paperAtom);
      registry.mount(slackAtom);
      registry.mount(tailscaleAtom);
      yield* AtomRegistry.getResult(registry, githubInstallationAtom);
      yield* AtomRegistry.getResult(registry, linearAtom);
      yield* AtomRegistry.getResult(registry, paperAtom);
      yield* AtomRegistry.getResult(registry, slackAtom);
      yield* AtomRegistry.getResult(registry, tailscaleAtom);

      const disconnect = ApiClient.mutation("integrations", "disconnectSlack");
      registry.set(disconnect, { params: org, reactivityKeys: [key] });
      yield* AtomRegistry.getResult(registry, disconnect);
      const afterDisconnect = yield* AtomRegistry.getResult(
        registry,
        slackAtom,
        { suspendOnWaiting: true },
      );
      assert.isNull(afterDisconnect);

      const connect = ApiClient.mutation("integrations", "connectTailscale");
      registry.set(connect, {
        params: org,
        payload: { tailnet: "acme-two.example.com", tags: ["tag:agents"] },
        reactivityKeys: [key],
      });
      const connected = yield* AtomRegistry.getResult(registry, connect);
      assert.strictEqual(row(connected).tailnet, "acme-two.example.com");
      const afterConnect = yield* AtomRegistry.getResult(
        registry,
        tailscaleAtom,
        { suspendOnWaiting: true },
      );
      assert.strictEqual(typed(afterConnect)?.state, "active");
    }),
  );

  it.effect("creates and deletes integration links", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(linearLinksAtom);
      yield* AtomRegistry.getResult(registry, linearLinksAtom);

      const createLinearLink = ApiClient.mutation(
        "integrations",
        "completeLinearLink",
      );
      registry.set(createLinearLink, {
        payload: { threadId: threads.paginate.id, issueKey: "API-39" },
        reactivityKeys: [key],
      });
      const created = row(
        yield* AtomRegistry.getResult(registry, createLinearLink),
      );
      const afterCreate = yield* AtomRegistry.getResult(
        registry,
        linearLinksAtom,
        { suspendOnWaiting: true },
      );
      assert.include(
        rows(afterCreate).map((item) => item.id),
        created.id,
      );

      const deleteLinearLink = ApiClient.mutation(
        "integrations",
        "deleteLinearLink",
      );
      registry.set(deleteLinearLink, {
        params: { ...org, linkId: created.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteLinearLink);
      const afterDelete = yield* AtomRegistry.getResult(
        registry,
        linearLinksAtom,
        { suspendOnWaiting: true },
      );
      assert.notInclude(
        rows(afterDelete).map((item) => item.id),
        created.id,
      );

      const completeSlackLink = ApiClient.mutation(
        "integrations",
        "completeSlackLink",
      );
      registry.set(completeSlackLink, {
        payload: {
          threadId: threads.paginate.id,
          channelId: "C_SAMPLE_GENERAL",
        },
        reactivityKeys: [key],
      });
      const createdSlackLink = row(
        yield* AtomRegistry.getResult(registry, completeSlackLink),
      );
      assert.strictEqual(createdSlackLink.threadId, threads.paginate.id);

      const linkSlackSelf = ApiClient.mutation("integrations", "linkSlackSelf");
      registry.set(linkSlackSelf, { params: org, reactivityKeys: [key] });
      const slackLink = row(
        yield* AtomRegistry.getResult(registry, linkSlackSelf),
      );
      const deleteSlackLink = ApiClient.mutation(
        "integrations",
        "deleteSlackLink",
      );
      registry.set(deleteSlackLink, {
        params: { ...org, linkId: slackLink.id },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, deleteSlackLink);
      const slackLinks = yield* AtomRegistry.getResult(
        registry,
        slackLinksAtom,
        {
          suspendOnWaiting: true,
        },
      );
      assert.notInclude(
        rows(slackLinks).map((item) => item.id),
        slackLink.id,
      );
    }),
  );

  it.effect("updates settings and Slack user-read access", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(slackUserReadAtom);
      registry.mount(linearAtom);
      registry.mount(slackAtom);
      yield* AtomRegistry.getResult(registry, slackUserReadAtom);
      yield* AtomRegistry.getResult(registry, linearAtom);
      yield* AtomRegistry.getResult(registry, slackAtom);

      const updateLinear = ApiClient.mutation("integrations", "updateLinear");
      registry.set(updateLinear, {
        params: org,
        payload: { teamId: "team_sample_api", autoLinkEnabled: true },
        reactivityKeys: [key],
      });
      const updatedLinear = yield* AtomRegistry.getResult(
        registry,
        updateLinear,
      );
      assert.strictEqual(row(updatedLinear).teamId, "team_sample_api");
      const linear = yield* AtomRegistry.getResult(registry, linearAtom, {
        suspendOnWaiting: true,
      });
      assert.isNull(linear);

      const updateSlack = ApiClient.mutation("integrations", "updateSlack");
      registry.set(updateSlack, {
        params: org,
        payload: {
          defaultChannelId: "C_SAMPLE_INCIDENTS",
          notificationsEnabled: false,
        },
        reactivityKeys: [key],
      });
      const updatedSlack = yield* AtomRegistry.getResult(registry, updateSlack);
      assert.strictEqual(
        row(updatedSlack).defaultChannelId,
        "C_SAMPLE_INCIDENTS",
      );
      assert.isFalse(row(updatedSlack).notificationsEnabled === true);
      const slack = yield* AtomRegistry.getResult(registry, slackAtom, {
        suspendOnWaiting: true,
      });
      assert.isNull(slack);

      const setAccess = ApiClient.mutation(
        "integrations",
        "setSlackUserReadAccess",
      );
      registry.set(setAccess, {
        params: org,
        payload: { access: "members", enabled: false },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, setAccess);
      const afterAccess = yield* AtomRegistry.getResult(
        registry,
        slackUserReadAtom,
        { suspendOnWaiting: true },
      );
      assert.strictEqual(row(afterAccess).access, "members");
      assert.isFalse(row(afterAccess).enabled === true);

      const grant = ApiClient.mutation("integrations", "grantSlackUserRead");
      registry.set(grant, {
        params: { ...org, accessId: "slack_access_sample_1" },
        payload: { scopes: ["channels:history"] },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, grant);
      const granted = yield* AtomRegistry.getResult(
        registry,
        slackUserReadAtom,
        { suspendOnWaiting: true },
      );
      assert.strictEqual(
        row(granted).requests?.find(
          (item) => item.id === "slack_access_sample_1",
        )?.status,
        "granted",
      );
    }),
  );

  it.effect(
    "covers the remaining OAuth, disconnect and mutation endpoints",
    () => {
      const registry = AtomRegistry.make();

      const completeGitHubOAuth = ApiClient.mutation(
        "integrations",
        "completeGitHubOAuth",
      );
      const completeLinearOAuth = ApiClient.mutation(
        "integrations",
        "completeLinearOAuth",
      );
      const completePaperOAuth = ApiClient.mutation(
        "integrations",
        "completePaperOAuth",
      );
      const completeSlackOAuth = ApiClient.mutation(
        "integrations",
        "completeSlackOAuth",
      );
      const startLinearOAuth = ApiClient.mutation(
        "integrations",
        "startLinearOAuth",
      );
      const startPaperOAuth = ApiClient.mutation(
        "integrations",
        "startPaperOAuth",
      );
      const startSlackOAuth = ApiClient.mutation(
        "integrations",
        "startSlackOAuth",
      );
      const startSlackUserReadOAuth = ApiClient.mutation(
        "integrations",
        "startSlackUserReadOAuth",
      );
      const startGitHubInstallation = ApiClient.mutation(
        "integrations",
        "startGitHubInstallation",
      );
      const startGitHubUserOAuth = ApiClient.mutation(
        "integrations",
        "startGitHubUserOAuth",
      );
      const previewLinearLink = ApiClient.mutation(
        "integrations",
        "previewLinearLink",
      );
      const previewSlackLink = ApiClient.mutation(
        "integrations",
        "previewSlackLink",
      );
      const linkGitHubInstallation = ApiClient.mutation(
        "integrations",
        "linkGitHubInstallation",
      );
      const unlinkGitHubInstallation = ApiClient.mutation(
        "integrations",
        "unlinkGitHubInstallation",
      );
      const disconnectGitHubDependencyReader = ApiClient.mutation(
        "integrations",
        "disconnectGitHubDependencyReader",
      );
      const disconnectGitHubInstallation = ApiClient.mutation(
        "integrations",
        "disconnectGitHubInstallation",
      );
      const disconnectGitHubUser = ApiClient.mutation(
        "integrations",
        "disconnectGitHubUser",
      );
      const disconnectLinear = ApiClient.mutation(
        "integrations",
        "disconnectLinear",
      );
      const disconnectPaper = ApiClient.mutation(
        "integrations",
        "disconnectPaper",
      );
      const disconnectSlack = ApiClient.mutation(
        "integrations",
        "disconnectSlack",
      );
      const disconnectSlackUserRead = ApiClient.mutation(
        "integrations",
        "disconnectSlackUserRead",
      );
      const disconnectTailscale = ApiClient.mutation(
        "integrations",
        "disconnectTailscale",
      );
      const denySlackUserRead = ApiClient.mutation(
        "integrations",
        "denySlackUserRead",
      );
      const revokeSlackUserRead = ApiClient.mutation(
        "integrations",
        "revokeSlackUserRead",
      );

      return Effect.gen(function* () {
        for (const mutation of [
          completeLinearOAuth,
          completePaperOAuth,
          completeSlackOAuth,
        ]) {
          registry.set(mutation, { payload: { state: "state_sample" } });
          assert.strictEqual(
            (yield* AtomRegistry.getResult(registry, mutation)).result,
            "connected",
          );
        }
        registry.set(completeGitHubOAuth, {
          payload: { state: "state_sample" },
        });
        assert.strictEqual(
          (yield* AtomRegistry.getResult(registry, completeGitHubOAuth)).result,
          "connected",
        );

        registry.set(completeSlackOAuth, {
          payload: { state: "state_sample", error: "access_denied" },
        });
        assert.strictEqual(
          (yield* AtomRegistry.getResult(registry, completeSlackOAuth, {
            suspendOnWaiting: true,
          })).result,
          "denied",
        );
        registry.set(completeGitHubOAuth, {
          payload: { state: "state_sample", code: "code_sample" },
        });
        const github = yield* AtomRegistry.getResult(
          registry,
          completeGitHubOAuth,
          { suspendOnWaiting: true },
        );
        assert.strictEqual(github.orgId, orgId);
        assert.strictEqual(github.returnTo, "settings");

        for (const mutation of [
          startLinearOAuth,
          startPaperOAuth,
          startSlackUserReadOAuth,
        ]) {
          registry.set(mutation, { params: org });
          assert.isDefined(yield* AtomRegistry.getResult(registry, mutation));
        }

        registry.set(startSlackOAuth, { params: org, payload: {} });
        assert.isDefined(
          yield* AtomRegistry.getResult(registry, startSlackOAuth),
        );

        registry.set(startGitHubInstallation, {
          params: org,
          query: { state: "state_sample" },
        });
        assert.isDefined(
          yield* AtomRegistry.getResult(registry, startGitHubInstallation),
        );
        registry.set(startGitHubUserOAuth, {
          params: org,
          query: { state: "state_sample" },
        });
        assert.isDefined(
          yield* AtomRegistry.getResult(registry, startGitHubUserOAuth),
        );

        registry.set(previewLinearLink, {
          payload: { token: "link_token_sample" },
        });
        const linearPreview = yield* AtomRegistry.getResult(
          registry,
          previewLinearLink,
        );
        assert.strictEqual(linearPreview.orgName, world.org.name);
        assert.strictEqual(linearPreview.externalUserName, "Alex Morgan");
        assert.isString(linearPreview.externalUserId);
        assert.strictEqual(linearPreview.workspaceName, "Acme sample");

        registry.set(previewSlackLink, {
          payload: { token: "link_token_sample" },
        });
        const slackPreview = yield* AtomRegistry.getResult(
          registry,
          previewSlackLink,
        );
        assert.strictEqual(slackPreview.orgName, world.org.name);
        assert.strictEqual(slackPreview.externalUserName, "Alex Morgan");
        assert.isString(slackPreview.externalUserId);
        assert.strictEqual(slackPreview.workspaceName, "Acme sample");
        assert.isString(slackPreview.avatarUrl);

        registry.set(linkGitHubInstallation, {
          params: org,
          payload: { installationId: "ghi_sample_acme" },
        });
        const link = yield* AtomRegistry.getResult(
          registry,
          linkGitHubInstallation,
        );
        assert.strictEqual(row(link).id, "ghi_sample_acme");

        registry.set(unlinkGitHubInstallation, {
          params: { ...org, installationId: "ghi_sample_acme" },
        });
        yield* AtomRegistry.getResult(registry, unlinkGitHubInstallation);
        registry.set(disconnectGitHubDependencyReader, { params: org });
        yield* AtomRegistry.getResult(
          registry,
          disconnectGitHubDependencyReader,
        );
        registry.set(disconnectGitHubInstallation, { params: org });
        yield* AtomRegistry.getResult(registry, disconnectGitHubInstallation);
        registry.set(disconnectGitHubUser, {});
        yield* AtomRegistry.getResult(registry, disconnectGitHubUser);
        registry.set(disconnectLinear, { params: org });
        yield* AtomRegistry.getResult(registry, disconnectLinear);
        registry.set(disconnectPaper, {});
        yield* AtomRegistry.getResult(registry, disconnectPaper);
        registry.set(disconnectSlack, { params: org });
        yield* AtomRegistry.getResult(registry, disconnectSlack);
        registry.set(disconnectSlackUserRead, { params: org });
        yield* AtomRegistry.getResult(registry, disconnectSlackUserRead);
        registry.set(disconnectTailscale, { params: org });
        yield* AtomRegistry.getResult(registry, disconnectTailscale);
        registry.set(denySlackUserRead, {
          params: { ...org, accessId: "slack_access_sample_2" },
        });
        yield* AtomRegistry.getResult(registry, denySlackUserRead);
        registry.set(revokeSlackUserRead, {
          params: { ...org, accessId: "slack_access_sample_1" },
        });
        yield* AtomRegistry.getResult(registry, revokeSlackUserRead);
      });
    },
  );

  it.effect("answers an unknown id with the declared 400", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();

      const deleteLinearLink = ApiClient.mutation(
        "integrations",
        "deleteLinearLink",
      );
      registry.set(deleteLinearLink, {
        params: { ...org, linkId: "lin_link_unknown" },
        reactivityKeys: [key],
      });
      const linearLink = yield* AtomRegistry.getResult(
        registry,
        deleteLinearLink,
      ).pipe(Effect.flip);
      assert.instanceOf(linearLink, InvalidRequest);

      const deleteSlackLink = ApiClient.mutation(
        "integrations",
        "deleteSlackLink",
      );
      registry.set(deleteSlackLink, {
        params: { ...org, linkId: "slack_link_unknown" },
        reactivityKeys: [key],
      });
      const slackLink = yield* AtomRegistry.getResult(
        registry,
        deleteSlackLink,
      ).pipe(Effect.flip);
      assert.instanceOf(slackLink, InvalidRequest);

      const grant = ApiClient.mutation("integrations", "grantSlackUserRead");
      registry.set(grant, {
        params: { ...org, accessId: "slack_access_unknown" },
        payload: { scopes: ["channels:history"] },
        reactivityKeys: [key],
      });
      const access = yield* AtomRegistry.getResult(registry, grant).pipe(
        Effect.flip,
      );
      assert.instanceOf(access, InvalidRequest);

      const deny = ApiClient.mutation("integrations", "denySlackUserRead");
      registry.set(deny, {
        params: { ...org, accessId: "slack_access_unknown" },
        reactivityKeys: [key],
      });
      const denied = yield* AtomRegistry.getResult(registry, deny).pipe(
        Effect.flip,
      );
      assert.instanceOf(denied, InvalidRequest);

      const revoke = ApiClient.mutation("integrations", "revokeSlackUserRead");
      registry.set(revoke, {
        params: { ...org, accessId: "slack_access_unknown" },
        reactivityKeys: [key],
      });
      const revoked = yield* AtomRegistry.getResult(registry, revoke).pipe(
        Effect.flip,
      );
      assert.instanceOf(revoked, InvalidRequest);

      const threadAccess = ApiClient.query(
        "integrations",
        "listThreadSlackUserReadAccess",
        {
          params: { ...org, threadId: "jam_unknown" },
          reactivityKeys: [key],
        },
      );
      const thread = yield* AtomRegistry.getResult(registry, threadAccess).pipe(
        Effect.flip,
      );
      assert.instanceOf(thread, InvalidRequest);
    }),
  );
});
