import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useState } from "react";
import { FailedRead } from "@/components/failed-read";
import type { OrgId } from "@/data/api/schemas/ids";
import { organizationsAtom } from "@/data/atoms/session";
import {
  projectSetupAtom,
  rerunSetupAtom,
  setupReactivityKeys,
  setupVersionsAtom,
  snapshotBuildAtom,
  snapshotBuildsAtom,
  snapshotConfigAtom,
  threadDetailAtom,
  threadMachinesAtom,
} from "@/data/atoms/setup";
import { toast } from "@/primitives/toaster";
import { BuildFocusView } from "./build-focus";
import {
  type ScriptTarget,
  SETUP_POLL_INTERVAL,
  SETUP_POLL_INTERVAL_BUILDING,
  setupStatus,
  showsMachineSection,
  threadChanges,
} from "./logic";
import {
  parseSetup,
  parseSetupVersions,
  parseSnapshotBuild,
  parseSnapshotBuilds,
  parseSnapshotConfig,
  parseThreadMachine,
  parseThreadProjectId,
} from "./parse";
import {
  MachineSectionView,
  NoProjectSetup,
  SetupBody,
  SetupSkeleton,
} from "./setup-body";

export type SetupFocus =
  | { kind: "build"; buildId: string }
  | { kind: "version"; versionId: string; script: ScriptTarget }
  | { kind: "machine" };

export type SetupViewProps = {
  threadId: string;
  /** The thread's project; read from the thread when omitted. */
  projectId?: string | null;
  focus?: SetupFocus;
  onFocus?: (focus: SetupFocus | undefined) => void;
};

const successValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

function useOrgId(): OrgId | undefined {
  const organizations = useAtomValue(organizationsAtom);
  return successValue(organizations)?.[0]?.id;
}

function useNow(interval: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}

function usePolling(refresh: () => void, interval: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, interval);
    return () => clearInterval(timer);
  }, [refresh, interval, enabled]);
}

/** The thread pane's Setup tab: the project's Setup, this machine's run and its snapshot builds. */
export function SetupView({
  threadId,
  projectId,
  focus,
  onFocus,
}: SetupViewProps) {
  const orgId = useOrgId();
  const [localFocus, setLocalFocus] = useState<SetupFocus>();
  if (orgId === undefined) return <SetupSkeleton />;
  const controlled = onFocus !== undefined;
  const props = {
    orgId,
    threadId,
    focus: controlled ? focus : localFocus,
    onFocus: controlled ? onFocus : setLocalFocus,
  };
  return projectId === undefined ? (
    <ThreadSetup {...props} />
  ) : (
    <ProjectSetupView {...props} projectId={projectId} />
  );
}

type ConnectedProps = {
  orgId: OrgId;
  threadId: string;
  focus: SetupFocus | undefined;
  onFocus: (focus: SetupFocus | undefined) => void;
};

function ThreadSetup(props: ConnectedProps) {
  const thread = useAtomValue(threadDetailAtom(props.orgId, props.threadId));
  const refresh = useAtomRefresh(threadDetailAtom(props.orgId, props.threadId));
  if (AsyncResult.isInitial(thread)) return <SetupSkeleton />;
  // A failed read is not a thread without a project: say which one happened.
  if (AsyncResult.isFailure(thread))
    return (
      <FailedRead
        slot="setup-load-failed"
        line="Couldn't load Setup"
        sub="This thread's project did not load"
        onRetry={refresh}
      />
    );
  return (
    <ProjectSetupView
      {...props}
      projectId={parseThreadProjectId(thread.value)}
    />
  );
}

function ProjectSetupView({
  projectId,
  ...props
}: ConnectedProps & { projectId: string | null }) {
  if (projectId === null) return <NoProjectSetup />;
  if (props.focus?.kind === "build")
    return (
      <BuildFocus
        orgId={props.orgId}
        projectId={projectId}
        buildId={props.focus.buildId}
        onBack={() => props.onFocus(undefined)}
      />
    );
  return <SetupBodyConnected {...props} projectId={projectId} />;
}

