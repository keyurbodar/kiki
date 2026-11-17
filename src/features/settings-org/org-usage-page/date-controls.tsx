import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { CustomRange } from "../custom-range";
import { formatRangeLabel, type UsageQuery } from "./model";
import type { UsageRange } from "./types";

const PRESETS = [
  ["period", "Current period"],
  ["24h", "24h"],
  ["7d", "7d"],
  ["30d", "30d"],
] as const;

const ROUTE_LABELS: Record<string, string> = {
  paid: "Billed",
  byok: "BYOK",
  subscription: "Subscription",
  allowance: "OSS allowance",
  internal: "Internal",
  no_charge: "No charge",
};

export function DateControls({
  search,
  range,
  set,
  routes,
}: {
  search: UsageQuery;
  range: UsageRange;
  set: (patch: Partial<UsageQuery>) => void;
  routes: ReadonlyArray<string>;
}) {
  return (
    <>
      <Card className="flex-row items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium text-foreground">
          {formatRangeLabel(range.from, range.to, range.timeZone)}
        </span>
      </Card>
      <Card>
        <div className="flex flex-wrap items-center gap-1.5 p-2">
          {PRESETS.map(([preset, label]) => (
            <Button
              key={preset}
              data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button.1"
              size="xs"
              variant="ghost"
              data-selected={search.preset === preset ? "" : undefined}
              onClick={() => set({ preset, from: undefined, to: undefined })}
            >
              {label}
            </Button>
          ))}
          <CustomRange
            selected={search.preset === "custom"}
            from={search.from}
            to={search.to}
            onApply={(from, to) => set({ preset: "custom", from, to })}
          />
          {routes.length >= 2 && (
            <>
              <span className="mx-1 h-3 w-px bg-border-2" />
              {routes.map((route) => (
                <Button
                  key={route}
                  data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button.2"
                  size="xs"
                  variant="ghost"
                  data-selected={search.route === route ? "" : undefined}
                  onClick={() =>
                    set({ route: search.route === route ? undefined : route })
                  }
                >
                  {ROUTE_LABELS[route] ?? route}
                </Button>
              ))}
            </>
          )}
        </div>
      </Card>
    </>
  );
}
