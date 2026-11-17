import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type ImportJob,
  importProgressKey,
  startImportJob,
  useImportJob,
  useImportJobStore,
} from "@/components/import-job-indicator";
import { Dialog } from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { ImportDestination } from "./import-destination";
import {
  assignProject,
  buildPlacements,
  deviceNoun,
  groupSessions,
  hasUnresolved,
  type ImportBridge,
  type ImportManifest,
  type ImportProject,
  type ImportSession,
  type ImportSource,
  type ImportStep,
  isDraftProject,
  placementRows,
  scopeManifest,
  selectableKeys,
  sessionKey,
  setKeys,
  sourceLabel,
  toggleSelection,
} from "./import-model";
import { ImportProgress } from "./import-progress";
import {
  GroupHeader,
  ReviewSkeletonRow,
  SectionHeader,
  SessionRow,
} from "./session-rows";

export type ImportReviewState = {
  step: ImportStep;
  job: ImportJob | undefined;
  retry: () => void;
  finish: () => void;
  next: () => void;
  back: () => void;
  running: boolean;
  ready: boolean;
  selectedCount: number;
  confirm: () => void;
};

export type CreateProjectProps = {
  orgId: string;
  onCreated: (project: ImportProject) => void;
  onBack: () => void;
};

export type ImportReviewProps = {
  source?: ImportSource;
  orgId: string;
  userId: string;
  deviceId?: string;
  bridge?: ImportBridge;
  manifest?: ImportManifest;
  onManifest?: (manifest: ImportManifest | undefined) => void;
  header?: (state: ImportReviewState) => ReactNode;
  body?: (content: ReactNode) => ReactNode;
  onStarted?: (sessions: ImportSession[]) => void;
  onFinished?: (job: ImportJob) => void;
  footer: (state: ImportReviewState) => ReactNode;
  renderCreateProject?: (props: CreateProjectProps) => ReactNode;
};

const IMPORT_KEY_PREFIX = "import:";

const subscribeNothing = () => () => {};

export function useDeviceNoun() {
  return useSyncExternalStore(
    subscribeNothing,
    () => deviceNoun(navigator.userAgent),
    () => "computer",
  );
}

