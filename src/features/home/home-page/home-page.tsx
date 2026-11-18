import { useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import {
  type ComponentProps,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ASK_ANYTHING_PLACEHOLDER,
  Composer,
  type ComposerHandle,
  type ComposerPayload,
  type MentionSource,
  PlusMenu,
} from "@/components/composer";
import {
  MachineConfigMenu,
  type MachineConfigMenuProps,
  toMachineSize,
  useMachineEntitlements,
} from "@/components/machine-config";
import { ModelPicker } from "@/components/model-picker";
import {
  defaultSelection,
  type ModelSelection,
} from "@/components/model-picker/catalog";
import type { MachineSize } from "@/components/plan-picker/plan-catalog";
import { ProjectSelect } from "@/components/project-select";
import {
  type BranchSelection,
  RepoBranchSelect,
} from "@/components/repo-branch-select";
import {
  type RunOnEntry,
  type RunOnPlacement,
  RunOnSelect,
} from "@/components/run-on-select";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import type {
  ProjectSetup,
  ProjectSnapshotConfig,
} from "@/data/api/schemas/project-settings";
import {
  projectKey,
  projectSetupAtom,
  snapshotConfigAtom,
} from "@/data/atoms/project-settings";
import { projectsAtom } from "@/data/atoms/projects";
import {
  organizationsAtom,
  resolveActiveOrgId,
  selectedOrgIdAtom,
} from "@/data/atoms/session";
import {
  ComposerAttachments,
  useComposerAttachments,
  useFileUploader,
} from "@/features/composer/attachments";
import { composerCommands } from "@/features/composer/composer-commands";
import { DashboardBackdrop } from "@/features/settings-appearance/background-effect";
import { useAppearance } from "@/features/settings-appearance/model/appearance-store";
import { useSidebarState } from "@/features/shell/sidebar-container";
import { cn } from "@/lib/cn";
import { motion } from "@/lib/motion";
import { SidebarTrigger } from "@/primitives/sidebar";
import { HomeWelcome, type HomeWelcomeProject } from "../home-welcome";
import {
  ProjectEnvironmentHint,
  type ProjectEnvironmentHintProject,
  type ProjectEnvironmentState,
} from "../project-environment-hint";
import { FabricBackdrop } from "./fabric-backdrop";
import {
  emptyOrganizeDraft,
  type OrganizeDraft,
  OrganizeMenuItems,
  organizeDraftActive,
} from "./organize-menu";
import { useStartThread } from "./use-start-thread";

export type HomePageProps = ComponentProps<"div"> & {
  /** `?prompt=` on /new: a draft Capy seeds the composer with instead of the welcome. */
  prompt?: string;
};

/** Capy shows the welcome for an org that has nothing to start from yet, and never over a draft. */
export const showsWelcome = (
  prompt: string | undefined,
  projects: ReadonlyArray<unknown>,
) => prompt === undefined && projects.length === 0;

const noSources: MentionSource[] = [];

const payloadOf = (text: string) => ({
  text,
  mentions: [],
  files: [],
});

/** /new: Capy's home page, a centered composer over the panel's air gradient. */
export function HomePage({ prompt, className, ...props }: HomePageProps) {
  const organizations = AsyncResult.getOrElse(
    useAtomValue(organizationsAtom),
    () => [],
  );
  const activeId = resolveActiveOrgId(
    organizations,
    useAtomValue(selectedOrgIdAtom),
  );
  const organization = organizations.find((org) => org.id === activeId);
  if (organization === undefined)
    return <HomePageBody prompt={prompt} className={className} {...props} />;
  return (
    <HomePageProjects
      orgId={organization.id}
      projectless={organization.personalThreadsEnabled}
      prompt={prompt}
      className={className}
      {...props}
    />
  );
}

type HomePageProjectsProps = HomePageProps & {
  orgId: OrgId;
  projectless?: boolean;
};

function HomePageProjects({ orgId, ...props }: HomePageProjectsProps) {
  const projects = AsyncResult.getOrElse(
    useAtomValue(projectsAtom(orgId)),
    () => [],
  );
  return <HomePageBody orgId={orgId} projects={projects} {...props} />;
}

type ProjectMachineConfigProps = MachineConfigMenuProps & {
  orgId: OrgId;
  projectId: string;
};

/** The footer's machine menu, inheriting the size the project's setup boots at. */
function ProjectMachineConfig({
  orgId,
  projectId,
  ...props
}: ProjectMachineConfigProps) {
  const setup = AsyncResult.getOrElse(
    useAtomValue(projectSetupAtom(projectKey(orgId, projectId))),
    () => undefined,
  );
  return (
    <MachineConfigMenu
      {...props}
      projectId={projectId}
      defaultSize={toMachineSize(setup?.machineSize)}
    />
  );
}

/** Undefined until both halves of the environment are known, as in Capy. */
export const projectEnvironmentState = (
  setup: ProjectSetup | undefined,
  snapshot: ProjectSnapshotConfig | undefined,
): ProjectEnvironmentState | undefined =>
  setup === undefined || snapshot === undefined
    ? undefined
    : {
        activeVersionId: setup.activeVersionId,
        building: snapshot.building,
        hasArtifact: snapshot.hasArtifact,
        configured: snapshot.configured,
        enabled: snapshot.enabled,
      };

/** The row's environment line: unbuilt asks Capy to set up, a version links to its snapshot. */
function ProjectEnvironment({
  orgId,
  project,
  onSetUp,
}: {
  readonly orgId: OrgId;
  readonly project: Project;
  readonly onSetUp?: (project: ProjectEnvironmentHintProject) => void;
}) {
  const key = projectKey(orgId, project.id);
  const setup = AsyncResult.getOrElse(
    useAtomValue(projectSetupAtom(key)),
    () => undefined,
  );
  const snapshot = AsyncResult.getOrElse(
    useAtomValue(snapshotConfigAtom(key)),
    () => undefined,
  );
  return (
    <ProjectEnvironmentHint
      project={project}
      state={projectEnvironmentState(setup, snapshot)}
      onSetUp={onSetUp}
    />
  );
}

/** Without a project there is no setup to inherit from and no project rows. */
function HomeMachineConfig(
  props: MachineConfigMenuProps & {
    orgId?: OrgId;
    project?: Project;
  },
) {
  const { orgId, project, ...menu } = props;
  if (orgId === undefined || project === undefined) {
    return <MachineConfigMenu {...menu} />;
  }
  return (
    <ProjectMachineConfig orgId={orgId} projectId={project.id} {...menu} />
  );
}

type HomePageBodyProps = Omit<HomePageProjectsProps, "orgId"> & {
  orgId?: OrgId;
  projects?: ReadonlyArray<Project>;
};

function HomePageBody({
  orgId,
  projects = [],
  projectless = false,
  prompt,
  className,
  ...props
}: HomePageBodyProps) {
  const { open, isNarrow } = useSidebarState();
  const { preferences } = useAppearance();
  const background = preferences.background;
  const [pickedProjectId, setPickedProjectId] = useState<string>();
  const [noProject, setNoProject] = useState(false);
  const [runOn, setRunOn] = useState<RunOnEntry | null>(null);
  const [placement, setPlacement] = useState<RunOnPlacement | null>(null);
  const [branches, setBranches] = useState<BranchSelection>({});
  const [model, setModel] = useState<ModelSelection>(defaultSelection);
  const [machineSize, setMachineSize] = useState<MachineSize | null>(null);
  const [organize, setOrganize] = useState<OrganizeDraft>(emptyOrganizeDraft);
  const composerRef = useRef<ComposerHandle>(null);
  const initialDraft = useRef(
    prompt === undefined ? undefined : payloadOf(prompt),
  ).current;
  const startThread = useStartThread();
  const navigate = useNavigate();
  const entitlements = useMachineEntitlements(orgId);
  const uploader = useFileUploader(orgId);
  const attachments = useComposerAttachments(uploader);
  const project = noProject
    ? undefined
    : (projects.find(({ id }) => id === pickedProjectId) ?? projects[0]);
  const locked = project === undefined && !projectless;

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const commands = useMemo(
    () =>
      composerCommands({
        newThread: () => {
          composerRef.current?.reset(null);
          composerRef.current?.focus();
        },
      }),
    [],
  );

  const askToSetUp = useCallback((target: ProjectEnvironmentHintProject) => {
    const composer = composerRef.current;
    const repoFullName = target.repos[0]?.repoFullName;
    if (composer === null || repoFullName === undefined) return;
    const text = `Set up ${repoFullName} for this project: read the capy-setup skill, reconcile the payload against each repository, write the initialize, update-after-checkout, and startup scripts, and test-build the snapshot before activating.`;
    if (composer.getPayload().text === text) return;
    // reset() skips a payload it wrote before, so clear the record first.
    composer.reset(null);
    composer.reset(payloadOf(text));
  }, []);

  const pickProject = useCallback(
    (picked: HomeWelcomeProject) => {
      setPickedProjectId(picked.id);
      setNoProject(false);
      focusComposer();
    },
    [focusComposer],
  );

  const submit = useCallback(
    (payload: ComposerPayload) => {
      if (locked || orgId === undefined) return false;
      void startThread({
        orgId,
        projectId: project?.id,
        payload,
        machineSize: machineSize ?? undefined,
        organize,
      });
      return true;
    },
    [locked, machineSize, organize, orgId, project?.id, startThread],
  );

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-clip",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:var(--gradient-panel-air)]"
      />
      <FabricBackdrop effect={preferences.effect} />
      {isNarrow || !open ? (
        <div
          data-track-owner="features/home/home-page.tsx#HomePage:SidebarTrigger.1"
          className="absolute top-1.5 left-2 z-(--z-top-bar) [[data-tab-strip]_&]:hidden"
        >
          <SidebarTrigger className="transition-opacity delay-150 duration-100 starting:opacity-0" />
        </div>
      ) : null}
      {background === null ? null : (
        <DashboardBackdrop
          image={background.url}
          effect={preferences.effect}
          appearance={background.appearance}
        />
      )}
      <div className="relative flex flex-1 items-center justify-center px-6">
        <div
          className={cn(
            "flex w-full max-w-178 flex-col pb-[10dvh]",
            motion.enterRise,
          )}
        >
          <div className="flex min-h-8 min-w-0 items-center gap-3 pr-4 pb-1.5 pl-4 [&>div]:flex">
            <ProjectSelect
              data-track-owner="features/home/home-page.tsx#HomePage:ProjectSelect.1"
              orgId={orgId}
              value={project}
              onValueChange={(picked) => {
                setPickedProjectId(picked.id);
                setNoProject(false);
              }}
              noProject={
                projectless
                  ? { selected: noProject, onSelect: () => setNoProject(true) }
                  : undefined
              }
              className="shrink"
            />
            <RunOnSelect
              data-track-owner="features/home/home-page.tsx#HomePage:RunOnSelect.1"
              value={runOn}
              onChange={setRunOn}
              placement={placement}
              onPlacementChange={setPlacement}
              className="shrink"
            />
            {orgId === undefined || project === undefined ? null : (
              <ProjectEnvironment
                orgId={orgId}
                project={project}
                onSetUp={askToSetUp}
              />
            )}
            <span className="ml-auto flex min-w-0 shrink items-center gap-2 [&>div]:flex">
              <RepoBranchSelect
                data-track-owner="features/home/home-page.tsx#HomePage:RepoBranchSelect.1"
                orgId={orgId}
                project={project}
                selection={branches}
                onSelectionChange={setBranches}
                className="shrink"
              />
            </span>
          </div>
          <div className="relative rounded-(--radius-card)">
            <Composer
              ref={composerRef}
              className="relative"
              fieldHeight="multi"
              placeholder={ASK_ANYTHING_PLACEHOLDER}
              autoFocus
              defaultValue={initialDraft}
              sources={noSources}
              commands={commands}
              submitLocked={locked}
              submitWhileUploading
              onSubmit={submit}
              attachments={<ComposerAttachments attachments={attachments} />}
              hasAttachments={attachments.entries.length > 0}
              uploading={attachments.uploading}
              onFilesAdded={attachments.add}
              leftControls={
                <>
                  <span className="flex items-center gap-0.5">
                    <PlusMenu
                      sources={noSources}
                      onPickCategory={(category) => {
                        composerRef.current?.typeCharacter(`@${category}:`);
                      }}
                      onAttach={(files) => attachments.add(files)}
                    />
                    <HomeMachineConfig
                      orgId={orgId}
                      project={project}
                      runsOn={runOn === null ? "cloud" : "device"}
                      size={machineSize}
                      onSizeChange={setMachineSize}
                      maxSize={entitlements.maxSize}
                      bigGuyAvailable={entitlements.bigGuyAvailable}
                      onUpgrade={() =>
                        void navigate({ to: "/settings/org/billing" })
                      }
                      organize={
                        <OrganizeMenuItems
                          orgId={orgId}
                          draft={organize}
                          onChange={setOrganize}
                        />
                      }
                      organizeActive={organizeDraftActive(organize)}
                    />
                  </span>
                  <span className="ml-1 flex min-w-0 items-center gap-0.5">
                    <ModelPicker
                      orgId={orgId}
                      value={model}
                      onChange={setModel}
                      composer
                    />
                  </span>
                </>
              }
            />
          </div>
          {showsWelcome(prompt, projects) ? (
            <HomeWelcome
              projects={projects}
              projectless={projectless}
              onPick={pickProject}
              onStart={focusComposer}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
