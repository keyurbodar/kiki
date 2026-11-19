import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

export const billingReactivityKeys = (orgId: string) => [`billing:${orgId}`];

export const billingAtom = Atom.family((orgId: string) =>
  ApiClient.query("billing", "get", {
    params: { orgId },
    reactivityKeys: billingReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

/**
 * The billing read a shell makes while its org is still resolving. Asking with
 * an empty id is `GET /orgs//billing`, which fails, and a failed read costs the
 * shell a full hash of the error's request graph; there is nothing to read yet.
 */
export const idleBillingAtom: ReturnType<typeof billingAtom> = Atom.make(
  AsyncResult.success(undefined as never),
);

export const billingInvoicesAtom = Atom.family((orgId: string) =>
  ApiClient.query("billing", "listInvoices", {
    params: { orgId },
    query: {},
    reactivityKeys: billingReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const billingCatalogAtom = Atom.family((orgId: string) =>
  ApiClient.query("billing", "catalog", {
    params: { orgId },
    reactivityKeys: billingReactivityKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const orgMembersAtom = Atom.family((orgId: string) =>
  ApiClient.query("members", "listMembers", {
    params: { orgId },
    query: {},
    reactivityKeys: [`members:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const cancelPlanAtom = ApiClient.mutation("billing", "cancelPlan");
export const confirmPlanAtom = ApiClient.mutation("billing", "confirmPlan");
export const keepPlanAtom = ApiClient.mutation("billing", "keepPlan");
export const previewPlanAtom = ApiClient.mutation("billing", "previewPlan");
export const createSetupIntentAtom = ApiClient.mutation(
  "billing",
  "createSetupIntent",
);
export const purchaseCreditsAtom = ApiClient.mutation(
  "billing",
  "purchaseCredits",
);
export const openBillingPortalAtom = ApiClient.mutation(
  "billing",
  "openPortal",
);
export const updateAutoReloadAtom = ApiClient.mutation(
  "billing",
  "updateAutoReload",
);
export const retryAutoReloadAtom = ApiClient.mutation(
  "billing",
  "retryAutoReload",
);
export const openAutoReloadPaymentAtom = ApiClient.mutation(
  "billing",
  "openAutoReloadPayment",
);
export const updateReceiptsAtom = ApiClient.mutation(
  "billing",
  "updateReceipts",
);
export const updateSponsoredPaidFallthroughAtom = ApiClient.mutation(
  "billing",
  "updateSponsoredPaidFallthrough",
);
export const previewSsoAddOnAtom = ApiClient.mutation(
  "billing",
  "previewSsoAddOn",
);
export const confirmSsoAddOnAtom = ApiClient.mutation(
  "billing",
  "confirmSsoAddOn",
);
export const cancelSsoAddOnAtom = ApiClient.mutation(
  "billing",
  "cancelSsoAddOn",
);
export const keepSsoAddOnAtom = ApiClient.mutation("billing", "keepSsoAddOn");
