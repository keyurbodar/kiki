import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";
import { queryTimeToLive, reactivityKeys } from "@/data/atoms/conventions";

export const surfaceDefaultModelAtom = Atom.family((surface: string) =>
  ApiClient.query("organizations", "surfaceDefaultModel", {
    params: { orgId: "org_sample_acme", surface },
    reactivityKeys: ["surface_default_model"],
    timeToLive: queryTimeToLive,
  }),
);

export const setSurfaceDefaultModelAtom = ApiClient.mutation(
  "organizations",
  "setSurfaceDefaultModel",
);

export const orgDefaultModelAtom = ApiClient.query("organizations", "get", {
  params: { orgId: "org_sample_acme" },
  reactivityKeys: [reactivityKeys.organizations],
  timeToLive: queryTimeToLive,
});

export const setOrgDefaultModelAtom = ApiClient.mutation(
  "organizations",
  "setDefaultModel",
);

export const modelsCatalogAtom = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: ["model_catalog"],
  timeToLive: queryTimeToLive,
});

export const updatePreferencesAtom = ApiClient.mutation(
  "users",
  "updatePreferences",
);
