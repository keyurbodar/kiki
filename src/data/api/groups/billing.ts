import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { Undecoded, UndecodedQuery } from "../undecoded.ts";

export class BillingGroup extends HttpApiGroup.make("billing").add(
  HttpApiEndpoint.get("get", "/orgs/:orgId/billing", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("updateAutoReload", "/orgs/:orgId/billing/auto-reload", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "openAutoReloadPayment",
    "/orgs/:orgId/billing/auto-reload/payment",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "retryAutoReload",
    "/orgs/:orgId/billing/auto-reload/retry",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("catalog", "/orgs/:orgId/billing/catalog", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("purchaseCredits", "/orgs/:orgId/billing/credits", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("listInvoices", "/orgs/:orgId/billing/invoices", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("cancelPlan", "/orgs/:orgId/billing/plan/cancel", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("confirmPlan", "/orgs/:orgId/billing/plan/confirm", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("keepPlan", "/orgs/:orgId/billing/plan/keep", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post("previewPlan", "/orgs/:orgId/billing/plan/preview", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("openPortal", "/orgs/:orgId/billing/portal", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post("updateReceipts", "/orgs/:orgId/billing/receipts", {
    params: { orgId: Schema.String },
    payload: Undecoded,
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "createSetupIntent",
    "/orgs/:orgId/billing/setup-intent",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.put(
    "updateSponsoredPaidFallthrough",
    "/orgs/:orgId/billing/sponsored-paid-fallthrough",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post(
    "cancelSsoAddOn",
    "/orgs/:orgId/billing/sso-add-on/cancel",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  HttpApiEndpoint.post(
    "confirmSsoAddOn",
    "/orgs/:orgId/billing/sso-add-on/confirm",
    {
      params: { orgId: Schema.String },
      payload: Undecoded,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.post("keepSsoAddOn", "/orgs/:orgId/billing/sso-add-on/keep", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.post(
    "previewSsoAddOn",
    "/orgs/:orgId/billing/sso-add-on/preview",
    { params: { orgId: Schema.String }, success: Undecoded },
  ),
  /**
   * Contract note — `machineHourAllowance` and `machineHoursConsumed` are
   * kiki-only, mock-only fields. They are the org's machine-hour allowance and
   * the machine hours already spent against it, plain numbers in the same unit
   * as the per-thread `machineHours`. Capy has no endpoint or field that
   * carries them; kiki serves them from `mocks/billing/fixtures.ts` so the
   * automation Limits row can print Capy's usage line. Do not treat them as a
   * shipped part of this payload: a real backend will omit them, and every
   * reader treats them as optional. Delete this note and the mock fields when
   * an endpoint exists.
   */
  HttpApiEndpoint.get("usage", "/orgs/:orgId/billing/usage", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "usageBreakdown",
    "/orgs/:orgId/billing/usage/breakdown",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("usageHeatmap", "/orgs/:orgId/billing/usage/heatmap", {
    params: { orgId: Schema.String },
    success: Undecoded,
  }),
  HttpApiEndpoint.get(
    "usageLeaderboard",
    "/orgs/:orgId/billing/usage/leaderboard",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get(
    "usageMemberEntries",
    "/orgs/:orgId/billing/usage/member-entries",
    {
      params: { orgId: Schema.String },
      query: UndecodedQuery,
      success: Undecoded,
    },
  ),
  HttpApiEndpoint.get("usageSeries", "/orgs/:orgId/billing/usage/series", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
  HttpApiEndpoint.get("usageThreads", "/orgs/:orgId/billing/usage/threads", {
    params: { orgId: Schema.String },
    query: UndecodedQuery,
    success: Undecoded,
  }),
) {}
