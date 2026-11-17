import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { AppTopBar } from "@/components/app-top-bar";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { projectKey, projectSetupAtom } from "@/data/atoms/project-settings";
import { projectsAtom } from "@/data/atoms/projects";
import { threadsAtom } from "@/data/atoms/threads";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { ScrollArea } from "@/primitives/scroll-area";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  automationKeys,
  createAutomationAtom,
} from "../automation-editor/atoms";
import { errorMessage } from "../automation-editor/automation-editor";
import {
  EditorSections,
  type EditorSectionsProps,
} from "../automation-editor/editor-sections";
import {
  ChevronDownSmall,
  ChevronRightSmall,
} from "../automation-editor/icons";
import {
  canSave,
  type EditorForm,
  mixedRunWhen,
  type RunAs,
  withRunAs,
} from "../automation-editor/model";
import { chevronClass } from "../automation-editor/parts";
import { useMachineUsage } from "../automation-editor/use-machine-usage";
import { resultValue, useOrgId } from "../automation-editor/use-org";
import { useViewer, type Viewer } from "../automations-list";
import { OwnerSelect } from "../owner-select";
import { RunsInRows, RunsInSelect, useProjectThreads } from "../runs-in-select";
import { findTemplate } from "../templates-section";
import {
  blankSeed,
  createdAutomationId,
  createPayload,
  formFromSeed,
  type NewAutomationSeed,
  seedFromTemplate,
  seedFromThread,
} from "./mapping";

const track = (owner: string) =>
  `features/automations/new-automation-page.tsx#${owner}`;

export type NewAutomationPageProps = {
  templateId?: string;
  threadId?: string;
};

function NewAutomationTopBar({ children }: { children?: ReactNode }) {
  return (
    <AppTopBar>
      <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <Link
            to="/automations"
            className="shrink-0 font-medium text-muted-foreground-2 transition-colors duration-100 hover:text-foreground"
          >
            Automations
          </Link>
          <ChevronRightSmall aria-hidden className={chevronClass} />
          <span className="min-w-0 truncate">New automation</span>
        </span>
      </h1>
      {children}
    </AppTopBar>
  );
}

function NewAutomationShell({ children }: { children?: ReactNode }) {
  return <div className="flex h-full min-h-0 flex-col">{children}</div>;
}

/**
 * `/automation/new`: the editor in create mode. Capy's route hands this screen a
 * template, a thread to pin to, or neither, and creating hands off to the editor.
 */
export function NewAutomationPage({
  templateId,
  threadId,
}: NewAutomationPageProps) {
  const orgId = useOrgId();
  const viewer = useViewer();
  const projectsResult = useAtomValue(projectsAtom((orgId ?? "") as OrgId));
  const threadsResult = useAtomValue(threadsAtom((orgId ?? "") as OrgId));
  if (orgId === undefined)
    return (
      <NewAutomationShell>
        <NewAutomationTopBar />
      </NewAutomationShell>
    );
  const threads = resultValue(threadsResult)?.items ?? [];
  if (
    AsyncResult.isInitial(projectsResult) ||
    projectsResult.waiting ||
    (threadId !== undefined &&
      (AsyncResult.isInitial(threadsResult) || threadsResult.waiting))
  )
    return (
      <NewAutomationShell>
        <NewAutomationTopBar />
      </NewAutomationShell>
    );
  const projects = resultValue(projectsResult) ?? [];
  const template = findTemplate(templateId);
  const thread =
    threadId === undefined
      ? undefined
      : threads.find((candidate) => candidate.id === threadId);
  const seed =
    template === undefined
      ? threadId === undefined
        ? blankSeed()
        : seedFromThread(threadId, thread?.title ?? null)
      : seedFromTemplate(template);
  return (
    <NewAutomationForm
      key={`${templateId ?? ""}:${threadId ?? ""}`}
      orgId={orgId}
      viewer={viewer}
      projects={projects}
      projectId={thread?.projectId ?? projects[0]?.id ?? undefined}
      seed={seed}
    />
  );
}

type NewAutomationFormProps = {
  orgId: string;
  viewer: Viewer;
  projects: ReadonlyArray<Project>;
  projectId: string | undefined;
  seed: NewAutomationSeed;
};

