import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";

export const surfaceDefaultModelKey = (orgId: string, surface: string) =>
  `${orgId}/${surface}`;

const surfaceDefaultModelQuery = Atom.family((key: string) => {
  const slash = key.indexOf("/");
  return ApiClient.query("organizations", "surfaceDefaultModel", {
    params: { orgId: key.slice(0, slash), surface: key.slice(slash + 1) },
    reactivityKeys: ["surface_default_model"],
    timeToLive: queryTimeToLive,
  });
});

export const surfaceDefaultModelAtom = (orgId: string, surface: string) =>
  surfaceDefaultModelQuery(surfaceDefaultModelKey(orgId, surface));

export const setSurfaceDefaultModelAtom = ApiClient.mutation(
  "organizations",
  "setSurfaceDefaultModel",
);

export const setOrgDefaultModelAtom = ApiClient.mutation(
  "organizations",
  "setDefaultModel",
);

/** The model catalog every picker and the compact-at table read from. */
export const modelsCatalogAtom = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: ["model_catalog"],
  timeToLive: queryTimeToLive,
});

export const updatePreferencesAtom = ApiClient.mutation(
  "users",
  "updatePreferences",
);
