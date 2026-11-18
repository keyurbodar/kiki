import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { formatBytes } from "@/components/directory-view/format-bytes";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import type { ProjectSetup } from "@/data/api/schemas/project-settings";
import {
  projectAtom,
  projectKey,
  projectMutations,
  projectSettingsKeys,
  projectSetupAtom,
  snapshotBuildsAtom,
  snapshotConfigAtom,
} from "@/data/atoms/project-settings";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { CardEmpty, CardList, StatusDot } from "../shared/card-list";
import { formatDuration, formatRelative } from "../shared/relative-time";
import { useActiveOrgId } from "../shared/use-org";

export function ProjectDevEnvironmentPage() {
  const { projectId } = useParams({
    from: "/_app/settings/projects_/$projectId_/dev-environment",
  });
  const orgId = useActiveOrgId();
  return (
    <SettingsPage
      title="Setup & snapshot"
      description="Install, update, and startup scripts per repository, baked into a snapshot"
    >
      {orgId === undefined ? (
        <SettingsLoadingCard />
      ) : (
        <DevEnvironmentSettings orgId={orgId} projectId={projectId} />
      )}
    </SettingsPage>
  );
}

function DevEnvironmentSettings({
  orgId,
  projectId,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
}) {
  const key = projectKey(orgId, projectId);
  const projectResult = useAtomValue(projectAtom(key));
  const setupResult = useAtomValue(projectSetupAtom(key));
  const snapshotResult = useAtomValue(snapshotConfigAtom(key));
  const buildsResult = useAtomValue(snapshotBuildsAtom(key));
  const [starting, setStarting] = useState(false);

  const setSnapshotEnabled = useAtomSet(projectMutations.setSnapshotEnabled, {
    mode: "promise",
  });
  const replaceSnapshotRepos = useAtomSet(
    projectMutations.replaceSnapshotRepos,
    { mode: "promise" },
  );
  const setSmallerTiers = useAtomSet(projectMutations.setSnapshotSmallerTiers, {
    mode: "promise",
  });
  const startBuild = useAtomSet(projectMutations.startSnapshotBuild, {
    mode: "promise",
  });

  const project = AsyncResult.isSuccess(projectResult)
    ? projectResult.value
    : undefined;
  const setup = AsyncResult.isSuccess(setupResult)
    ? setupResult.value
    : undefined;
  const snapshot = AsyncResult.isSuccess(snapshotResult)
    ? snapshotResult.value
    : undefined;
  const builds = AsyncResult.isSuccess(buildsResult)
    ? buildsResult.value
    : undefined;
  const keys = [projectSettingsKeys.snapshot(orgId, projectId)];

  const toggleRepo = (repoFullName: string, included: boolean) => {
    if (snapshot === undefined) return;
    const repos = included
      ? [...snapshot.repos, repoFullName]
      : snapshot.repos.filter((repo) => repo !== repoFullName);
    replaceSnapshotRepos({
      params: { orgId, projectId },
      payload: { repos },
      reactivityKeys: keys,
    }).catch(() => toast.error("Could not update the snapshot repositories"));
  };

  const buildNow = () => {
    setStarting(true);
    startBuild({
      params: { orgId, projectId },
      payload: {},
      reactivityKeys: keys,
    })
      .then(() => toast.success("Build started"))
      .catch(() => toast.error("Could not start the build"))
      .finally(() => setStarting(false));
  };

  const setupByRepo = (repoFullName: string) =>
    setup?.repositories.find((repo) => repo.repository === repoFullName);

  const snapshotState =
    snapshot?.enabled !== true
      ? { label: "Off", color: "neutral" as const }
      : snapshot.building
        ? { label: "Building", color: "info" as const }
        : snapshot.hasArtifact
          ? { label: "Ready", color: "success" as const }
          : { label: "Not built", color: "neutral" as const };

  return (
    <>
      <SettingsSection
        title="Repositories"
        description="Setup scripts and commands per repository; the switch includes a repository in the snapshot"
      >
        <CardList>
          {project === undefined || setup === undefined ? (
            <CardEmpty>Loading repositories</CardEmpty>
          ) : project.repos.length === 0 ? (
            <CardEmpty>
              No repositories yet, add some on the project page
            </CardEmpty>
          ) : (
            project.repos.map((repo) => {
              const setupRepo = setupByRepo(repo.repoFullName);
              const scripts = scriptSummary(setupRepo);
              return (
                <SettingsRowLink
                  key={repo.repoFullName}
                  to="/settings/projects/$projectId/dev-environment/repositories/$owner/$repo"
                  params={{
                    projectId,
                    owner: repo.repoFullName.slice(
                      0,
                      repo.repoFullName.indexOf("/"),
                    ),
                    repo: repo.repoFullName.slice(
                      repo.repoFullName.indexOf("/") + 1,
                    ),
                  }}
                  icon={<Icon name="github" className="size-4" />}
                  label={repo.repoFullName}
                  description={scripts}
                >
                  <Switch
                    aria-label={`Include ${repo.repoFullName} in the snapshot`}
                    checked={
                      snapshot?.repos.includes(repo.repoFullName) ?? false
                    }
                    disabled={snapshot === undefined}
                    onCheckedChange={(checked) =>
                      toggleRepo(repo.repoFullName, checked)
                    }
                  />
                </SettingsRowLink>
              );
            })
          )}
        </CardList>
      </SettingsSection>
      <SettingsSection
        title="Snapshots"
        description="Bake the machine after Setup so new machines restore instead of rebuilding"
        action={
          <Switch
            aria-label="Snapshots enabled"
            checked={snapshot?.enabled ?? false}
            disabled={snapshot === undefined}
            onCheckedChange={(enabled) =>
              setSnapshotEnabled({
                params: { orgId, projectId },
                payload: { enabled },
                reactivityKeys: keys,
              }).catch(() => toast.error("Could not update snapshots"))
            }
          />
        }
      >
        <CardList>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <StatusDot color={snapshotState.color} />
                {snapshotState.label}
              </div>
              {snapshot?.estimate && (
                <div className="text-xs font-normal text-muted-foreground-2 tabular-nums">
                  {formatBytes(snapshot.estimate.totalKb * 1024)} of{" "}
                  {formatBytes(snapshot.estimate.budgetKb * 1024)}
                </div>
              )}
              {snapshot?.enabled && snapshot.freezeFailure && (
                <div className="flex items-center gap-2 text-xs font-normal text-warning">
                  <StatusDot color="warning" />
                  Scheduled builds paused
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={snapshot?.enabled !== true || starting}
              onClick={buildNow}
            >
              {starting ? "Starting" : "Build now"}
            </Button>
          </div>
          <SettingsRow
            label="Also snapshot smaller machine sizes"
            description="Each smaller disk tier bakes its own snapshot on the next scheduled build"
          >
            <Switch
              aria-label="Also snapshot smaller machine sizes"
              checked={snapshot?.buildSmallerTiers ?? false}
              disabled={snapshot === undefined}
              onCheckedChange={(buildSmallerTiers) =>
                setSmallerTiers({
                  params: { orgId, projectId },
                  payload: { buildSmallerTiers },
                  reactivityKeys: keys,
                }).catch(() =>
                  toast.error("Could not update the snapshot machine sizes"),
                )
              }
            />
          </SettingsRow>
          {snapshot?.tiers.map((tier) => (
            <SettingsRow
              key={tier.tier}
              label={`${tier.tier.replace("g", "")} GB disk`}
              description={
                tier.artifactCreatedAt === null
                  ? "Not built"
                  : `Baked ${formatRelative(tier.artifactCreatedAt)}`
              }
            >
              {tier.current && <StatusDot color="success" />}
            </SettingsRow>
          ))}
        </CardList>
      </SettingsSection>
      <SettingsSection title="Build history">
        <CardList>
          {builds === undefined ? (
            <CardEmpty>Loading builds</CardEmpty>
          ) : builds.length === 0 ? (
            <CardEmpty>No builds yet</CardEmpty>
          ) : (
            builds.map((build) => (
              <SettingsRowLink
                key={build.id}
                to="/settings/projects/$projectId/dev-environment/builds/$buildId"
                params={{ projectId, buildId: build.id }}
                label={
                  <span className="flex items-center gap-2">
                    <StatusDot color={buildColor(build.status)} />
                    {buildStatusLabel(build.status)}
                  </span>
                }
                description={
                  <span className="flex items-center gap-1.5">
                    <span className="capitalize">{build.trigger}</span>
                    <span aria-hidden>·</span>
                    {formatRelative(build.createdAt)}
                    {duration(build) !== null && (
                      <>
                        <span aria-hidden>·</span>
                        {duration(build)}
                      </>
                    )}
                  </span>
                }
              />
            ))
          )}
        </CardList>
      </SettingsSection>
    </>
  );
}

const buildStatusLabel = (status: string) =>
  status === "succeeded"
    ? "Succeeded"
    : status === "failed"
      ? "Failed"
      : status === "building" || status === "running"
        ? "Building"
        : "Queued";

const buildColor = (status: string) =>
  status === "succeeded"
    ? ("success" as const)
    : status === "failed"
      ? ("danger" as const)
      : ("info" as const);

const duration = (build: {
  readonly startedAt: DateTime.Utc | null;
  readonly completedAt: DateTime.Utc | null;
}) => {
  if (build.startedAt === null || build.completedAt === null) return null;
  return formatDuration(
    DateTime.toEpochMillis(build.completedAt) -
      DateTime.toEpochMillis(build.startedAt),
  );
};

const scriptSummary = (
  repo: ProjectSetup["repositories"][number] | undefined,
) => {
  if (repo === undefined) return "Default setup with no install scripts yet";
  const parts: Array<string> = [];
  if (repo.scripts.initialize !== null) parts.push("install script");
  if (repo.scripts.refresh !== null) parts.push("update script");
  if (repo.startup.length > 0)
    parts.push(
      repo.startup.length === 1
        ? "1 startup entry"
        : `${repo.startup.length} startup entries`,
    );
  if (repo.commands.length > 0)
    parts.push(
      repo.commands.length === 1
        ? "1 command"
        : `${repo.commands.length} commands`,
    );
  return parts.length === 0 ? "No install scripts yet" : parts.join(", ");
};