export function ImportReview({
  source,
  orgId,
  userId,
  deviceId,
  bridge,
  manifest: initialManifest,
  onManifest,
  header,
  body = (content) => content,
  onStarted,
  onFinished,
  footer,
  renderCreateProject,
}: ImportReviewProps) {
  const noun = useDeviceNoun();
  const store = useImportJobStore();
  const current = useImportJob();
  const [manifest, setManifest] = useState(initialManifest);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set());
  const [openProjects, setOpenProjects] = useState<Set<string>>(
    () => new Set(),
  );
  const [overrides, setOverrides] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [step, setStep] = useState<ImportStep>("sessions");
  const anchor = useRef<string | undefined>(undefined);
  const [creating, setCreating] = useState<ImportSession[]>();
  const belongs = (job: ImportJob | undefined): job is ImportJob =>
    job !== undefined &&
    job.input.orgId === orgId &&
    job.input.userId === userId &&
    (source === undefined ||
      job.imported.every((session) => session.source === source));
  const job = belongs(current) ? current : undefined;
  const progress = job?.progress ?? new Map();
  const running = current?.running === true;
  const onManifestRef = useRef(onManifest);
  useEffect(() => {
    onManifestRef.current = onManifest;
  }, [onManifest]);

  useEffect(() => {
    if (bridge === undefined) return;
    let cancelled = false;
    const apply = (next: ImportManifest) => {
      const latest = store.get();
      const done = new Set(
        latest?.input.orgId === orgId && latest.input.userId === userId
          ? [...latest.progress]
              .filter(([, value]) => value.phase === "done")
              .map(([key]) => key.slice(IMPORT_KEY_PREFIX.length))
          : [],
      );
      const scoped = scopeManifest(next, source, done);
      setManifest(scoped.manifest);
      onManifestRef.current?.(scoped.manifest);
      setSelected(scoped.selected);
      setOpenFolders(new Set());
      setOpenProjects(new Set());
    };
    setOverrides(new Map());
    const latest = store.get();
    setStep(
      latest?.running === true &&
        latest.input.orgId === orgId &&
        latest.input.userId === userId &&
        (source === undefined ||
          latest.imported.every((session) => session.source === source))
        ? "progress"
        : "sessions",
    );
    setCreating(undefined);
    if (initialManifest !== undefined) {
      apply(initialManifest);
      return;
    }
    setManifest(undefined);
    onManifestRef.current?.(undefined);
    setError(undefined);
    bridge.manifest(orgId).then((result) => {
      if (cancelled) return;
      if (result.ok) apply(result.manifest);
      else setError(result.detail);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId, userId, bridge, source, initialManifest, store]);

  const sessions = manifest?.sessions ?? [];
  const groups = groupSessions(manifest);
  const picked = sessions.filter((session) =>
    selected.has(sessionKey(session)),
  );
  const rows = placementRows(groups, manifest, selected, overrides);
  const unresolved = hasUnresolved(picked, overrides);
  const select = (key: string, shift: boolean) => {
    const next = toggleSelection(selected, groups, anchor.current, key, shift);
    anchor.current = next.anchor;
    setSelected(next.selected);
  };
  const check = (keys: readonly string[], checked: boolean) =>
    setSelected((previous) => setKeys(previous, keys, checked));
  const toggleOpen = (
    update: (fn: (previous: Set<string>) => Set<string>) => void,
    key: string,
  ) =>
    update((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const confirm = () => {
    if (
      step !== "projects" ||
      running ||
      bridge === undefined ||
      manifest === undefined ||
      picked.length === 0 ||
      unresolved
    )
      return;
    setStep("progress");
    startImportJob(
      store,
      bridge,
      {
        orgId,
        userId,
        device: deviceId === undefined ? undefined : { deviceId },
        placements: buildPlacements(picked, overrides, manifest.projects),
      },
      picked,
    );
    onStarted?.(picked);
  };
  const state: ImportReviewState = {
    step,
    job: step === "progress" ? job : undefined,
    retry: () => {
      if (bridge === undefined || job === undefined || running) return;
      const failed = job.imported.filter(
        (session) =>
          job.progress.get(importProgressKey(session))?.phase === "failed",
      );
      if (failed.length === 0) return;
      const keys = new Set(failed.map(sessionKey));
      startImportJob(
        store,
        bridge,
        {
          ...job.input,
          placements: job.input.placements.filter((placement) =>
            keys.has(sessionKey(placement)),
          ),
        },
        failed,
      );
    },
    finish: () => {
      if (job !== undefined && !running) onFinished?.(job);
    },
    next: () => {
      if (manifest !== undefined && picked.length > 0 && !running)
        setStep("projects");
    },
    back: () => {
      if (!running) setStep("sessions");
    },
    running,
    ready: manifest !== undefined && (step === "sessions" || !unresolved),
    selectedCount: picked.length,
    confirm,
  };
  const label =
    step === "progress"
      ? "Import results"
      : `Step ${step === "sessions" ? 1 : 2} of 2`;
  const sourceName = source === undefined ? "" : sourceLabel(source);

  const renderSessions = (group: { sessions: ImportSession[] }) =>
    group.sessions.map((session) => (
      <SessionRow
        key={sessionKey(session)}
        session={session}
        state={progress.get(importProgressKey(session))}
        busy={running}
        selected={selected.has(sessionKey(session))}
        onSelect={(shift) => select(sessionKey(session), shift)}
      />
    ));

  const content = (() => {
    if (bridge === undefined)
      return (
        <p className="px-2 text-sm text-muted-foreground-2">
          Importing runs in the Capy desktop app
        </p>
      );
    if (error !== undefined)
      return <p className="px-2 text-sm text-destructive">{error}</p>;
    if (manifest === undefined)
      return (
        <div
          role="status"
          aria-label="Finding sessions"
          className="flex flex-col gap-px"
        >
          <div className="mb-0.5 h-8 rounded-(--radius-card) bg-section" />
          {[0, 1, 2].map((index) => (
            <ReviewSkeletonRow key={index} index={index} />
          ))}
        </div>
      );
    if (manifest.sessions.length === 0)
      return (
        <p className="flex h-24 items-center justify-center text-sm text-muted-foreground-2">
          No {sourceName === "" ? "" : `${sourceName} `}sessions on this {noun}
        </p>
      );
    if (step === "progress" && job !== undefined)
      return <ImportProgress job={job} />;
    if (step === "projects")
      return (
        <div className="grid grid-cols-2 items-center gap-x-4">
          <span className="pb-2 text-xs text-muted-foreground-2">
            Repository or folder
          </span>
          <span className="pb-2 text-xs text-muted-foreground-2">
            Capy project
          </span>
          {rows.map((row) => (
            <div
              key={row.key}
              className="col-span-2 grid grid-cols-subgrid items-center border-t-(length:--border-width-hairline) border-border-1 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon
                  name={row.repository ? "git" : "folder-1"}
                  className="size-4 shrink-0 text-muted-foreground-1"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="truncate text-sm font-medium text-foreground"
                    title={row.source}
                  >
                    {row.source}
                  </span>
                  <span className="text-xs text-muted-foreground-2">
                    {row.count} {row.count === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>
              {row.editable ? (
                <ImportDestination
                  sessions={row.sessions}
                  projects={manifest.projects}
                  projectId={row.projectId}
                  name={row.name}
                  unresolved={row.unresolved}
                  disabled={running}
                  onChoose={(projectId) =>
                    setOverrides((previous) =>
                      assignProject(previous, row.sessions, projectId),
                    )
                  }
                  onCreate={() => {
                    if (renderCreateProject !== undefined)
                      setCreating(row.sessions);
                  }}
                />
              ) : (
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm text-foreground">
                    {row.name}
                  </span>
                  <span className="text-xs text-muted-foreground-2">
                    {row.locked
                      ? "Previously imported here"
                      : row.projectId !== null && !isDraftProject(row.projectId)
                        ? "Existing project"
                        : "New project"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    return (
      <div className="flex flex-col">
        <SectionHeader count={groups.projects.length}>
          Repositories
        </SectionHeader>
        <div className="flex flex-col gap-px">
          {groups.projects.map((group) => {
            const keys = selectableKeys(group);
            const open = openProjects.has(group.id);
            return (
              <div key={group.id} className="flex flex-col gap-px">
                <GroupHeader
                  icon={<Icon name="git" />}
                  name={
                    group.sessions[0]?.repos[0] ?? group.repos[0] ?? group.name
                  }
                  detail=""
                  open={open}
                  onToggle={() => toggleOpen(setOpenProjects, group.id)}
                  picked={keys.filter((key) => selected.has(key)).length}
                  total={keys.length}
                  onCheck={(checked) => check(keys, checked)}
                  busy={running}
                />
                {open && renderSessions(group)}
              </div>
            );
          })}
        </div>
        {groups.folders.length > 0 && (
          <>
            <div className="mt-1">
              <SectionHeader count={groups.folders.length}>
                Local folders
              </SectionHeader>
            </div>
            <div className="flex flex-col gap-px">
              {groups.folders.map((group) => {
                const keys = selectableKeys(group);
                const open = openFolders.has(group.key);
                return (
                  <div key={group.key} className="flex flex-col gap-px">
                    <GroupHeader
                      icon={<Icon name="folder-1" />}
                      name={group.name}
                      detail={
                        group.exists ? group.path : `${group.path} (deleted)`
                      }
                      open={open}
                      onToggle={() => toggleOpen(setOpenFolders, group.key)}
                      picked={keys.filter((key) => selected.has(key)).length}
                      total={keys.length}
                      onCheck={(checked) => check(keys, checked)}
                      busy={running}
                    />
                    {open && renderSessions(group)}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  })();

  return (
    <>
      {header?.(state)}
      {body(
        // biome-ignore lint/a11y/useAriaPropsSupportedByRole: names the current step for assistive tech, as Capy does
        <div
          key={step}
          className="-m-1 flex max-h-[60dvh] flex-col overflow-y-auto p-1 md:scroll-fade-y"
          aria-label={label}
        >
          {content}
        </div>,
      )}
      <Dialog
        open={creating !== undefined}
        onOpenChange={(open) => {
          if (!open) setCreating(undefined);
        }}
      >
        {creating === undefined
          ? null
          : renderCreateProject?.({
              orgId,
              onBack: () => setCreating(undefined),
              onCreated: (project) => {
                setManifest((previous) =>
                  previous === undefined
                    ? previous
                    : {
                        ...previous,
                        projects: [
                          ...previous.projects.filter(
                            (existing) => existing.id !== project.id,
                          ),
                          project,
                        ],
                      },
                );
                setOverrides((previous) =>
                  assignProject(previous, creating, project.id),
                );
                setCreating(undefined);
              },
            })}
      </Dialog>
      {footer(state)}
    </>
  );
}
