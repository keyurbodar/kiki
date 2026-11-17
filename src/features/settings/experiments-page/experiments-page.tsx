import { useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  InheritedMenu,
  InheritedMenuTrigger,
} from "@/primitives/inherited-menu";
import { MenuContent, MenuItem } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  type Experiment,
  type ExperimentChoice,
  type ExperimentFeature,
  effectiveChoice,
  experimentOptions,
  experimentRowId,
  featureCatalog,
  membersSummary,
  pausedNote,
} from "./feature-catalog";
import {
  sampleExperiments,
  sampleMembers,
  sampleOrganization,
} from "./fixtures";

type Scope = "you" | "org";

const pausedFeatures = new Set<ExperimentFeature>();
const isPaused = (feature: ExperimentFeature) => pausedFeatures.has(feature);

export function ExperimentsPage() {
  const [scope, setScope] = useState<Scope>("you");
  const [experiments, setExperiments] = useState(sampleExperiments);
  return (
    <SettingsPage
      title="Experiments"
      description="Try features before they ship"
    >
      {/* biome-ignore lint/a11y/useSemanticElements: Capy renders this scope switch as a div with role group */}
      <div
        className="-mx-2 flex gap-1"
        role="group"
        aria-label="Settings scope"
      >
        <Button
          variant="ghost"
          size="sm"
          data-selected={scope === "you" ? "" : undefined}
          aria-pressed={scope === "you"}
          onClick={() => setScope("you")}
        >
          You
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-selected={scope === "org" ? "" : undefined}
          aria-pressed={scope === "org"}
          onClick={() => setScope("org")}
        >
          Org
        </Button>
      </div>
      {scope === "you" ? (
        <YouSection experiments={experiments} />
      ) : (
        <OrgSection experiments={experiments} onChange={setExperiments} />
      )}
    </SettingsPage>
  );
}

function YouSection({ experiments }: { experiments: Experiment[] }) {
  const [own, setOwn] = useState<
    Partial<Record<ExperimentFeature, ExperimentChoice>>
  >({});
  return (
    <SettingsSection
      title="Available to you"
      description="Each one is off until you turn it on"
    >
      <Card rows>
        {experiments.map((experiment) => {
          const { feature } = experiment;
          const entry = featureCatalog[feature];
          const paused = isPaused(feature);
          const current = effectiveChoice(
            paused ? "off" : own[feature],
            experiment.orgEnabled,
          );
          return (
            <SettingsRow
              key={feature}
              id={experimentRowId(feature)}
              label={entry.label}
              description={
                paused ? (
                  <>
                    <span>{entry.description}</span>
                    <span className="block text-xs text-muted-foreground-2">
                      {pausedNote}
                    </span>
                  </>
                ) : (
                  entry.description
                )
              }
            >
              <InheritedMenu>
                <InheritedMenuTrigger
                  disabled={paused}
                  aria-label={entry.label}
                  render={<Button size="sm" className="w-32 justify-between" />}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{current.label}</span>
                    {current.inherited && (
                      <span className="shrink-0 text-xs text-muted-foreground-2">
                        Org
                      </span>
                    )}
                  </span>
                </InheritedMenuTrigger>
                <MenuContent align="end">
                  <MenuItem
                    onClick={() =>
                      setOwn((prev) => {
                        const next = { ...prev };
                        delete next[feature];
                        return next;
                      })
                    }
                  >
                    Org default
                  </MenuItem>
                  {experimentOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      onClick={() =>
                        setOwn((prev) => ({ ...prev, [feature]: option.value }))
                      }
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuContent>
              </InheritedMenu>
            </SettingsRow>
          );
        })}
      </Card>
    </SettingsSection>
  );
}

function OrgSection({
  experiments,
  onChange,
}: {
  experiments: Experiment[];
  onChange: (next: Experiment[]) => void;
}) {
  const { name, isAdmin } = sampleOrganization;
  return (
    <SettingsSection
      title={`Available to ${name}`}
      description="On turns an experiment on for every member by default"
    >
      <Card rows>
        {experiments.map((experiment) => {
          const { feature } = experiment;
          const entry = featureCatalog[feature];
          const members = sampleMembers.find((m) => m.feature === feature);
          return (
            <SettingsRow
              key={feature}
              label={entry.label}
              description={
                <>
                  <span>{entry.description}</span>
                  {isPaused(feature) ? (
                    <span className="block text-xs text-muted-foreground-2">
                      {pausedNote}
                    </span>
                  ) : (
                    members !== undefined && (
                      <span className="block text-xs text-muted-foreground-2">
                        {membersSummary(members)}
                      </span>
                    )
                  )}
                </>
              }
            >
              <Switch
                checked={experiment.orgEnabled}
                disabled={!isAdmin || isPaused(feature)}
                aria-label={entry.label}
                onCheckedChange={(orgEnabled) =>
                  onChange(
                    experiments.map((e) =>
                      e.feature === feature ? { ...e, orgEnabled } : e,
                    ),
                  )
                }
              />
            </SettingsRow>
          );
        })}
      </Card>
    </SettingsSection>
  );
}
