import { AsyncResult, Atom } from "effect/reactivity";
import type { ListingKind } from "../api/schemas/explore.ts";
import { ApiClient } from "../client/ApiClient.ts";

export const listingReactivityKey = (orgId: string) => `listing:${orgId}`;
export const volumeReactivityKey = (orgId: string) => `volume:${orgId}`;

export const listingDetailKey = (kind: ListingKind, slug: string) =>
  `${kind}:${slug}`;

export const listingDetailAtom = Atom.family((key: string) => {
  const [kind, slug] = key.split(":") as [ListingKind, string];
  return ApiClient.query("explorePublic", "listing", {
    params: { kind, slug },
    timeToLive: "5 minutes",
  });
});

export const orgListingsAtom = Atom.family((orgId: string) =>
  ApiClient.query("explore", "listings", {
    params: { orgId },
    query: {},
    reactivityKeys: [listingReactivityKey(orgId)],
    timeToLive: "1 minute",
  }),
);

/** The listing index while the org is still resolving. */
export const idleOrgListingsAtom: ReturnType<typeof orgListingsAtom> =
  Atom.make(AsyncResult.initial(false)) as ReturnType<typeof orgListingsAtom>;

export const reportListingAtom = ApiClient.mutation("explore", "report");

export const addSkillAtom = ApiClient.mutation("explore", "addSkill");
