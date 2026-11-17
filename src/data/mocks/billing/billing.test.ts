import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { ApiClient } from "../../client/ApiClient.ts";
import { orgId } from "../fixtures/world.ts";

interface Account {
  readonly plan: string;
  readonly planStatus: string;
  readonly credits: number;
  readonly cancelAtPeriodEnd: boolean;
  readonly receipts: boolean;
  readonly receiptEmail: string;
  readonly sponsoredPaidFallthrough: boolean;
  readonly ssoAddOn: { readonly status: string };
  readonly autoReload: { readonly enabled: boolean; readonly attempts: number };
}

interface Invoice {
  readonly id: string;
  readonly number: string;
}

const key = `billing:${orgId}`;
const params = { orgId };

const accountAtom = ApiClient.query("billing", "get", {
  params,
  reactivityKeys: [key],
});
const invoicesAtom = ApiClient.query("billing", "listInvoices", {
  params,
  query: {},
  reactivityKeys: [key],
});

describe("billing mock", () => {
  it.effect("answers every read endpoint with sensible data", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      const reads = {
        get: accountAtom,
        catalog: ApiClient.query("billing", "catalog", {
          params,
          reactivityKeys: [key],
        }),
        listInvoices: invoicesAtom,
        usage: ApiClient.query("billing", "usage", {
          params,
          query: {},
          reactivityKeys: [key],
        }),
        usageBreakdown: ApiClient.query("billing", "usageBreakdown", {
          params,
          query: {},
          reactivityKeys: [key],
        }),
        usageHeatmap: ApiClient.query("billing", "usageHeatmap", {
          params,
          reactivityKeys: [key],
        }),
        usageLeaderboard: ApiClient.query("billing", "usageLeaderboard", {
          params,
          query: {},
          reactivityKeys: [key],
        }),
        usageMemberEntries: ApiClient.query("billing", "usageMemberEntries", {
          params,
          query: {},
          reactivityKeys: [key],
        }),
        usageSeries: ApiClient.query("billing", "usageSeries", {
          params,
          query: {},
          reactivityKeys: [key],
        }),
        usageThreads: ApiClient.query("billing", "usageThreads", {
          params,
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
      const account = results.find(
        ([endpoint]) => endpoint === "get",
      )?.[1] as Account;
      assert.equal(account.planStatus, "active");
      assert.isAbove(account.credits, 0);
      const invoices = results.find(
        ([endpoint]) => endpoint === "listInvoices",
      )?.[1] as ReadonlyArray<Invoice>;
      assert.isAbove(invoices.length, 0);
    }),
  );

  it.effect("refreshes account and invoices after mutations", () =>
    Effect.gen(function* () {
      const registry = AtomRegistry.make();
      registry.mount(accountAtom);
      registry.mount(invoicesAtom);
      yield* AtomRegistry.getResult(registry, accountAtom);
      yield* AtomRegistry.getResult(registry, invoicesAtom);

      const updateAutoReload = ApiClient.mutation(
        "billing",
        "updateAutoReload",
      );
      registry.set(updateAutoReload, {
        params,
        payload: { enabled: false, threshold: 2500 },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, updateAutoReload);
      let account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse((account as Account).autoReload.enabled);

      const purchaseCredits = ApiClient.mutation("billing", "purchaseCredits");
      registry.set(purchaseCredits, {
        params,
        payload: { packId: "credits_team", credits: 25000 },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, purchaseCredits);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isAbove((account as Account).credits, 18450);

      const confirmPlan = ApiClient.mutation("billing", "confirmPlan");
      registry.set(confirmPlan, {
        params,
        payload: { plan: "Enterprise" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, confirmPlan);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((account as Account).planStatus, "active");

      const cancelPlan = ApiClient.mutation("billing", "cancelPlan");
      registry.set(cancelPlan, { params, payload: {}, reactivityKeys: [key] });
      yield* AtomRegistry.getResult(registry, cancelPlan);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isTrue((account as Account).cancelAtPeriodEnd);

      const keepPlan = ApiClient.mutation("billing", "keepPlan");
      registry.set(keepPlan, { params, reactivityKeys: [key] });
      yield* AtomRegistry.getResult(registry, keepPlan);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse((account as Account).cancelAtPeriodEnd);

      const updateReceipts = ApiClient.mutation("billing", "updateReceipts");
      registry.set(updateReceipts, {
        params,
        payload: { enabled: false, email: "finance@example.com" },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, updateReceipts);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse((account as Account).receipts);
      assert.equal((account as Account).receiptEmail, "finance@example.com");

      const updateFallthrough = ApiClient.mutation(
        "billing",
        "updateSponsoredPaidFallthrough",
      );
      registry.set(updateFallthrough, {
        params,
        payload: { enabled: false },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, updateFallthrough);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.isFalse((account as Account).sponsoredPaidFallthrough);

      const cancelSsoAddOn = ApiClient.mutation("billing", "cancelSsoAddOn");
      registry.set(cancelSsoAddOn, { params, reactivityKeys: [key] });
      yield* AtomRegistry.getResult(registry, cancelSsoAddOn);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((account as Account).ssoAddOn.status, "canceled");

      const confirmSsoAddOn = ApiClient.mutation("billing", "confirmSsoAddOn");
      registry.set(confirmSsoAddOn, {
        params,
        payload: { amount: 1500 },
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, confirmSsoAddOn);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((account as Account).ssoAddOn.status, "active");

      const keepSsoAddOn = ApiClient.mutation("billing", "keepSsoAddOn");
      registry.set(keepSsoAddOn, { params, reactivityKeys: [key] });
      yield* AtomRegistry.getResult(registry, keepSsoAddOn);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((account as Account).ssoAddOn.status, "active");

      const retryAutoReload = ApiClient.mutation("billing", "retryAutoReload");
      registry.set(retryAutoReload, {
        params,
        payload: {},
        reactivityKeys: [key],
      });
      yield* AtomRegistry.getResult(registry, retryAutoReload);
      account = yield* AtomRegistry.getResult(registry, accountAtom, {
        suspendOnWaiting: true,
      });
      assert.equal((account as Account).autoReload.attempts, 3);

      const withPayload = [
        ["openAutoReloadPayment", { amount: 10000 }],
        ["openPortal", {}],
        ["previewPlan", { plan: "Team" }],
      ] as const;
      for (const [endpoint, payload] of withPayload) {
        const mutation = ApiClient.mutation("billing", endpoint);
        registry.set(mutation, { params, payload, reactivityKeys: [key] });
        const result = yield* AtomRegistry.getResult(registry, mutation);
        assert.isDefined(result, endpoint);
      }

      const setupIntent = ApiClient.mutation("billing", "createSetupIntent");
      registry.set(setupIntent, { params, query: {}, reactivityKeys: [key] });
      assert.isDefined(yield* AtomRegistry.getResult(registry, setupIntent));

      const previewSsoAddOn = ApiClient.mutation("billing", "previewSsoAddOn");
      registry.set(previewSsoAddOn, { params, reactivityKeys: [key] });
      assert.isDefined(
        yield* AtomRegistry.getResult(registry, previewSsoAddOn),
      );
    }),
  );
});