function NewAutomationForm({
  orgId,
  viewer,
  projects,
  projectId: defaultProjectId,
  seed,
}: NewAutomationFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<EditorForm>(() => formFromSeed(seed));
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [creating, setCreating] = useState(false);
  const create = useAtomSet(createAutomationAtom, { mode: "promise" });
  const project =
    projects.find((candidate) => candidate.id === projectId) ?? projects[0];
  const threads = useProjectThreads(project?.id);
  const runAs =
    form.runAs ??
    (viewer.id === undefined ? null : { kind: "human", id: viewer.id });
  const serviceRunAs = runAs?.kind === "service";
  const canCreate = project !== undefined && canSave(form);
  const [mixed] = useState(() => mixedRunWhen(seed.triggers));

  const submit = () => {
    if (creating || !canCreate || project === undefined) return;
    const name = form.name.trim();
    setCreating(true);
    create({
      params: { orgId },
      payload: createPayload(form, {
        projectId: project.id,
        viewerId: viewer.id,
      }),
      reactivityKeys: [automationKeys.list(orgId)],
    })
      .then(
        (result) => {
          toast.success("Automation created", { description: name });
          const automationId = createdAutomationId(result);
          if (automationId === undefined) {
            void navigate({ to: "/automations" });
            return;
          }
          void navigate({
            to: "/automation/$automationId",
            params: { automationId },
          });
        },
        (error: unknown) =>
          toast.error(errorMessage(error, "Could not create"), {
            description: name,
          }),
      )
      .finally(() => setCreating(false));
  };

  const setRunAs = (value: RunAs) => setForm(withRunAs(form, value));

  const machineUsage = useMachineUsage(orgId);

  const sections: EditorSectionsProps = {
    form,
    setForm,
    mixedRunWhen: mixed,
    serviceRunAs,
    folders: [],
    tags: [],
    machineUsage,
  };

  const projectControl =
    project === undefined ? null : (
      <Menu>
        <MenuTrigger
          render={
            <Button
              data-track-owner={track("NewAutomationPage:Button[Project]")}
              variant="bare"
              size="auto-sm"
              aria-label="Project"
              className="-m-1 p-1"
            />
          }
        >
          <span className="flex items-center gap-1.5 text-sm font-normal text-foreground">
            {project.name}
          </span>
          <ChevronDownSmall className={chevronClass} />
        </MenuTrigger>
        <MenuContent align="end" className="w-52">
          {projects.map((candidate) => (
            <MenuItem
              key={candidate.id}
              data-track-owner={track(
                "NewAutomationPage:ResponsiveMenuItem[Project]",
              )}
              onClick={() => setProjectId(candidate.id)}
            >
              {candidate.name}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    );

  return (
    <NewAutomationShell>
      <NewAutomationTopBar>
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Button
            data-track-owner={track("NewAutomationPage:Button[Cancel]")}
            variant="ghost"
            render={<Link to="/automations" />}
          >
            Cancel
          </Button>
          <Button
            data-track-owner={track(
              "NewAutomationPage:Button[Create automation]",
            )}
            loading={creating}
            disabled={!canCreate}
            onClick={submit}
          >
            Create automation
          </Button>
        </div>
      </NewAutomationTopBar>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 pt-6 pb-10">
          <div className="flex flex-col gap-3">
            <Input
              variant="blank"
              aria-label="Automation name"
              placeholder="Automation name"
              className="px-0 text-xl font-medium"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <Input
              variant="blank"
              aria-label="Automation description"
              placeholder="Add a description"
              className="px-0"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
            <Card rows className="-mx-4 mt-3">
              <RunsInRows
                runsIn={form.runsIn}
                thread={threads.find(
                  (candidate) => candidate.id === form.runsIn.singleJamId,
                )}
                control={
                  <RunsInSelect
                    value={form.runsIn}
                    projectId={project?.id}
                    offerStanding={form.runsIn.singleJamId === null}
                    onValueChange={(runsIn) => setForm({ ...form, runsIn })}
                  />
                }
                project={projectControl}
              />
              <SettingsRow
                label="Runs as"
                description="Each run uses this person's access, models and bill"
              >
                <OwnerSelect
                  value={runAs}
                  fallbackLabel={viewer.name}
                  onValueChange={setRunAs}
                />
              </SettingsRow>
              <SettingsRow
                label="Post as run-as person"
                description={
                  serviceRunAs
                    ? "Needs a human run-as, a service user posts as Capy"
                    : "Slack messages use the selected run-as account's name and photo instead of Capy"
                }
              >
                <Switch
                  aria-label="Post as run-as person"
                  checked={form.slackImpersonation}
                  disabled={serviceRunAs}
                  onCheckedChange={(slackImpersonation) =>
                    setForm({ ...form, slackImpersonation })
                  }
                />
              </SettingsRow>
              <SettingsRow
                label="Quiet Slack posts"
                description="Leave the Sent by footer and the status card off this automation's Slack posts"
              >
                <Switch
                  aria-label="Quiet Slack posts"
                  checked={form.quietSlackPosts ?? false}
                  onCheckedChange={(quietSlackPosts) =>
                    setForm({ ...form, quietSlackPosts })
                  }
                />
              </SettingsRow>
            </Card>
          </div>
          {project === undefined ? (
            <EditorSections {...sections} />
          ) : (
            <ProjectEditorSections
              orgId={orgId}
              projectId={project.id}
              {...sections}
            />
          )}
        </div>
      </ScrollArea>
    </NewAutomationShell>
  );
}

type ProjectEditorSectionsProps = EditorSectionsProps & {
  readonly orgId: string;
  readonly projectId: string;
};

/** The sections plus the project's machine size, which each run inherits until someone overrides it. */
function ProjectEditorSections({
  orgId,
  projectId,
  ...sections
}: ProjectEditorSectionsProps) {
  const setup = resultValue(
    useAtomValue(projectSetupAtom(projectKey(orgId as OrgId, projectId))),
  );
  return (
    <EditorSections {...sections} machineSizeDefault={setup?.machineSize} />
  );
}
