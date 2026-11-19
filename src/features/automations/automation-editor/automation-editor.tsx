import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { useMachineUsage } from "@/components/machine-usage";
import type { OrgId } from "@/data/api/schemas/ids";
import type { Project } from "@/data/api/schemas/project";
import { projectKey, projectSetupAtom } from "@/data/atoms/project-settings";
import { projectsAtom } from "@/data/atoms/projects";
import { jsonPayload } from "@/data/client/json";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { AutomationUsageSection } from "../automation-usage";
import { OwnerSelect } from "../owner-select";
import { RunsInRows, RunsInSelect, useProjectThreads } from "../runs-in-select";
import { AutomationBatchesSection } from "../webhook-batches";
import {
  automationAtom,
  automationKey,
  automationKeys,
  createAutomationAtom,
  deleteAutomationAtom,
  disableAutomationAtom,
  enableAutomationAtom,
  restoreAutomationAtom,
  triggerAutomationAtom,
  updateAutomationAtom,
} from "./atoms";
import { AutomationDriveRow } from "./drive-row";
import { EditorSections, type EditorSectionsProps } from "./editor-sections";
import {
  ArrowShareRight,
  ChevronRightSmall,
  DotsHorizontal,
  TrashCan,
} from "./icons";
import {
  type Automation,
  applyRunWhen,
  canSave,
  type EditorForm,
  effectiveRunAs,
  formFromAutomation,
  isDirty,
  mixedRunWhen,
  savedAutomation,
  updatePayload,
  withRunAs,
} from "./model";
import {
  chevronClass,
  menuIconClass,
  menuTrailingClass,
  PersonAvatar,
} from "./parts";
import { readAutomation } from "./read";
import { resultValue, useOrgId } from "./use-org";

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

export type AutomationEditorPageProps = { automationId: string };

export function AutomationEditorPage({
  automationId,
}: AutomationEditorPageProps) {
  const orgId = useOrgId();
  const result = useAtomValue(
    automationAtom(automationKey(orgId ?? "", automationId)),
  );
  const projects =
    resultValue(useAtomValue(projectsAtom((orgId ?? "") as OrgId))) ?? [];
  const automation = readAutomation(resultValue(result));
  if (orgId !== undefined && automation !== undefined)
    return (
      <AutomationEditor
        key={automation.id}
        orgId={orgId}
        automation={automation}
        projects={projects}
      />
    );
  if (orgId === undefined || AsyncResult.isInitial(result) || result.waiting)
    return (
      <div className="flex h-full min-h-0 flex-col">
        <AppTopBar>
          <TopBarTitle>Automations</TopBarTitle>
        </AppTopBar>
      </div>
    );
  return <AutomationNotFound />;
}

function TopBarTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
      {children}
    </h1>
  );
}

export function AutomationNotFound() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AppTopBar>
        <TopBarTitle>Automations</TopBarTitle>
      </AppTopBar>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
        <span className="text-sm font-medium text-foreground">
          Automation not found
        </span>
        <span className="text-sm font-normal text-muted-foreground-2">
          It may have been deleted, head back to automations
        </span>
        <Button variant="ghost" render={<Link to="/automations" />}>
          Back to automations
        </Button>
      </div>
    </div>
  );
}

/** The sections plus the project's machine size, which each run inherits until someone overrides it. */
function ProjectEditorSections({
  orgId,
  projectId,
  ...sections
}: EditorSectionsProps & { orgId: string; projectId: string }) {
  const setup = resultValue(
    useAtomValue(projectSetupAtom(projectKey(orgId as OrgId, projectId))),
  );
  return (
    <EditorSections {...sections} machineSizeDefault={setup?.machineSize} />
  );
}

export type AutomationEditorProps = {
  orgId: string;
  automation: Automation;
  projects: ReadonlyArray<Project>;
};