function SetupBodyConnected({
  orgId,
  threadId,
  projectId,
  focus,
  onFocus,
}: ConnectedProps & { projectId: string }) {
  const setupAtom = projectSetupAtom(orgId, projectId);
  const versionsAtom = setupVersionsAtom(orgId, projectId);
  const configAtom = snapshotConfigAtom(orgId, projectId);
  const buildsAtom = snapshotBuildsAtom(orgId, projectId);
  const setupResult = useAtomValue(setupAtom);
  const versionsResult = useAtomValue(versionsAtom);
  const configResult = useAtomValue(configAtom);
  const buildsResult = useAtomValue(buildsAtom);
  const refreshSetup = useAtomRefresh(setupAtom);
  const refreshVersions = useAtomRefresh(versionsAtom);
  const refreshConfig = useAtomRefresh(configAtom);
  const refreshBuilds = useAtomRefresh(buildsAtom);

  const builds = AsyncResult.isSuccess(buildsResult)
    ? parseSnapshotBuilds(buildsResult.value)
    : AsyncResult.isFailure(buildsResult)
      ? []
      : undefined;
  const latestBuild = builds?.[0];
  const building = latestBuild?.status === "building";
  const interval = building
    ? SETUP_POLL_INTERVAL_BUILDING
    : SETUP_POLL_INTERVAL;
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      refreshSetup();
      refreshVersions();
      refreshConfig();
      refreshBuilds();
    }, interval);
    return () => clearInterval(timer);
  }, [interval, refreshSetup, refreshVersions, refreshConfig, refreshBuilds]);
  const now = useNow(SETUP_POLL_INTERVAL);

  if (AsyncResult.isInitial(setupResult)) return <SetupSkeleton />;
  // An unreadable Setup is not a project with nothing configured.
  if (AsyncResult.isFailure(setupResult))
    return (
      <FailedRead
        slot="setup-load-failed"
        line="Couldn't load this project's Setup"
        sub="Its scripts and versions did not load"
        onRetry={refreshSetup}
      />
    );
  const setup = parseSetup(setupResult.value);
  const config = AsyncResult.isSuccess(configResult)
    ? parseSnapshotConfig(configResult.value)
    : undefined;
  const versions = AsyncResult.isSuccess(versionsResult)
    ? parseSetupVersions(versionsResult.value)
    : undefined;

  return (
    <SetupBody
      projectId={projectId}
      setup={setup}
      status={setupStatus(
        setup.activeVersionId,
        config?.enabled ?? false,
        config,
        latestBuild,
      )}
      builds={builds}
      changes={threadChanges(versions, threadId)}
      now={now}
      machine={
        <MachineSection
          orgId={orgId}
          threadId={threadId}
          focused={focus?.kind === "machine"}
          now={now}
        />
      }
      focusScript={focus?.kind === "version" ? focus.script : undefined}
      onFocusScript={(versionId, script) =>
        onFocus({ kind: "version", versionId, script })
      }
      onOpenBuild={(build) => onFocus({ kind: "build", buildId: build.id })}
    />
  );
}

function MachineSection({
  orgId,
  threadId,
  focused,
  now,
}: {
  orgId: OrgId;
  threadId: string;
  focused: boolean;
  now: number;
}) {
  const machinesAtom = threadMachinesAtom(orgId, threadId);
  const machines = useAtomValue(machinesAtom);
  const refreshMachines = useAtomRefresh(machinesAtom);
  const rerun = useAtomSet(rerunSetupAtom, { mode: "promiseExit" });
  const [rerunning, setRerunning] = useState(false);
  const machine = AsyncResult.isSuccess(machines)
    ? parseThreadMachine(machines.value)
    : null;
  if (!showsMachineSection(machine)) return null;
  const rerunSetup = () => {
    if (rerunning) return;
    setRerunning(true);
    rerun({
      params: { orgId, jamId: threadId, machineId: machine.id },
      reactivityKeys: [setupReactivityKeys.machines(orgId, threadId)],
    }).then((exit) => {
      setRerunning(false);
      if (exit._tag === "Failure") toast.error("Could not run Setup again");
      refreshMachines();
    });
  };
  return (
    <MachineSectionView
      machine={machine}
      now={now}
      focused={focused}
      rerunning={rerunning}
      onRerunSetup={rerunSetup}
    />
  );
}

function BuildFocus({
  orgId,
  projectId,
  buildId,
  onBack,
}: {
  orgId: OrgId;
  projectId: string;
  buildId: string;
  onBack: () => void;
}) {
  const buildAtom = snapshotBuildAtom(orgId, projectId, buildId);
  const result = useAtomValue(buildAtom);
  const refresh = useAtomRefresh(buildAtom);
  const build = AsyncResult.isSuccess(result)
    ? parseSnapshotBuild(result.value)
    : undefined;
  usePolling(
    refresh,
    SETUP_POLL_INTERVAL_BUILDING,
    build?.status === "building",
  );
  const now = useNow(SETUP_POLL_INTERVAL_BUILDING);
  return (
    <BuildFocusView
      projectId={projectId}
      buildId={buildId}
      build={build}
      notFound={
        AsyncResult.isFailure(result) ||
        (AsyncResult.isSuccess(result) && build === undefined)
      }
      now={now}
      onBack={onBack}
    />
  );
}
