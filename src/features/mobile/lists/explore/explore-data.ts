import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { useMobileQuery } from "../mobile-query";

export type MobileListing = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly verified: boolean;
  readonly iconUrl: string | null;
};

const marketplaceAtom = Atom.family((orgId: string) =>
  ApiClient.query("plugins", "listMarketplace", {
    params: { orgId },
    reactivityKeys: [`mobile-explore:${orgId}`],
    timeToLive: "5 minutes",
  }),
);

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown) =>
  typeof value === "string" ? value : undefined;

export function useMobileExplore() {
  const organizations = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(organizationsAtom)),
  );
  const orgId = organizations?.[0]?.id;
  const { result, waiting } = useMobileQuery(
    marketplaceAtom(orgId ?? ""),
    orgId === undefined,
  );
  const listings = AsyncResult.value(result);
  const rows = (Array.isArray(listings) ? listings : []).flatMap((value) => {
    const item = record(value);
    const id = text(item.id) ?? text(item.key);
    const name = text(item.displayName) ?? text(item.name);
    if (id === undefined || name === undefined) return [];
    return [
      {
        id,
        name,
        description: text(item.description) ?? "",
        category: text(item.category) ?? "other",
        verified: item.verified === true,
        iconUrl: text(item.iconUrl) ?? null,
      },
    ];
  });
  return { rows, waiting };
}
