import { Field } from "@base-ui/react/field";
import {
  useAtom,
  useAtomRefresh,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult, Atom } from "effect/reactivity";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AvatarEditor } from "@/components/avatar-editor";
import { ChoiceRow, ChoiceRowGroup } from "@/components/choice-row";
import { OrgId } from "@/data/api/schemas/ids";
import {
  acceptInvitationAtom,
  joinByDomainAtom,
} from "@/data/atoms/invitations";
import {
  createOrganizationAtom,
  joinableOrganizationsAtom,
  myInvitationsAtom,
} from "@/data/atoms/onboarding";
import {
  presignOrganizationAvatarAtom,
  updateOrganizationAvatarAtom,
} from "@/data/atoms/organizations";
import { organizationsAtom } from "@/data/atoms/session";
import { openCommandPalette } from "@/lib/command-palette-events";
import { readAvatarUploadTarget, uploadToTarget } from "@/lib/upload";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { SettingsRow } from "@/primitives/settings-row";
import { JoinOrganizationChoices } from "./join-organization-choices";
import {
  dialogCopy,
  initialOrganizationDialogState,
  type JoinableOrganization,
  joinTarget,
  joinTargetName,
  type OrganizationDialogState,
  type OrganizationDialogStep,
  type OrganizationInvitation,
  readInvitations,
  readJoinableOrganizations,
} from "./state";

/** Whether the create-or-join organization dialog is open. */
export const organizationDialogOpenAtom = Atom.make(false);

export type OrganizationDialogViewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitations: ReadonlyArray<OrganizationInvitation> | undefined;
  organizations: ReadonlyArray<JoinableOrganization> | undefined;
  invitationsFailed?: boolean;
  organizationsFailed?: boolean;
  onRetryInvitations: () => void;
  onRetryOrganizations: () => void;
  onCreate: (name: string, image: File | null) => Promise<unknown>;
  onJoinInvitation: (invitation: OrganizationInvitation) => Promise<unknown>;
  onJoinOrganization: (organization: JoinableOrganization) => Promise<unknown>;
  initialStep?: OrganizationDialogStep;
};

