import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { ModelPicker } from "@/components/model-picker";
import { ProjectSelect } from "@/components/project-select";
import { RunOnSelect } from "@/components/run-on-select";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import {
  archiveJamsAtom,
  captainReactivityKeys,
  createCaptainAtom,
  deleteCaptainAtom,
  demoteCaptainAtom,
  promoteFolderAtom,
  promoteThreadAtom,
  unarchiveJamsAtom,
  updateCaptainAtom,
} from "@/data/atoms/captains";
import { reactivityKeys } from "@/data/atoms/conventions";
import { projectsAtom } from "@/data/atoms/projects";
import { Button } from "@/primitives/button";
import { Dialog, DialogContent } from "@/primitives/dialog";
import { type DialogPageSpec, DialogPages } from "@/primitives/dialog-pages";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Textarea } from "@/primitives/textarea";
import {
  type CaptainAvatarValue,
  defaultCaptainName,
  randomCaptainAvatar,
} from "./avatar";
import { AvatarPopover } from "./avatar-popover";
import { CaptainAvatar } from "./captain-avatar";
import {
  type CaptainDialogPage,
  type CaptainDialogRequest,
  captainInviteLimit,
  createdCaptain,
  crewCountLabel,
  deleteLines,
  demoteLines,
  dialogTitle,
  displayName,
  errorDescription,
  initialName,
  initialVisibility,
  profileChanges,
  singleLine,
  submitLabel,
  submitLoadingLabel,
} from "./captain-dialog-model";
import { CrewDeviceSelect } from "./crew-device-select";
import { useCurrentUserId, useOrgId } from "./session";

const rowClass = "flex min-h-11 items-center justify-between gap-3";
const rowLabelClass = "text-sm font-medium text-foreground";
const rowValueClass = "text-sm text-muted-foreground-1";
const linesClass = "flex flex-col gap-1 text-sm text-muted-foreground-2";
const chevronClass = "size-(--icon-sm) shrink-0 text-muted-foreground-3";

