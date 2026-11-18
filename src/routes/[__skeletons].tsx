import { createFileRoute, notFound } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { SharePanel } from "@/components/share-popover/share-panel";
import { exploreGridClassName } from "@/features/explore/explore-page";
import { CycleHeader } from "@/features/settings-org/org-usage-page/cycle-header";
import { type ListingCard, ListingRow } from "@/features/explore/listing-card";
import { Button } from "@/primitives/button";
import { Skeleton } from "@/primitives/skeleton";
import { applyColorMode, type ColorMode } from "@/tokens/theme";

/**
 * The measured skeleton, on one page, so it can be driven and measured: the
 * same ListingRow grid the Explore Skills page renders, held in its loading
 * state and released into content. Colours come from the --skullet-* tokens,
 * so this page also proves the token theming on both colour modes.
 */

type Search = { mode: ColorMode };

export const Route = createFileRoute("/__skeletons")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: SkeletonsHarness,
});

const sampleCard = (
  slug: string,
  displayName: string,
  description: string,
  stars: number,
): ListingCard => ({
  kind: "skill",
  source: "catalog",
  slug,
  displayName,
  description,
  maker: null,
  builtIn: null,
  repository: null,
  stars,
  starsCheckedAt: null,
  adds: null,
  theme: null,
});

const sampleCards: ReadonlyArray<ListingCard> = [
  sampleCard(
    "deploy-from-issue",
    "Deploy from the issue list",
    "Ship a branch from a Linear issue",
    128,
  ),
  sampleCard(
    "nightly-audit",
    "Nightly dependency audit",
    "Opens a PR when a lockfile drifts",
    964,
  ),
  sampleCard(
    "release-notes",
    "Release notes drafter",
    "Summarizes merged PRs into a changelog",
    42,
  ),
  sampleCard(
    "flaky-quarantine",
    "Flaky test quarantine",
    "Marks a test flaky after three failures",
    210,
  ),
  sampleCard(
    "branch-sweeper",
    "Branch sweeper",
    "Deletes merged branches on a schedule",
    64,
  ),
  sampleCard(
    "review-roulette",
    "Review roulette",
    "Picks a reviewer who owes the team one",
    517,
  ),
];

const cycleSummary = {
  period: { start: "2026-11-01T00:00:00Z", end: "2026-12-01T00:00:00Z" },
  balance: { unlimited: false, remainingCredits: 12_500 },
  included: [],
  machineHourAllowance: null,
  machineHoursConsumed: null,
};

function SkeletonsHarness() {
  const { mode } = Route.useSearch();
  useLayoutEffect(() => applyColorMode(mode), [mode]);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          variant={loaded ? "outline" : "solid"}
          size="sm"
          onClick={() => setLoaded(false)}
        >
          loading
        </Button>
        <Button
          type="button"
          variant={loaded ? "solid" : "outline"}
          size="sm"
          onClick={() => setLoaded(true)}
        >
          loaded
        </Button>
      </div>
      <div style={{ margin: "0 auto", width: "100%", maxWidth: 800 }}>
        <Skeleton
          data={loaded ? sampleCards : null}
          sample={sampleCards}
          id="skeletons-harness"
          label="Loading skills"
        >
          {(cards) => (
            <div className={exploreGridClassName}>
              {cards.map((card) => (
                <ListingRow key={card.slug} card={card} />
              ))}
            </div>
          )}
        </Skeleton>
      </div>
      <div
        data-specimen="cycle-header"
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        <CycleHeader
          now={new Date(Date.UTC(2026, 10, 18))}
          summary={loaded ? cycleSummary : undefined}
        />
      </div>
      <div
        data-specimen="share-panel"
        style={{ margin: "0 auto", width: "100%", maxWidth: 420 }}
      >
        <SharePanel
          share={
            loaded
              ? {
                  id: "share_harness",
                  url: "https://capy.ai/s/harness-shared-link",
                  visibility: "public",
                  createdBy: null,
                  manageable: true,
                }
              : undefined
          }
          pending={false}
          removing={false}
          onVisibility={() => undefined}
          onRemove={() => undefined}
        />
      </div>
    </div>
  );
}
