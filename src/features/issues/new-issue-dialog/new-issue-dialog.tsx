import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { useRef, useState } from "react";
import { PlusLargeGlyph } from "@/components/issue-pickers";
import type { ProjectId } from "@/data/api/schemas/ids";
import type { IssueDetail } from "@/data/api/schemas/issue";
import type { Project } from "@/data/api/schemas/project";
import { reactivityKeys } from "@/data/atoms/conventions";
import { idleAtom } from "@/data/atoms/idle";
import { createIssueAtom } from "@/data/atoms/issues";
import { projectsAtom } from "@/data/atoms/projects";
import { organizationsAtom } from "@/data/atoms/session";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { useIssueOrgId } from "../issue-parts";
import { useIssueStates } from "../issue-pickers";
import { AccessButton } from "./access-button";
import { accentButton, ghostIconButton, switchRoot } from "./classes";
import {
  canCreateIssue,
  createIssueRequest,
  defaultIssueState,
  emptyNewIssueDraft,
  localToday,
  type NewIssueDraft,
} from "./new-issue";
import {
  AssigneePill,
  DueDatePill,
  LabelsPill,
  PriorityPill,
  StatusPill,
} from "./pill-pickers";
import { ProjectPicker } from "./project-picker";
import "./new-issue-dialog.css";

export interface NewIssueDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Called with the new issue once the dialog closes after creating it. */
  readonly onCreated?: (detail: IssueDetail) => void;
  /** The project to start in; defaults to the first project. */
  readonly defaultProjectId?: ProjectId;
}

const failureMessage = (error: unknown) =>
  error instanceof Error && error.message !== ""
    ? error.message
    : "Could not create the issue";

const idleProjects = idleAtom<readonly Project[]>();

export function NewIssueDialog({
  open,
  onOpenChange,
  onCreated,
  defaultProjectId,
}: NewIssueDialogProps) {
  const orgId = useIssueOrgId();
  const organizations = useAtomValue(organizationsAtom);
  const orgName = AsyncResult.isSuccess(organizations)
    ? organizations.value.find((org) => org.id === orgId)?.name
    : undefined;
  const projectsResult = useAtomValue(
    orgId === undefined ? idleProjects : projectsAtom(orgId),
  );
  const projects =
    orgId !== undefined && AsyncResult.isSuccess(projectsResult)
      ? projectsResult.value.filter((project) => !project.deleted)
      : [];
  const states = useIssueStates(orgId);
  const create = useAtomSet(createIssueAtom, { mode: "promise" });
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<NewIssueDraft>(() =>
    emptyNewIssueDraft(defaultProjectId),
  );
  const [createMore, setCreateMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const project =
    projects.find((each) => each.id === draft.projectId) ?? projects[0];
  const today = localToday(new Date());
  const update = (patch: Partial<NewIssueDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const reset = () =>
    setDraft((current) => emptyNewIssueDraft(current.projectId));

  const ready = canCreateIssue({ ...draft, projectId: project?.id }, creating);

  const submit = () => {
    if (!ready || orgId === undefined || project === undefined) return;
    setCreating(true);
    create({
      params: { orgId },
      payload: createIssueRequest({ ...draft, projectId: project.id }),
      reactivityKeys: [reactivityKeys.issues(orgId)],
    })
      .then((detail) => {
        reset();
        if (createMore) {
          toast.success(`Created ${detail.issue.code}`);
          titleRef.current?.focus();
          return;
        }
        onOpenChange(false);
        onCreated?.(detail);
      })
      .catch((error: unknown) => toast.error(failureMessage(error)))
      .finally(() => setCreating(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (creating) return;
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="new-issue-dialog max-w-2xl!">
        <div className="flex items-center gap-1.5 px-5 pt-4">
          <ProjectPicker
            projects={projects}
            value={project}
            onValueChange={(next) => update({ projectId: next.id })}
          />
          <Icon name="chevron-right" size="xs" className="text-icon-muted" />
          <DialogTitle className="text-sm font-medium text-foreground">
            New issue
          </DialogTitle>
          <DialogClose
            render={
              <button
                type="button"
                aria-label="Close"
                className={cx(ghostIconButton, "-mr-1.5 ml-auto")}
              >
                <Icon name="x" />
              </button>
            }
          />
        </div>
        <div className="flex flex-col gap-2 px-5 pt-4 pb-3">
          <input
            ref={titleRef}
            value={draft.title}
            placeholder="Issue title"
            aria-label="Issue title"
            autoFocus
            className="w-full min-w-0 bg-transparent text-lg leading-tight font-medium text-foreground outline-none placeholder:text-muted-foreground-3"
            onChange={(event) => update({ title: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing)
                submit();
            }}
          />
          <textarea
            value={draft.description}
            placeholder="Add description"
            aria-label="Description"
            className="block field-sizing-content min-h-16 w-full min-w-0 resize-none bg-transparent text-base leading-snug font-normal text-foreground outline-none placeholder:text-muted-foreground-3"
            onChange={(event) => update({ description: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
                submit();
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
          <StatusPill
            orgId={orgId}
            stateId={draft.stateId ?? defaultIssueState(states)?.id}
            onPick={(stateId) => update({ stateId })}
          />
          <PriorityPill
            priority={draft.priority}
            onPick={(priority) => update({ priority })}
          />
          <AssigneePill
            assignee={draft.assignee}
            onChange={(assignee) => update({ assignee })}
          />
          <DueDatePill
            value={draft.dueAt}
            today={today}
            onChange={(dueAt) => update({ dueAt })}
          />
          <LabelsPill
            orgId={orgId}
            labelIds={draft.labelIds}
            onChange={(labelIds) => update({ labelIds })}
          />
          <AccessButton
            visibility={draft.access}
            orgName={orgName}
            onChange={(access) => update({ access })}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t-hairline border-border-1 px-5 pt-2 pb-4">
          <button
            type="button"
            aria-label="Add attachment"
            className={cx(ghostIconButton, "-ml-1.5")}
          >
            <PlusLargeGlyph />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Dictate"
              className={ghostIconButton}
            >
              <Icon name="microphone" />
            </button>
            <div className="ml-2 flex items-center gap-3">
              {/* biome-ignore lint/a11y/noLabelWithoutControl: the Switch renders the control inside the label */}
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground-1 select-none">
                <Switch
                  className={switchRoot}
                  checked={createMore}
                  onCheckedChange={setCreateMore}
                />
                Create more
              </label>
              <button
                type="button"
                className={accentButton}
                disabled={!ready}
                aria-busy={creating}
                onClick={submit}
              >
                {creating ? "Creating" : "Create issue"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