function Lines({ lines }: { lines: ReadonlyArray<string> }) {
  return (
    <div className={linesClass}>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}

export type CaptainDialogProps = {
  request: CaptainDialogRequest;
  onClose: () => void;
};

/** Capy's CaptainDialog: create, promote and edit a Captain, with its demote and delete pages. */
export function CaptainDialog(props: CaptainDialogProps) {
  const orgId = useOrgId();
  return orgId === undefined ? null : (
    <CaptainDialogForm orgId={orgId} {...props} />
  );
}

function CaptainDialogForm({
  orgId,
  request,
  onClose,
}: CaptainDialogProps & { orgId: OrgId }) {
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  const projectsResult = useAtomValue(projectsAtom(orgId));
  const projects = AsyncResult.isSuccess(projectsResult)
    ? projectsResult.value.filter((project) => !project.deleted)
    : [];
  const create = useAtomSet(createCaptainAtom, { mode: "promise" });
  const update = useAtomSet(updateCaptainAtom, { mode: "promise" });
  const promoteThread = useAtomSet(promoteThreadAtom, { mode: "promise" });
  const promoteFolder = useAtomSet(promoteFolderAtom, { mode: "promise" });
  const remove = useAtomSet(deleteCaptainAtom, { mode: "promise" });
  const demote = useAtomSet(demoteCaptainAtom, { mode: "promise" });
  const archive = useAtomSet(archiveJamsAtom, { mode: "promise" });
  const unarchive = useAtomSet(unarchiveJamsAtom, { mode: "promise" });

  const edit = request.kind === "edit" ? request : undefined;
  const profile = edit?.profile;
  const role = profile?.viewerRole ?? "owner";
  const isOwner = role === "owner";
  const archived = profile?.archived === true;
  const ownerUserId = profile?.ownerUserId ?? userId;

  const [page, setPage] = useState<CaptainDialogPage>(
    edit !== undefined && edit.entry !== undefined ? edit.entry : "profile",
  );
  const [name, setName] = useState(() => initialName(request));
  const [alias, setAlias] = useState(profile?.alias ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [avatar, setAvatar] = useState<CaptainAvatarValue>(
    () => profile?.avatar ?? randomCaptainAvatar(),
  );
  const [crewDeviceId, setCrewDeviceId] = useState<string | null>(
    profile?.crewDevice?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const visibility = initialVisibility(request);
  const project =
    request.kind === "promote-thread"
      ? projects.find((row) => row.id === request.thread.projectId)
      : projects[0];
  const invitees =
    request.kind === "promote-thread"
      ? (request.thread.memberIds ?? [])
      : request.kind === "promote-folder"
        ? (request.folder.memberIds ?? [])
        : [];
  const userIds = invitees.filter((id) => id !== ownerUserId);
  const tooMany = userIds.length > captainInviteLimit;
  const changes =
    profile === undefined
      ? undefined
      : profileChanges(profile, {
          name,
          alias,
          description,
          avatar,
          crewDeviceId,
        });
  const canSave = request.kind !== "edit" || changes !== undefined;
  const invalidation = (jamId?: string) => [
    reactivityKeys.captains(orgId),
    reactivityKeys.threads(orgId),
    reactivityKeys.threadOrganization(orgId),
    ...(jamId === undefined
      ? []
      : [
          captainReactivityKeys.captain(jamId),
          captainReactivityKeys.jam(jamId),
          captainReactivityKeys.jamEvent(jamId),
        ]),
  ];

  const submit = () => {
    const finalName = name.trim() || defaultCaptainName;
    if (busy) return;
    if (edit !== undefined) {
      if (changes === undefined || name.trim() === "") return;
      setBusy(true);
      update({
        params: { orgId, jamId: edit.jamId },
        payload: changes,
        reactivityKeys: invalidation(edit.jamId),
      })
        .then(() => {
          onClose();
          toast.success("Captain updated", { description: finalName });
        })
        .catch((error: unknown) => {
          setBusy(false);
          toast.error("Could not update Captain", {
            description: errorDescription(error, finalName),
          });
        });
      return;
    }
    if (tooMany) return;
    setBusy(true);
    const keys = invalidation();
    const pending =
      request.kind === "promote-thread"
        ? promoteThread({
            params: { orgId },
            payload: {
              thread_id: request.thread.id,
              name: finalName,
              avatar,
              visibility,
              userIds: userIds.length === 0 ? undefined : userIds,
            },
            reactivityKeys: [
              ...keys,
              captainReactivityKeys.jam(request.thread.id),
              captainReactivityKeys.captain(request.thread.id),
            ],
          })
        : project === undefined
          ? Promise.reject(new Error("No project"))
          : request.kind === "promote-folder"
            ? promoteFolder({
                params: { orgId },
                payload: {
                  folder_id: request.folder.id,
                  name: finalName,
                  avatar,
                  projectId: project.id,
                  visibility,
                  userIds,
                },
                reactivityKeys: [
                  ...keys,
                  captainReactivityKeys.threadFolder(orgId),
                  captainReactivityKeys.threadFolderItem(orgId),
                ],
              })
            : create({
                params: { orgId },
                payload: {
                  name: finalName,
                  avatar,
                  projectId: project.id,
                  visibility,
                  userIds,
                },
                reactivityKeys: keys,
              });
    pending
      .then((result: unknown) => {
        const created = createdCaptain(result, finalName);
        onClose();
        toast.success(
          request.kind === "create" ? "Captain created" : "Promoted to Captain",
          { description: created.name },
        );
        if (created.jamId !== undefined)
          navigate({
            to: "/thread/$threadId",
            params: { threadId: created.jamId as JamId },
          });
      })
      .catch((error: unknown) => {
        setBusy(false);
        toast.error(
          request.kind === "promote-thread"
            ? "Could not promote to Captain"
            : "Could not create Captain",
          { description: errorDescription(error, finalName) },
        );
      });
  };

  const runDelete = () => {
    if (edit === undefined) return;
    onClose();
    remove({
      params: { orgId, jamId: edit.jamId },
      reactivityKeys: invalidation(edit.jamId),
    })
      .then(() => {
        toast.success("Captain deleted", { description: edit.profile.name });
        navigate({ to: "/" });
      })
      .catch(() =>
        toast.error("Could not delete Captain", {
          description: edit.profile.name,
        }),
      );
  };

  const runDemote = () => {
    if (edit === undefined) return;
    setBusy(true);
    demote({
      params: { orgId, jamId: edit.jamId },
      reactivityKeys: invalidation(edit.jamId),
    })
      .then(() => {
        onClose();
        toast.success("Demoted to thread", { description: edit.profile.name });
      })
      .catch((error: unknown) => {
        setBusy(false);
        toast.error("Could not demote Captain", {
          description: errorDescription(error, edit.profile.name),
        });
      });
  };

  const runArchive = (next: boolean) => {
    if (edit === undefined) return;
    setBusy(true);
    (next ? archive : unarchive)({
      params: { orgId },
      payload: { jamIds: [edit.jamId] },
      reactivityKeys: invalidation(edit.jamId),
    })
      .then(() => {
        onClose();
        toast.success(next ? "Captain archived" : "Captain unarchived", {
          description: edit.profile.name,
        });
        if (next) navigate({ to: "/" });
      })
      .catch(() => {
        setBusy(false);
        toast.error(
          next ? "Could not archive Captain" : "Could not unarchive Captain",
          {
            description: edit.profile.name,
          },
        );
      });
  };

  const avatarView = (
    <CaptainAvatar avatar={avatar} name={displayName(name)} size="2xl" />
  );
  const back = () => setPage("profile");
  const submitButton = isOwner ? (
    <Button
      className="ml-auto"
      intent="accent"
      type="submit"
      aria-busy={busy || undefined}
      disabled={
        busy ||
        tooMany ||
        (request.kind === "edit"
          ? !canSave || name.trim() === ""
          : request.kind !== "promote-thread" && project === undefined)
      }
    >
      {busy ? submitLoadingLabel(request.kind) : submitLabel(request.kind)}
    </Button>
  ) : (
    <Button variant="ghost" type="button" onClick={onClose}>
      Close
    </Button>
  );

  const rows =
    edit !== undefined && profile !== undefined ? (
      <>
        <div className={rowClass}>
          <span className={rowLabelClass}>Alias</span>
          {isOwner ? (
            <Input
              variant="blank"
              size="sm"
              className="flex-1 px-0 text-right"
              aria-label="Alias"
              value={alias}
              placeholder="Short name for Slack"
              maxLength={32}
              onChange={(event) => setAlias(event.target.value)}
            />
          ) : (
            <span className={cx("min-w-0 truncate", rowValueClass)}>
              {(profile.alias ?? "") === "" ? "None" : profile.alias}
            </span>
          )}
        </div>
        {isOwner ? (
          <div>
            <button
              type="button"
              className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-6 rounded text-sm outline-none focus-visible:outline-ring-inset"
              onClick={() => setPage("description")}
            >
              <span className="shrink-0 font-medium text-foreground">
                Description
              </span>
              <span className="flex min-w-0 max-w-3/5 items-center gap-1">
                <span
                  className={cx(
                    "min-w-0 truncate",
                    description.trim() === ""
                      ? "text-muted-foreground-3"
                      : "text-muted-foreground-1",
                  )}
                >
                  {description.trim() === "" ? "Add" : description}
                </span>
                <Icon name="chevron-right-small" className={chevronClass} />
              </span>
            </button>
          </div>
        ) : (
          <div className={rowClass}>
            <span className={cx("shrink-0", rowLabelClass)}>Description</span>
            <span className={cx("min-w-0 py-2 text-right", rowValueClass)}>
              {(profile.description ?? "") === ""
                ? "None"
                : profile.description}
            </span>
          </div>
        )}
        <div className={rowClass}>
          <span className={rowLabelClass}>Project</span>
          <span className={rowValueClass}>
            {profile.projectName ?? "No project"}
          </span>
        </div>
        <div className={rowClass}>
          <span className={rowLabelClass}>Crew runs on</span>
          <CrewDeviceSelect
            value={crewDeviceId}
            savedName={profile.crewDevice?.name}
            devices={edit.devices ?? []}
            disabled={!isOwner}
            onChange={setCrewDeviceId}
          />
        </div>
        <div className={rowClass}>
          <span className={rowLabelClass}>Crew</span>
          <span className={cx(rowValueClass, "tabular-nums")}>
            {crewCountLabel(profile.crew.length)}
          </span>
        </div>
        <div className={rowClass}>
          <span className={rowLabelClass}>Owner</span>
          <span
            className={cx("flex min-w-0 items-center gap-2", rowValueClass)}
          >
            <span className="min-w-0 truncate">
              {profile.ownerName ?? profile.ownerUserId}
            </span>
          </span>
        </div>
      </>
    ) : request.kind === "promote-thread" ? null : (
      <>
        <div className={rowClass}>
          <span className={rowLabelClass}>Project</span>
          <ProjectSelect />
        </div>
        {request.kind === "create" ? (
          <div className={rowClass}>
            <span className={rowLabelClass}>Machine</span>
            <RunOnSelect />
          </div>
        ) : null}
        <div className={rowClass}>
          <span className={rowLabelClass}>Model</span>
          <ModelPicker />
        </div>
      </>
    );

  const editActions =
    edit !== undefined && role !== "none" ? (
      <span className="flex items-center gap-2">
        {isOwner ? (
          <>
            <Button
              intent="danger"
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => setPage("delete")}
            >
              Delete Captain
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => setPage("demote")}
            >
              Demote
            </Button>
          </>
        ) : null}
        <Button
          variant="outline"
          type="button"
          disabled={busy}
          onClick={() => runArchive(!archived)}
        >
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </span>
    ) : null;

  const pages: Record<CaptainDialogPage, DialogPageSpec> = {
    profile: {
      title: dialogTitle(request),
      spacing: "relaxed",
      bodyClassName: "items-center",
      body: (
        <>
          {isOwner ? (
            <AvatarPopover value={avatar} onChange={setAvatar}>
              <button
                type="button"
                aria-label="Change avatar"
                className="grid size-20 cursor-pointer place-items-center rounded outline-none focus-visible:outline-ring-inset"
              >
                {avatarView}
              </button>
            </AvatarPopover>
          ) : (
            <span className="grid size-20 place-items-center">
              {avatarView}
            </span>
          )}
          <Input
            variant="blank"
            aria-label="Name"
            value={name}
            placeholder={defaultCaptainName}
            maxLength={100}
            autoFocus={isOwner}
            disabled={!isOwner}
            className="h-9 w-full text-center text-xl font-medium disabled:opacity-100"
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex w-full flex-col divide-y-hairline divide-border-1">
            {rows}
            {request.kind === "promote-thread" && invitees.length > 0 ? (
              <span className="text-sm text-muted-foreground-2">
                Everyone on this thread stays a member
              </span>
            ) : null}
            {tooMany ? (
              <span className="text-sm text-destructive">
                A Captain invites at most 200 people
              </span>
            ) : null}
          </div>
        </>
      ),
      footerClassName:
        edit !== undefined && role !== "none"
          ? "flex-wrap justify-between"
          : undefined,
      footer: (
        <>
          {editActions}
          {submitButton}
        </>
      ),
    },
    description: {
      title: "Description",
      body: (
        <div className="flex w-full flex-col gap-2">
          <Textarea
            variant="blank"
            rows={3}
            autoFocus
            className="min-h-20"
            aria-label="Description"
            value={description}
            placeholder="Whose Captain this is and what it covers"
            maxLength={140}
            onChange={(event) => setDescription(singleLine(event.target.value))}
          />
          <span className="self-end text-xs text-muted-foreground-2 tabular-nums">
            {`${description.length}/140`}
          </span>
        </div>
      ),
      footer: (
        <Button
          intent="accent"
          type="submit"
          disabled={busy || tooMany || !canSave || name.trim() === ""}
        >
          {busy ? "Saving" : "Save"}
        </Button>
      ),
    },
    demote: {
      title: "Demote to thread",
      body:
        profile === undefined ? null : <Lines lines={demoteLines(profile)} />,
      footer: (
        <>
          <Button variant="ghost" type="button" onClick={back}>
            Cancel
          </Button>
          <Button
            intent="danger"
            type="button"
            disabled={busy}
            onClick={runDemote}
          >
            {busy ? "Demoting" : "Demote"}
          </Button>
        </>
      ),
    },
    delete: {
      title: "Delete Captain",
      body:
        profile === undefined ? null : <Lines lines={deleteLines(profile)} />,
      footer: (
        <>
          <Button variant="ghost" type="button" onClick={back}>
            Cancel
          </Button>
          {edit !== undefined && !archived ? (
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => runArchive(true)}
            >
              Archive instead
            </Button>
          ) : null}
          <Button
            intent="danger"
            type="button"
            disabled={busy}
            onClick={runDelete}
          >
            Delete
          </Button>
        </>
      ),
    },
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (page === "profile" || page === "description") submit();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <form className="flex min-h-0 flex-col" onSubmit={onSubmit}>
          <DialogPages page={page} root="profile" pages={pages} onBack={back} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
