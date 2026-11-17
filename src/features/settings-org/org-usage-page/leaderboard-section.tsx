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
import { col, formatCompact, formatCredits } from "./model";
import type { Principal, UsageMemberRow } from "./types";

const tokensOf = (row: UsageMemberRow) =>
  (row.tokens?.inputTokens ?? 0) + (row.tokens?.outputTokens ?? 0);

export function LeaderboardSection({
  value,
  principals,
  metric,
}: {
  value: unknown;
  principals: Map<string, Principal>;
  metric: "cost" | "tokens";
}) {
  const data = value as ReadonlyArray<UsageMemberRow> | undefined;
  if (data === undefined) return <LoadingRows rows={2} />;
  if (data === null) return <ErrorNotice />;
  if (data.length === 0) return <EmptyNotice>No usage this period</EmptyNotice>;

  const rows = [...data].sort((a, b) =>
    metric === "tokens"
      ? tokensOf(b) - tokensOf(a) || b.threads - a.threads
      : b.totalCredits - a.totalCredits,
  );
  const hasExternal = rows.some(
    (row) => row.subscriptionCredits + row.byokCredits > 0,
  );
  const columns =
    metric === "tokens"
      ? [
          "minmax(0,3fr)",
          `minmax(${col(18)},auto)`,
          `minmax(${col(18)},auto)`,
          `minmax(${col(21)},auto)`,
          `minmax(${col(15)},auto)`,
          `minmax(${col(24)},auto)`,
        ].join(" ")
      : [
          "minmax(0,3fr)",
          `minmax(${col(18)},auto)`,
          `minmax(${col(18)},auto)`,
          ...(hasExternal ? [`minmax(${col(18)},auto)`] : []),
          `minmax(${col(15)},auto)`,
          `minmax(${col(21)},auto)`,
        ].join(" ");

  return (
    <GridTable columns={columns}>
      <GridRowGroup>
        <GridHead>Member</GridHead>
        {metric === "tokens" ? (
          <>
            <GridHead>Input</GridHead>
            <GridHead>Output</GridHead>
            <GridHead>Cache read</GridHead>
            <GridHead>Threads</GridHead>
            <GridHead>Total tokens</GridHead>
          </>
        ) : (
          <>
            <GridHead>Models</GridHead>
            <GridHead>Machines</GridHead>
            {hasExternal && <GridHead>Sub/BYOK</GridHead>}
            <GridHead>Threads</GridHead>
            <GridHead>Total billed</GridHead>
          </>
        )}
      </GridRowGroup>
      {rows.map((row) => {
        const principal =
          row.principalUserId === null
            ? undefined
            : principals.get(row.principalUserId);
        return (
          <GridRow key={row.principalUserId ?? "org"}>
            <GridCell lead>
              {principal ? (
                <span className="truncate">{principal.name}</span>
              ) : (
                <span className="truncate font-medium text-muted-foreground-1">
                  {row.principalUserId ?? "Organization"}
                </span>
              )}
            </GridCell>
            {metric === "tokens" ? (
              <>
                <GridCell align="end">
                  {formatCompact(row.tokens?.inputTokens ?? 0)}
                </GridCell>
                <GridCell align="end">
                  {formatCompact(row.tokens?.outputTokens ?? 0)}
                </GridCell>
                <GridCell align="end">
                  {formatCompact(row.tokens?.cacheReadTokens ?? 0)}
                </GridCell>
                <GridCell align="end">{row.threads}</GridCell>
                <GridCell align="end" className="font-medium text-foreground">
                  {tokensOf(row) === 0 ? "—" : formatCompact(tokensOf(row))}
                </GridCell>
              </>
            ) : (
              <>
                <GridCell
                  align="end"
                  className={
                    row.llmCredits === 0 ? "text-muted-foreground-3" : ""
                  }
                >
                  {formatCredits(row.llmCredits)}
                </GridCell>
                <GridCell
                  align="end"
                  className={
                    row.vmCredits === 0 ? "text-muted-foreground-3" : ""
                  }
                >
                  {formatCredits(row.vmCredits)}
                </GridCell>
                {hasExternal && (
                  <GridCell
                    align="end"
                    className={
                      row.subscriptionCredits + row.byokCredits === 0
                        ? "text-muted-foreground-3"
                        : ""
                    }
                  >
                    {formatCredits(row.subscriptionCredits + row.byokCredits)}
                  </GridCell>
                )}
                <GridCell align="end">{row.threads}</GridCell>
                <GridCell align="end" className="font-medium text-foreground">
                  {formatCredits(row.totalCredits)}
                </GridCell>
              </>
            )}
          </GridRow>
        );
      })}
    </GridTable>
  );
}
