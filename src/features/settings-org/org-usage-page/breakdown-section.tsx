import {
  EmptyNotice,
  ErrorNotice,
  GridCell,
  GridGroup,
  GridHead,
  GridRow,
  GridRowGroup,
  GridTable,
  LoadingRows,
} from "./grid-table";
import {
  col,
  formatCompact,
  formatCredits,
  formatShare,
  ROUTE_LABELS,
} from "./model";
import type { UsageBreakdownRoute } from "./types";

const totalTokens = (route: UsageBreakdownRoute) =>
  route.entries.reduce(
    (sum, entry) => sum + entry.tokens.inputTokens + entry.tokens.outputTokens,
    0,
  );

export function BreakdownSection({
  value,
  route,
}: {
  value: unknown;
  route?: string;
}) {
  const data = value as ReadonlyArray<UsageBreakdownRoute> | undefined;
  if (data === undefined) return <LoadingRows rows={3} />;
  if (data === null) return <ErrorNotice />;
  const routes = data.filter(
    (row) => route === undefined || row.route === route,
  );
  if (routes.length === 0) {
    return (
      <EmptyNotice>
        {route === undefined
          ? "No usage in selected period"
          : "No usage for this billing kind in selected period"}
      </EmptyNotice>
    );
  }
  const total = routes.reduce(
    (sum, row) => sum + row.credits + row.tokenFeeCredits,
    0,
  );
  const columns = [
    "minmax(0,3fr)",
    `minmax(${col(24)},auto)`,
    `minmax(${col(24)},auto)`,
    `minmax(${col(18)},auto)`,
  ].join(" ");

  return (
    <GridTable columns={columns}>
      <GridRowGroup>
        <GridHead>Item</GridHead>
        <GridHead>Spend</GridHead>
        <GridHead>Tokens</GridHead>
        <GridHead>Share</GridHead>
      </GridRowGroup>
      {routes.map((row) => {
        const tokens = totalTokens(row);
        return (
          <GridGroup key={row.route}>
            <GridCell lead className="font-medium text-foreground">
              {ROUTE_LABELS[row.route] ?? row.route}
            </GridCell>
            <GridCell align="end" className="text-foreground">
              {formatCredits(row.credits)}
            </GridCell>
            <GridCell align="end">
              {tokens === 0 ? "—" : formatCompact(tokens)}
            </GridCell>
            <GridCell align="end" className="text-foreground">
              {formatShare(row.credits, total)}
            </GridCell>
            {row.entries.map((entry) => (
              <GridRow key={entry.key}>
                <GridCell>{entry.label}</GridCell>
                <GridCell align="end">{formatCredits(entry.credits)}</GridCell>
                <GridCell align="end">
                  {formatCompact(
                    entry.tokens.inputTokens + entry.tokens.outputTokens,
                  )}
                </GridCell>
                <GridCell align="end">
                  {formatShare(entry.credits, total)}
                </GridCell>
              </GridRow>
            ))}
          </GridGroup>
        );
      })}
      <GridRow>
        <GridCell>Capy token fee</GridCell>
        <GridCell align="end" className="text-foreground">
          {formatCredits(
            routes.reduce((sum, row) => sum + row.tokenFeeCredits, 0),
          )}
        </GridCell>
        <GridCell align="end">—</GridCell>
        <GridCell align="end" className="text-foreground">
          {formatShare(
            routes.reduce((sum, row) => sum + row.tokenFeeCredits, 0),
            total,
          )}
        </GridCell>
      </GridRow>
    </GridTable>
  );
}
