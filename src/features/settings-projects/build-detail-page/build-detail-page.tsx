import { useAtomValue } from "@effect/atom-react";
import { useParams } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { ReadGate } from "@/components/read-gate";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  snapshotBuildAtom,
  snapshotBuildKey,
} from "@/data/atoms/project-settings";
import { organizationsAtom } from "@/data/atoms/session";
import { SettingsRow } from "@/primitives/settings-row";
import {
  CardEmpty,
  CardList,
  CardListTitle,
  StatusDot,
} from "../shared/card-list";
import { formatDuration, formatRelative } from "../shared/relative-time";
import { useActiveOrgId, useActiveOrgRead } from "../shared/use-org";

const statusLabel = (status: string) =>
  status === "succeeded"
    ? "Succeeded"
    : status === "failed"
      ? "Failed"
      : status === "running" || status === "building"
        ? "Building"
        : "Pending";

const statusColor = (status: string) =>
  status === "success" || status === "succeeded"
    ? ("success" as const)
    : status === "error" || status === "failed"
      ? ("danger" as const)
      : status === "warning"
        ? ("warning" as const)
        : ("neutral" as const);

export function BuildDetailPage() {
  const { projectId, buildId } = useParams({
    from: "/_app/settings/projects_/$projectId_/dev-environment_/builds/$buildId",
  });
  const orgId = useActiveOrgId();
  const orgRead = useActiveOrgRead();
  return (
    <SettingsPage title="Build">
      <ReadGate
        result={orgRead}
        atom={organizationsAtom}
        slot="build-failed"
        line="Couldn't load your organization"
        sub="Check your connection and try again"
        pending={<SettingsLoadingCard />}
      >
        {(orgs) => (
          <BuildDetail
            orgId={orgs[0]?.id ?? (orgId as OrgId)}
            projectId={projectId}
            buildId={buildId}
          />
        )}
      </ReadGate>
    </SettingsPage>
  );
}

function BuildDetail({
  orgId,
  projectId,
  buildId,
}: {
  readonly orgId: OrgId;
  readonly projectId: string;
  readonly buildId: string;
}) {
  const buildKey = snapshotBuildKey(orgId, projectId, buildId);
  const result = useAtomValue(snapshotBuildAtom(buildKey));
  const build = AsyncResult.isSuccess(result) ? result.value : undefined;
  if (build === undefined)
    return (
      <CardList>
        <CardEmpty>
          {AsyncResult.isFailure(result)
            ? "Could not load this build"
            : "Loading build"}
        </CardEmpty>
      </CardList>
    );
  const duration =
    build.startedAt === null || build.completedAt === null
      ? "—"
      : formatDuration(
          DateTime.toEpochMillis(build.completedAt) -
            DateTime.toEpochMillis(build.startedAt),
        );
  return (
    <>
      <SettingsSection title="Build">
        <CardList>
          <SettingsRow
            label={
              <span className="flex items-center gap-2">
                <StatusDot color={statusColor(build.status)} />
                {statusLabel(build.status)}
              </span>
            }
            description={
              build.failureReason ??
              build.reason ??
              (build.trigger === "scheduled"
                ? "Scheduled build"
                : "Manual build")
            }
          >
            <span className="text-xs font-normal text-muted-foreground-2">
              {formatRelative(build.createdAt)}
            </span>
          </SettingsRow>
          <SettingsRow
            label="Trigger"
            description={<span className="capitalize">{build.trigger}</span>}
          />
          <SettingsRow
            label="Started"
            description={
              build.startedAt === null ? "—" : formatRelative(build.startedAt)
            }
          />
          <SettingsRow
            label="Completed"
            description={
              build.completedAt === null
                ? "—"
                : formatRelative(build.completedAt)
            }
          />
          <SettingsRow label="Duration" description={duration} />
        </CardList>
      </SettingsSection>
      <SettingsSection title="Steps">
        <CardList>
          <CardListTitle title="Steps" />
          {build.steps.length === 0 ? (
            <CardEmpty>
              {build.status === "building"
                ? "Waiting for the first step"
                : "No steps recorded"}
            </CardEmpty>
          ) : (
            build.steps.map((step) => (
              <SettingsRow
                key={`${step.step}:${step.status}`}
                label={
                  <span className="flex items-center gap-2">
                    <StatusDot color={statusColor(step.status)} />
                    {step.step}
                  </span>
                }
                description={step.errorTail ?? step.outputTail ?? undefined}
                wrapValue
              >
                <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
                  {step.durationMs === null
                    ? "—"
                    : formatDuration(step.durationMs)}
                </span>
              </SettingsRow>
            ))
          )}
        </CardList>
      </SettingsSection>
      <SettingsSection title="Setup phases">
        <CardList>
          {build.phases.length === 0 ? (
            <CardEmpty>No steps recorded</CardEmpty>
          ) : (
            build.phases.map((phase) => (
              <SettingsRow
                key={`${phase.repo}:${phase.phase}:${phase.entry ?? ""}`}
                label={
                  <span className="flex items-center gap-2">
                    <StatusDot color={statusColor(phase.status)} />
                    {phase.repo} ·{" "}
                    {phase.entry === null
                      ? phase.phase
                      : `${phase.phase} ${phase.entry}`}
                  </span>
                }
                description={phase.errorTail ?? phase.outputTail ?? undefined}
                wrapValue
              >
                <span className="text-xs font-normal text-muted-foreground-2 tabular-nums">
                  {phase.durationMs === null
                    ? "—"
                    : formatDuration(phase.durationMs)}
                </span>
              </SettingsRow>
            ))
          )}
        </CardList>
      </SettingsSection>
    </>
  );
}
