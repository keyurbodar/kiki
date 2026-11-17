import {
  EmptyNotice,
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

const column = (units: number) => `minmax(${col(units)},auto)`;

export function LeaderboardSection({
  value,
  principals,
  metric,
}: {
  value: ReadonlyArray<UsageMemberRow> | undefined;
  principals: Map<string, Principal>;
  metric: "cost" | "tokens";
}) {
  if (value === undefined) return <LoadingRows rows={2} />;
  if (value.length === 0)
    return <EmptyNotice>No usage this period</EmptyNotice>;

  const rows = [...value].sort((a, b) =>
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
          column(18),
          column(18),
          column(21),
          column(15),
          column(24),
        ].join(" ")
      : [
          "minmax(0,3fr)",
          column(18),
          column(18),
          ...(hasExternal ? [column(18)] : []),
          column(15),
          column(21),
        ].join(" ");

  return (
    <GridTable columns={columns}>
      <GridRowGroup>
        <GridHead>Member</GridHead>
        {metric === "tokens" ? (
          <>
            <GridHead align="end">Input</GridHead>
            <GridHead align="end">Output</GridHead>
            <GridHead align="end">Cache read</GridHead>
            <GridHead align="end">Threads</GridHead>
            <GridHead align="end">Total tokens</GridHead>
          </>
        ) : (
          <>
            <GridHead align="end">Models</GridHead>
            <GridHead align="end">Machines</GridHead>
            {hasExternal && <GridHead align="end">Sub/BYOK</GridHead>}
            <GridHead align="end">Threads</GridHead>
            <GridHead align="end" sorted>
              Total billed
            </GridHead>
          </>
        )}
      </GridRowGroup>
      {rows.map((row) => {
        const principal =
          row.principalUserId === null
            ? undefined
            : principals.get(row.principalUserId);
        const name =
          principal?.name ?? row.name ?? row.principalUserId ?? "Organization";
        return (
          <GridRow key={row.principalUserId ?? "org"}>
            <GridCell lead>
              <span className="truncate">{name}</span>
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