export function AutomationEditor({
  orgId,
  automation,
  projects,
}: AutomationEditorProps) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(automation);
  const [saved, setSaved] = useState(() => formFromAutomation(automation));
  const [form, setForm] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useAtomSet(updateAutomationAtom, { mode: "promise" });
  const create = useAtomSet(createAutomationAtom, { mode: "promise" });
  const enable = useAtomSet(enableAutomationAtom, { mode: "promise" });
  const disable = useAtomSet(disableAutomationAtom, { mode: "promise" });
  const remove = useAtomSet(deleteAutomationAtom, { mode: "promise" });
  const restore = useAtomSet(restoreAutomationAtom, { mode: "promise" });
  const run = useAtomSet(triggerAutomationAtom, { mode: "promise" });
  const project =
    projects.find((candidate) => candidate.id === current.projectId) ??
    projects[0];
  const threads = useProjectThreads(project?.id);
  const machineUsage = useMachineUsage(orgId);
  const runAs = effectiveRunAs(form, current);
  const serviceRunAs = runAs.kind === "service";
  const params = { orgId, automationId: current.id };
  const reactivityKeys = [
    automationKeys.list(orgId),
    automationKeys.one(current.id),
  ];
  const name = form.name.trim() === "" ? "Automation" : form.name;

  const save = () => {
    if (saving || !canSave(form)) return;
    const triggers = applyRunWhen(
      form.triggers,
      form.runWhen,
      form.runWhen === saved.runWhen,
    );
    const next = savedAutomation(current, form, triggers, new Date());
    setSaving(true);
    update({
      params,
      payload: jsonPayload(updatePayload(next, current, form)),
      reactivityKeys,
    })
      .then(
        () => {
          const savedForm = { ...form, triggers };
          setCurrent(next);
          setForm(savedForm);
          setSaved(savedForm);
          toast.success("Automation updated", {
            description: form.name.trim(),
          });
        },
        (error: unknown) =>
          toast.error(errorMessage(error, "Could not save"), {
            description: next.name,
          }),
      )
      .finally(() => setSaving(false));
  };

  const setEnabled = (enabled: boolean) => {
    const previous = current;
    setCurrent({ ...current, enabled });
    (enabled ? enable : disable)({ params, reactivityKeys }).catch(
      (error: unknown) => {
        setCurrent(previous);
        toast.error(
          errorMessage(
            error,
            enabled ? "Could not enable" : "Could not disable",
          ),
          {
            description: previous.name,
          },
        );
      },
    );
  };

  const duplicateTo = (target: Project) =>
    create({
      params: { orgId },
      payload: {
        ...current,
        projectId: target.id,
        enabled: false,
        runAsKind: "human",
        runAsId: "",
        singleJamId: null,
      },
      reactivityKeys: [automationKeys.list(orgId)],
    }).then(
      () =>
        toast.success("Automation duplicated", { description: target.name }),
      (error: unknown) =>
        toast.error(errorMessage(error, "Could not duplicate"), {
          description: target.name,
        }),
    );

  const confirmDelete = () => {
    const listKeys = [automationKeys.list(orgId)];
    remove({ params, reactivityKeys: listKeys }).catch((error: unknown) =>
      toast.error(errorMessage(error, "Could not delete"), {
        description: current.name,
      }),
    );
    toast.success("Automation deleted", {
      description: current.name,
      action: {
        label: "Undo",
        onClick: () =>
          restore({ params, reactivityKeys: listKeys }).catch(
            (error: unknown) =>
              toast.error(errorMessage(error, "Could not restore"), {
                description: current.name,
              }),
          ),
      },
    });
    navigate({ to: "/automations" });
  };

  const runNow = () =>
    run({ params, payload: {}, reactivityKeys }).catch((error: unknown) =>
      toast.error(errorMessage(error, "Could not run"), {
        description: current.name,
      }),
    );

  const setFormTo = (next: EditorForm) => setForm(next);

  return (
    <div className="flex h-full min-h-0 flex-col">
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
            <span className="min-w-0 truncate">{name}</span>
          </span>
        </h1>
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Automation actions"
                />
              }
            >
              <DotsHorizontal />
            </MenuTrigger>
            <MenuContent align="end" className="w-52">
              <MenuItem onClick={runNow}>
                <span className={menuIconClass}>
                  <Icon name="play-outline" />
                </span>
                Run now
              </MenuItem>
              <MenuSub>
                <MenuSubTrigger>
                  <span className={menuIconClass}>
                    <ArrowShareRight />
                  </span>
                  Duplicate to
                  <span className={menuTrailingClass}>
                    <ChevronRightSmall className={chevronClass} />
                  </span>
                </MenuSubTrigger>
                <MenuContent className="w-52">
                  {projects.map((target) => (
                    <MenuItem
                      key={target.id}
                      onClick={() => duplicateTo(target)}
                    >
                      {target.name}
                    </MenuItem>
                  ))}
                </MenuContent>
              </MenuSub>
              <MenuSeparator />
              <MenuItem intent="danger" onClick={() => setDeleteOpen(true)}>
                <span className={menuIconClass}>
                  <TrashCan />
                </span>
                Delete
              </MenuItem>
            </MenuContent>
          </Menu>
          {current.singleJamId === null ? (
            <Button
              variant="outline"
              render={
                <Link to="/threads" search={{ automation: current.id }} />
              }
            >
              View runs
            </Button>
          ) : (
            <Button
              variant="outline"
              render={
                <Link
                  to="/thread/$threadId"
                  params={{ threadId: current.singleJamId }}
                />
              }
            >
              Open thread
            </Button>
          )}
          <Button
            aria-busy={saving || undefined}
            disabled={saving || !isDirty(form, saved) || !canSave(form)}
            onClick={save}
          >
            Save
          </Button>
        </div>
      </AppTopBar>
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="h-full overscroll-contain">
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
              <div className="flex items-center gap-3 max-sm:flex-wrap max-sm:gap-y-2">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: the Switch renders the control inside the label, as in Capy */}
                <label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground-1 select-none">
                  <Switch
                    checked={current.enabled}
                    aria-label={
                      current.enabled
                        ? "Disable automation"
                        : "Enable automation"
                    }
                    onCheckedChange={setEnabled}
                  />
                  {current.enabled ? "Active" : "Disabled"}
                </label>
                <span
                  aria-hidden
                  data-slot="separator"
                  className="h-3.5 w-px shrink-0 bg-border-1 max-sm:hidden"
                />
                <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground-2">
                  <PersonAvatar name={current.creator} src={null} />
                  By {current.creator}
                </span>
              </div>
              <Card rows className="-mx-4 mt-3">
                <RunsInRows
                  runsIn={form.runsIn}
                  thread={threads.find(
                    (thread) => thread.id === form.runsIn.singleJamId,
                  )}
                  control={
                    <RunsInSelect
                      value={form.runsIn}
                      projectId={project?.id}
                      automationId={current.id}
                      offerStanding={current.singleJamId === null}
                      onValueChange={(runsIn) => setForm({ ...form, runsIn })}
                    />
                  }
                  project={
                    project === undefined ? null : (
                      <span className="flex items-center gap-1.5 text-sm font-normal text-foreground">
                        {project.name}
                      </span>
                    )
                  }
                />
                <SettingsRow
                  label="Runs as"
                  description="Each run uses this person's access, models and bill"
                >
                  <OwnerSelect
                    value={runAs}
                    fallbackLabel={
                      current.runAsKind === "service"
                        ? "Service user"
                        : current.runAsId === ""
                          ? "Owner"
                          : current.creator || current.runAsId
                    }
                    onValueChange={(value) => setForm(withRunAs(form, value))}
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
              <EditorSections
                form={form}
                setForm={setFormTo}
                mixedRunWhen={mixedRunWhen(current.triggers)}
                serviceRunAs={serviceRunAs}
                folders={[]}
                tags={[]}
                machineUsage={machineUsage}
              />
            ) : (
              <ProjectEditorSections
                orgId={orgId}
                projectId={project.id}
                form={form}
                setForm={setFormTo}
                mixedRunWhen={mixedRunWhen(current.triggers)}
                serviceRunAs={serviceRunAs}
                folders={[]}
                tags={[]}
                machineUsage={machineUsage}
              />
            )}
            <AutomationBatchesSection
              automationId={current.id}
              hasWebhook={current.triggers.some(
                (trigger) => trigger.type === "incoming_webhook",
              )}
            />
            <AutomationUsageSection orgId={orgId} automationId={current.id} />
            <AutomationDriveRow automationId={current.id} title={name} />
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete automation</DialogTitle>
            <DialogDescription>
              Deletion stops future runs, past runs and their threads stay
              readable
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              intent="danger"
              onClick={() => {
                setDeleteOpen(false);
                confirmDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
