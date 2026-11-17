import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useMemo, useState } from "react";
import { Button } from "@/primitives/button";
import type { UsageScope } from "./data";
import { decodeUsageThreadPage, usageThreadsAtom } from "./data";
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
import { col, formatCredits, loadResult } from "./model";
import type { Principal } from "./types";

const day = (value: string) => (value === "" ? "—" : value.slice(0, 10));

export function HistorySection({
  scopeKey,
  order,
  principals,
}: {
  scopeKey: string;
  order: "cost" | "activity" | "created";
  principals: Map<string, Principal>;
}) {
  const [page, setPage] = useState(1);
  const key = useMemo(() => {
    const { orgId, scope } = JSON.parse(scopeKey) as {
      orgId: string;
      scope: UsageScope;
    };
    return JSON.stringify({
      orgId,
      scope: { ...scope, page: String(page), order },
    });
  }, [scopeKey, page, order]);
  const result = useAtomValue(usageThreadsAtom(key));
  const raw = loadResult(result);
  if (raw === undefined) {
    return AsyncResult.isFailure(result) ? <ErrorNotice /> : <LoadingRows />;
  }
  const value = decodeUsageThreadPage(raw);

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
          {order === "created" && <GridHead sorted>Created</GridHead>}
          <GridHead sorted={order === "activity"}>Last activity</GridHead>
          <GridHead sorted={order === "cost"} align="end">
            Spend
          </GridHead>
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
              <span className="truncate">
                {principals.get(item.principalUserId ?? "")?.name ??
                  "Organization"}
              </span>
            </GridCell>
            {order === "created" && <GridCell>{day(item.createdAt)}</GridCell>}
            <GridCell>{day(item.lastActivityAt)}</GridCell>
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
