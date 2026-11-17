import { Button } from "@/primitives/button";
import { CustomRange } from "../custom-range";
import { routeLabel, type UsageQuery } from "./model";
import type { UsageRange } from "./types";

const PRESETS = [
  ["period", "Current period"],
  ["24h", "24h"],
  ["7d", "7d"],
  ["30d", "30d"],
] as const;

export function DateControls({
  search,
  set,
  routes,
  showScope,
}: {
  search: UsageQuery;
  range: UsageRange;
  set: (patch: Partial<UsageQuery>) => void;
  routes: ReadonlyArray<string>;
  showScope: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
      {(routes.length >= 2 || search.route !== undefined) && (
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
              {routeLabel(route)}
            </Button>
          ))}
        </>
      )}
      {showScope && (
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button[You]"
            size="xs"
            variant="ghost"
            data-selected={search.scope === "you" ? "" : undefined}
            onClick={() => set({ scope: "you" })}
          >
            You
          </Button>
          <Button
            data-track-owner="features/settings/org-usage-page.tsx#SettingsOrgUsagePage:Button[Team]"
            size="xs"
            variant="ghost"
            data-selected={search.scope === undefined ? "" : undefined}
            onClick={() => set({ scope: undefined })}
          >
            Team
          </Button>
        </div>
      )}
    </div>
  );
}
