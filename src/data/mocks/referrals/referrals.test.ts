import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";

interface Referral {
  readonly id: string;
  readonly email: string;
  readonly status: string;
}

interface ReferralDashboard {
  readonly code: string;
  readonly referredCount: number;
  readonly totalCredits: number;
}

const key = "referrals";

const dashboardAtom = ApiClient.query("referrals", "dashboard", {
  reactivityKeys: [key],
});
const historyAtom = ApiClient.query("referrals", "list", {
  query: {},
  reactivityKeys: [key],
});
const refereeAtom = ApiClient.query("referrals", "referee", {
  reactivityKeys: [key],
});
const previewAtom = ApiClient.query("referrals", "preview", {
  query: {},
  reactivityKeys: [key],
});

describe("referrals mock", () => {
  it.effect("answers every read endpoint with sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const reads = {
        dashboard: dashboardAtom,
        list: historyAtom,
        kickbacks: ApiClient.query("referrals", "kickbacks", {
          query: {},
          reactivityKeys: [key],
        }),
        preview: previewAtom,
        referee: refereeAtom,
        transfers: ApiClient.query("referrals", "transfers", {
          query: {},
          reactivityKeys: [key],
        }),
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
      const dashboard = results.find(
        ([endpoint]) => endpoint === "dashboard",
      )?.[1] as ReferralDashboard;
      assert.equal(dashboard.code, "ACME-REFS");
      assert.isAbove(dashboard.totalCredits, 0);
      const history = results.find(
        ([endpoint]) => endpoint === "list",
      )?.[1] as ReadonlyArray<Referral>;
      assert.isAbove(history.length, 0);
    }),
  );

  it.effect("refreshes dashboard, history and referee after mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(dashboardAtom);
      registry.mount(historyAtom);
      registry.mount(refereeAtom);
      registry.mount(previewAtom);
      yield* AtomRegistry.getResult(registry, dashboardAtom);
      yield* AtomRegistry.getResult(registry, historyAtom);
      yield* AtomRegistry.getResult(registry, refereeAtom);

      const invite = ApiClient.mutation("referrals", "invite");
      registry.set(invite, {
        payload: {
          email: "newmember@example.com",
          invitedBy: "user_sample_alex",
        },
        reactivityKeys: [key],
      });
      const invited = yield* AtomRegistry.getResult(registry, invite);
      assert.equal((invited as { status: string }).status, "invited");
      const history = yield* AtomRegistry.getResult(registry, historyAtom, {
        suspendOnWaiting: true,
      });
      assert.include(
        (history as ReadonlyArray<Referral>).map((row) => row.email),
        "newmember@example.com",
      );
      let dashboard = yield* AtomRegistry.getResult(registry, dashboardAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((dashboard as ReferralDashboard).referredCount, 4);

      const apply = ApiClient.mutation("referrals", "apply");
      registry.set(apply, {
        payload: { code: "TEAM-2026", credits: 5000 },
        reactivityKeys: [key],
      });
      const applied = yield* AtomRegistry.getResult(registry, apply);
      assert.equal((applied as { status: string }).status, "applied");
      const referee = yield* AtomRegistry.getResult(registry, refereeAtom, {
        suspendOnWaiting: true,
      });
      assert.equal(
        (referee as { appliedCredits: number }).appliedCredits,
        5000,
      );
      const preview = yield* AtomRegistry.getResult(registry, previewAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((preview as { code: string }).code, "TEAM-2026");
      dashboard = yield* AtomRegistry.getResult(registry, dashboardAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((dashboard as ReferralDashboard).code, "TEAM-2026");

      const track = ApiClient.mutation("referrals", "track");
      registry.set(track, {
        payload: {
          kind: "thread",
          actor: "user_sample_sam",
          title: "Fix flaky checkout test",
          threadId: "jam_sample_0001",
          projectId: "proj_sample_web",
        },
        reactivityKeys: [key],
      });
      const tracked = yield* AtomRegistry.getResult(registry, track);
      assert.equal((tracked as { ok: boolean }).ok, true);
    }),
  );
});
