import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import { type ListingKind, listingKey } from "@/data/api/schemas/explore";
import { idleOrgListingsAtom, orgListingsAtom } from "@/data/atoms/explore";

export type AddedListing = {
  kind: ListingKind;
  slug: string;
  versionId: string | null;
};

export const versionedKey = (listing: AddedListing) =>
  `${listingKey(listing)}@${listing.versionId ?? ""}`;

export const unversionedKey = (key: string) =>
  key.slice(0, key.lastIndexOf("@"));

export const recentlyAddedAtom = Atom.make<
  Readonly<Record<string, ReadonlyArray<string>>>
>({}).pipe(Atom.keepAlive);

export const recordAdded = (
  recent: Readonly<Record<string, ReadonlyArray<string>>>,
  orgId: string,
  listings: ReadonlyArray<AddedListing>,
) => {
  const keys = new Set(listings.map(listingKey));
  return {
    ...recent,
    [orgId]: [
      ...(recent[orgId] ?? []).filter((key) => !keys.has(unversionedKey(key))),
      ...listings.map(versionedKey),
    ],
  };
};

export function useRecordAdded(orgId: string | undefined) {
  const setRecent = useAtomSet(recentlyAddedAtom);
  const refreshIndex = useAtomRefresh(
    orgId === undefined ? idleOrgListingsAtom : orgListingsAtom(orgId),
  );
  return (listings: ReadonlyArray<AddedListing>) => {
    if (orgId === undefined) return;
    setRecent((recent) => recordAdded(recent, orgId, listings));
    refreshIndex();
  };
}
