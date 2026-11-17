import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { Button } from "@/primitives/button";
import {
  EmptyNotice,
  ErrorNotice,
  GridCell,
  GridHead,
  GridRow,
  GridRowGroup,
  GridTable,
  LoadingRows,
} from "./grid-table";
import { col, formatCredits } from "./model";
import type { Principal, UsageThreadPage } from "./types";

const _CHANNEL_LABELS: Record<string, string> = {
  thread: "Private thread",
  captain: "Private Captain",
  project: "Private project",
  owner: "Private work",
};

export function HistorySection({
  orgId,
  scope,
  order,
  principals,
}: {
  orgId: string;
  scope: Record<string, string>;
  order: "cost" | "activity" | "created";
  principals: Map<string, Principal>;
}) {
  const [page, setPage] = useState(1);
  const query = useMemo(
    () =>
      ApiClient.query("billing", "usageThreads", {
        params: { orgId },
        query: { ...scope, page: String(page), order },
        reactivityKeys: [`billing:${orgId}`],
        timeToLive: "1 minute",
      } as never),
    [orgId, page, order, scope],
  );
  const result = useAtomValue(query as never) as AsyncResult<
    UsageThreadPage,
    unknown
  >;
  const value = AsyncResult.isSuccess(result) ? result.value : undefined;
  if (value === undefined) {
    return AsyncResult.isFailure(result) ? (
      <ErrorNotice />
    ) : (
      <LoadingRows rows={4} />
    );
  }
  if (value.totalThreads === 0) {
    return <EmptyNotice>No threads in selected period</EmptyNotice>;
  }
  const columns = [
    "minmax(0,3fr)",
    "minmax(0,1.2fr)",
    ...(order === "created" ? [`minmax(${col(30)},auto)`] : []),
    `minmax(${col(30)},auto)`,
    `minmax(${col(30)},auto)`,
  ].join(" ");
  const first = (page - 1) * 20;

  return (
    <div className="flex flex-col gap-2">
      <GridTable columns={columns}>
        <GridRowGroup>
          <GridHead>Thread</GridHead>
          <GridHead>Member</GridHead>
          {order === "created" && <GridHead>Created</GridHead>}
          <GridHead>Last activity</GridHead>
          <GridHead>Spend</GridHead>
        </GridRowGroup>
        {value.items.map((item) => (
          <GridRow key={item.jamId}>
            <GridCell lead>
              <Link
                data-track-owner="features/settings/org-usage-page.tsx#HistorySection:Link.1"
                to="/thread/$threadId"
                params={{ threadId: item.jamId }}
                className="truncate text-sm font-medium text-foreground outline-none after:absolute after:inset-0 after:rounded focus-visible:after:outline-ring-inset"
              >
                {item.title ?? "Untitled thread"}
              </Link>
            </GridCell>
            <GridCell>
              {principals.get(item.principalUserId ?? "")?.name ??
                "Organization"}
            </GridCell>
            {order === "created" && (
              <GridCell>{item.createdAt.slice(0, 10)}</GridCell>
            )}
            <GridCell>{item.lastActivityAt.slice(0, 10)}</GridCell>
            <GridCell align="end" className="font-medium text-foreground">
              {formatCredits(item.totalCredits)}
            </GridCell>
          </GridRow>
        ))}
      </GridTable>
      {value.pageCount > 1 && (
        <div className="flex items-center justify-between px-4">
          <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
            Showing {first + 1}–{first + value.items.length} of{" "}
            {value.totalThreads}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              data-track-owner="features/settings/org-usage-page.tsx#HistorySection:Button[Previous]"
              size="xs"
              variant="ghost"
              disabled={value.page <= 1}
              onClick={() => setPage(value.page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
              Page {value.page} of {value.pageCount}
            </span>
            <Button
              data-track-owner="features/settings/org-usage-page.tsx#HistorySection:Button[Next]"
              size="xs"
              variant="ghost"
              disabled={value.page >= value.pageCount}
              onClick={() => setPage(value.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
