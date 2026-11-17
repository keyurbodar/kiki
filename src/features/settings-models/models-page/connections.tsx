import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import type { ReactNode } from "react";
import { Card, CardListHeader } from "@/primitives/card";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import {
  catalogAtom,
  decodeCatalog,
  decodeRouting,
  routingAtom,
  useOrgId,
} from "../model-routing";
import type { CatalogEntry, ModelsRouting } from "../model-routing/types";

/** Capy's card chrome; the Card primitive is still a bare stub. */
export const cardChrome =
  "flex flex-col bg-card rounded-(--radius-card) border-hairline border-(--card-hairline) shadow-card";

export type RoutingData = {
  admin: boolean;
  routing: ModelsRouting | undefined;
  catalog: ReadonlyArray<CatalogEntry>;
};

/** The routing snapshot, the catalog and admin state every models section reads. */
export function useRoutingData(): RoutingData {
  const orgId = useOrgId() ?? "";
  const routingResult = useAtomValue(routingAtom(orgId));
  const catalogResult = useAtomValue(catalogAtom);
  return {
    admin:
      AsyncResult.isSuccess(routingResult) &&
      decodeRouting(routingResult.value)?.admin === true,
    routing: AsyncResult.isSuccess(routingResult)
      ? decodeRouting(routingResult.value)
      : undefined,
    catalog: AsyncResult.isSuccess(catalogResult)
      ? decodeCatalog(catalogResult.value)
      : [],
  };
}

export function LoadingConnections({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <SkeletonPanel className="h-4 w-2/3" />
      <SkeletonPanel className="h-4 w-1/2" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Capy's card with a list header: the count on the left, an add button on the right. */
export function ConnectionsCard({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className={`${cardChrome} overflow-visible`}>
      <CardListHeader className="flex min-h-15 items-center justify-between gap-3 border-b-hairline border-border-1 py-3 pr-2 pl-4">
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {label}
        </span>
        {action !== undefined && (
          <div className="flex shrink-0 items-center gap-0.5">{action}</div>
        )}
      </CardListHeader>
      {children}
    </Card>
  );
}
