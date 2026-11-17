import { DateTime, Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  accountSeed,
  catalogSeed,
  invoiceSeed,
  memberUsageSeed,
  threadUsageSeed,
  usageSeed,
} from "./fixtures.ts";

const stringField = (
  input: Record<string, unknown>,
  key: string,
  fallback: string,
) => (typeof input[key] === "string" ? (input[key] as string) : fallback);

const numberField = (
  input: Record<string, unknown>,
  key: string,
  fallback: number,
) => (typeof input[key] === "number" ? input[key] : fallback);

const booleanField = (
  input: Record<string, unknown>,
  key: string,
  fallback: boolean,
) => (typeof input[key] === "boolean" ? input[key] : fallback);

export const BillingMock = mockGroup("billing", (handlers) =>
  Effect.gen(function* () {
    const account = yield* Ref.make(structuredClone(accountSeed));
    const invoices = yield* Ref.make(structuredClone(invoiceSeed));

    return handlers
      .handle("get", () => Ref.get(account))
      .handle("catalog", () => Effect.succeed(catalogSeed))
      .handle("listInvoices", () => Ref.get(invoices))
      .handle("usage", () => Effect.succeed(usageSeed))
      .handle("usageBreakdown", () =>
        Ref.get(account).pipe(Effect.as(usageSeed.breakdown)),
      )
      .handle("usageHeatmap", () => Effect.succeed(usageSeed.heatmap))
      .handle("usageLeaderboard", () => Effect.succeed(usageSeed.leaderboard))
      .handle("usageMemberEntries", () => Effect.succeed(memberUsageSeed))
      .handle("usageSeries", () => Effect.succeed(usageSeed.series))
      .handle("usageThreads", () => Effect.succeed(threadUsageSeed))
      .handle("updateAutoReload", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            autoReload: {
              ...current.autoReload,
              enabled: booleanField(
                input,
                "enabled",
                current.autoReload.enabled,
              ),
              threshold: numberField(
                input,
                "threshold",
                current.autoReload.threshold,
              ),
              amount: numberField(input, "amount", current.autoReload.amount),
              thresholdCredits: numberField(
                input,
                "thresholdCredits",
                current.autoReload.thresholdCredits,
              ),
              amountCredits: numberField(
                input,
                "amountCredits",
                current.autoReload.amountCredits,
              ),
              monthlyCapCredits:
                "monthlyCapCredits" in input
                  ? (input.monthlyCapCredits as number | null)
                  : current.autoReload.monthlyCapCredits,
            },
          }));
          return updated.autoReload;
        }),
      )
      .handle("openAutoReloadPayment", ({ payload }) =>
        Effect.succeed({
          url: "https://billing.example.com/auto-reload/payment",
          sessionId: newId("cs_test"),
          amount: numberField(
            fields(payload),
            "amount",
            accountSeed.autoReload.amount,
          ),
        }),
      )
      .handle("retryAutoReload", () =>
        Effect.gen(function* () {
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            autoReload: {
              ...current.autoReload,
              attempts: current.autoReload.attempts + 1,
              lastAttemptAt: DateTime.formatIso(minutesAgo(0)),
              lastFailure: null,
            },
          }));
          return { ok: true, attempts: updated.autoReload.attempts };
        }),
      )
      .handle("purchaseCredits", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const credits = numberField(
            input,
            "credits",
            numberField(input, "amount", 5000),
          );
          const packId = stringField(
            input,
            "packId",
            stringField(input, "id", "credits_starter"),
          );
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            credits: current.credits + credits,
            customer: true,
            balance: {
              ...current.balance,
              grantedCredits: current.balance.grantedCredits + credits,
              remainingCredits: current.balance.remainingCredits + credits,
            },
          }));
          return {
            ok: true,
            packId,
            credits,
            balance: updated.credits,
            paymentIntentId: newId("pi"),
          };
        }),
      )
      .handle("cancelPlan", () =>
        Effect.gen(function* () {
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            cancelAtPeriodEnd: true,
            plans: current.plans.map((plan) => ({
              ...plan,
              canceledAt: DateTime.formatIso(minutesAgo(0)),
            })),
          }));
          return {
            ok: true,
            plan: updated.plan,
            status: updated.planStatus,
            cancelAtPeriodEnd: true,
            activeUntil: updated.currentPeriodEnd,
          };
        }),
      )
      .handle("confirmPlan", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const tierId = stringField(input, "tierId", "");
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            plan: stringField(input, "plan", current.plan),
            planStatus: "active",
            cancelAtPeriodEnd: false,
            customer: true,
            plans:
              tierId === ""
                ? current.plans
                : current.plans.map((plan) => ({
                    ...plan,
                    planId: tierId,
                    name: tierId,
                    canceledAt: null,
                  })),
          }));
          return {
            ok: true,
            plan: updated.plan,
            status: updated.planStatus,
            schedule: "immediate",
            introApplied: false,
            introUnavailable: false,
            paymentUrl: null,
          };
        }),
      )
      .handle("keepPlan", () =>
        Effect.gen(function* () {
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            cancelAtPeriodEnd: false,
            plans: current.plans.map((plan) => ({ ...plan, canceledAt: null })),
          }));
          return { ok: true, plan: updated.plan, status: updated.planStatus };
        }),
      )
      .handle("previewPlan", ({ payload }) =>
        Effect.succeed({
          plan: stringField(fields(payload), "plan", "Team"),
          amount: accountSeed.planAmount,
          currency: "usd",
          interval: accountSeed.planInterval,
          credits: accountSeed.credits,
          dueNow: accountSeed.planAmount,
          dueTodayCents: accountSeed.planAmount,
          nextCycleTotalCents: accountSeed.planAmount,
          introEligible: false,
        }),
      )
      .handle("openPortal", () =>
        Effect.succeed({
          url: "https://billing.example.com/portal",
          sessionId: newId("bps"),
        }),
      )
      .handle("updateReceipts", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            receipts: booleanField(input, "enabled", current.receipts),
            receiptEmail: stringField(input, "email", current.receiptEmail),
          }));
          return {
            ok: true,
            receipts: updated.receipts,
            email: updated.receiptEmail,
          };
        }),
      )
      .handle("createSetupIntent", () =>
        Effect.sync(() => {
          const id = newId("seti");
          return {
            id,
            setupIntentId: id,
            clientSecret: `${id}_secret`,
            publishableKey: "pk_test_sample",
            alreadySaved: false,
            status: "requires_payment_method",
          };
        }),
      )
      .handle("updateSponsoredPaidFallthrough", ({ payload }) =>
        Effect.gen(function* () {
          const enabled = booleanField(
            fields(payload),
            "enabled",
            accountSeed.sponsoredPaidFallthrough,
          );
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            sponsoredPaidFallthrough: enabled,
          }));
          return { ok: true, enabled: updated.sponsoredPaidFallthrough };
        }),
      )
      .handle("cancelSsoAddOn", () =>
        Effect.gen(function* () {
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            ssoAddOn: { ...current.ssoAddOn, status: "canceled" },
          }));
          return {
            ok: true,
            status: updated.ssoAddOn.status,
            activeUntil: updated.currentPeriodEnd,
          };
        }),
      )
      .handle("confirmSsoAddOn", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            ssoAddOn: {
              ...current.ssoAddOn,
              status: "active",
              amount: numberField(input, "amount", current.ssoAddOn.amount),
            },
          }));
          return {
            ok: true,
            status: updated.ssoAddOn.status,
            paymentUrl: null,
            requiredAction: null,
          };
        }),
      )
      .handle("keepSsoAddOn", () =>
        Effect.gen(function* () {
          const updated = yield* Ref.updateAndGet(account, (current) => ({
            ...current,
            ssoAddOn: { ...current.ssoAddOn, status: "active" },
          }));
          return { ok: true, status: updated.ssoAddOn.status };
        }),
      )
      .handle("previewSsoAddOn", () =>
        Effect.succeed({
          addOn: "Single sign-on",
          amount: accountSeed.ssoAddOn.amount,
          currency: "usd",
          interval: accountSeed.ssoAddOn.interval,
          dueNow: accountSeed.ssoAddOn.amount,
          dueTodayCents: accountSeed.ssoAddOn.amount,
        }),
      );
  }),
);