export function OrganizationDialogView({
  open,
  onOpenChange,
  invitations,
  organizations,
  invitationsFailed = false,
  organizationsFailed = false,
  onRetryInvitations,
  onRetryOrganizations,
  onCreate,
  onJoinInvitation,
  onJoinOrganization,
  initialStep = "choose",
}: OrganizationDialogViewProps) {
  const [state, setState] = useState<OrganizationDialogState>(() =>
    initialOrganizationDialogState(initialStep),
  );
  const reader = useRef<FileReader | null>(null);
  useEffect(() => () => reader.current?.abort(), []);

  const reset = () => {
    reader.current?.abort();
    reader.current = null;
    setState(initialOrganizationDialogState("choose"));
  };
  const changeOpen = (next: boolean) => {
    if (next || state.busy === null) onOpenChange(next);
  };
  const close = () => onOpenChange(false);

  const chooseImage = (file: File) => {
    reader.current?.abort();
    const next = new FileReader();
    reader.current = next;
    setState((current) => ({ ...current, avatar: { file, previewUrl: null } }));
    next.addEventListener(
      "load",
      () => {
        const result = next.result;
        if (typeof result !== "string") return;
        setState((current) =>
          current.avatar?.file === file
            ? { ...current, avatar: { file, previewUrl: result } }
            : current,
        );
        reader.current = null;
      },
      { once: true },
    );
    next.readAsDataURL(file);
  };

  const create = () => {
    const name = state.name.trim();
    if (name === "") return;
    setState((current) => ({ ...current, busy: "create" }));
    onCreate(name, state.avatar?.file ?? null)
      .then(close)
      .catch(() => {})
      .finally(() => setState((current) => ({ ...current, busy: null })));
  };

  const target = joinTarget(state.joinSelection, invitations, organizations);
  const targetName = joinTargetName(target);
  const join = () => {
    if (target === undefined) return;
    setState((current) => ({ ...current, busy: "join" }));
    (target.kind === "invitation"
      ? onJoinInvitation(target.invitation)
      : onJoinOrganization(target.organization)
    )
      .then(close)
      .catch(() => {})
      .finally(() => setState((current) => ({ ...current, busy: null })));
  };

  const copy = dialogCopy(state.step);
  const busy = state.busy !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      onOpenChangeComplete={(next) => {
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {state.step === "choose" ? (
            <ChoiceRowGroup label="Organization action">
              <ChoiceRow
                checked={state.choice === "create"}
                onSelect={() =>
                  setState((current) => ({ ...current, choice: "create" }))
                }
                icon={<Icon name="buildings" />}
                label="Create a new organization"
                description="Start a workspace for your team and projects"
              />
              <ChoiceRow
                checked={state.choice === "join"}
                onSelect={() =>
                  setState((current) => ({ ...current, choice: "join" }))
                }
                icon={<Icon name="user-add" />}
                label="Join an existing organization"
                description="Accept an invitation or join with your work email"
              />
            </ChoiceRowGroup>
          ) : state.step === "create" ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-(--radius-card) border-hairline border-border-2">
                <SettingsRow label="Organization image" description="Optional">
                  <AvatarEditor
                    src={state.avatar?.previewUrl ?? null}
                    name={state.name || "New organization"}
                    label="Choose organization image"
                    title="Adjust organization image"
                    busy={false}
                    disabled={busy}
                    onImage={chooseImage}
                  />
                </SettingsRow>
              </div>
              <Field.Root className="flex flex-col gap-1.5">
                <Label htmlFor="organization-name">Organization name</Label>
                <Input
                  id="organization-name"
                  autoFocus
                  autoComplete="organization"
                  placeholder="Acme"
                  value={state.name}
                  disabled={busy}
                  onChange={(event) => {
                    const name = event.target.value;
                    setState((current) => ({ ...current, name }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") create();
                  }}
                />
              </Field.Root>
            </div>
          ) : (
            <JoinOrganizationChoices
              invitations={invitations}
              organizations={organizations}
              invitationsFailed={invitationsFailed}
              organizationsFailed={organizationsFailed}
              selection={state.joinSelection}
              onSelect={(joinSelection) =>
                setState((current) => ({ ...current, joinSelection }))
              }
              onRetryInvitations={onRetryInvitations}
              onRetryOrganizations={onRetryOrganizations}
            />
          )}
        </DialogBody>
        {state.step === "choose" ? (
          <DialogFooter>
            <Button variant="ghost" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                setState((current) => ({ ...current, step: current.choice }))
              }
            >
              Continue
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="justify-between">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                setState((current) => ({ ...current, step: "choose" }))
              }
            >
              <Icon name="arrow-left" />
              Back
            </Button>
            {state.step === "create" ? (
              <Button
                disabled={state.name.trim() === "" || busy}
                aria-busy={state.busy === "create" || undefined}
                onClick={create}
              >
                {state.busy === "create" ? "Creating" : "Create organization"}
              </Button>
            ) : (
              <Button
                disabled={target === undefined || busy}
                aria-busy={state.busy === "join" || undefined}
                onClick={join}
              >
                {state.busy === "join"
                  ? "Joining"
                  : targetName === undefined
                    ? "Join organization"
                    : `Join ${targetName}`}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type OrganizationDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const readJoined = (value: unknown) => {
  const record =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return {
    id: typeof record.id === "string" ? record.id : undefined,
    name: typeof record.name === "string" ? record.name : "",
  };
};

/**
 * The create-or-join organization dialog, wired to the organizations API.
 * Opens from `organizationDialogOpenAtom` unless `open` is given.
 */
export function OrganizationDialog({
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: OrganizationDialogProps) {
  const [openAtom, setOpenAtom] = useAtom(organizationDialogOpenAtom);
  const open = openProp ?? openAtom;
  const onOpenChange = onOpenChangeProp ?? setOpenAtom;
  const navigate = useNavigate();
  const invitationsResult = useAtomValue(myInvitationsAtom);
  const joinableResult = useAtomValue(joinableOrganizationsAtom);
  const refreshInvitations = useAtomRefresh(myInvitationsAtom);
  const refreshJoinable = useAtomRefresh(joinableOrganizationsAtom);
  const refreshOrganizations = useAtomRefresh(organizationsAtom);
  const createOrganization = useAtomSet(createOrganizationAtom, {
    mode: "promise",
  });
  const presignAvatar = useAtomSet(presignOrganizationAvatarAtom, {
    mode: "promise",
  });
  const updateAvatar = useAtomSet(updateOrganizationAvatarAtom, {
    mode: "promise",
  });
  const acceptInvitation = useAtomSet(acceptInvitationAtom, {
    mode: "promise",
  });
  const joinByDomain = useAtomSet(joinByDomainAtom, { mode: "promise" });

  const invitations = AsyncResult.isSuccess(invitationsResult)
    ? readInvitations(invitationsResult.value)
    : undefined;
  const joinable = AsyncResult.isSuccess(joinableResult)
    ? readJoinableOrganizations(joinableResult.value)
    : undefined;

  const refreshAll = () => {
    refreshOrganizations();
    refreshInvitations();
    refreshJoinable();
  };
  const switchTo = (openProjects: boolean) => {
    refreshAll();
    navigate({ to: "/new" }).then(() => {
      if (openProjects) openCommandPalette("project");
    });
  };

  const create = (name: string, image: File | null) =>
    createOrganization({ payload: { name } })
      .then((created) => {
        const { id } = readJoined(created);
        if (image === null || id === undefined) return;
        const params = { orgId: OrgId.make(id) };
        return presignAvatar({
          params,
          payload: { mediaType: image.type, sizeBytes: image.size },
        })
          .then(async (response) => {
            const target = readAvatarUploadTarget(response);
            if (target === undefined) throw new Error("No upload target");
            await uploadToTarget(target, image);
            return updateAvatar({
              params,
              payload: { avatarKey: target.avatarKey },
            });
          })
          .catch(() => {
            toast.warning("Organization created, image upload failed");
          });
      })
      .then(() => {
        toast.success("Organization created");
        switchTo(true);
      })
      .catch((error: unknown) => {
        toast.error("Could not create the organization");
        return Promise.reject(error);
      });

  const joinInvitation = (invitation: OrganizationInvitation) =>
    acceptInvitation({ params: { invitationId: invitation.id } }).then(
      (joined) => {
        toast.success(`Joined ${readJoined(joined).name}`);
        switchTo(invitation.projectCount === 0);
      },
      (error: unknown) => {
        refreshAll();
        toast.error("This invitation is no longer available");
        return Promise.reject(error);
      },
    );

  const joinOrganization = (organization: JoinableOrganization) =>
    joinByDomain({ params: { orgId: organization.orgId } }).then(
      (joined) => {
        toast.success(`Joined ${readJoined(joined).name}`);
        switchTo(organization.projectCount === 0);
      },
      (error: unknown) => {
        refreshAll();
        toast.error("This organization is no longer available to join");
        return Promise.reject(error);
      },
    );

  return (
    <OrganizationDialogView
      open={open}
      onOpenChange={onOpenChange}
      invitations={invitations}
      organizations={joinable}
      invitationsFailed={AsyncResult.isFailure(invitationsResult)}
      organizationsFailed={AsyncResult.isFailure(joinableResult)}
      onRetryInvitations={refreshInvitations}
      onRetryOrganizations={refreshJoinable}
      onCreate={create}
      onJoinInvitation={joinInvitation}
      onJoinOrganization={joinOrganization}
    />
  );
}
