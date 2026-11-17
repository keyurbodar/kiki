import { Field } from "@base-ui/react/field";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { GlobeIcon, LockIcon, UserGroupIcon, UserIcon } from "./icons";
import { OptionRow, StepBody, StepFooter, StepHeader, StepKey } from "./shell";

export type Invitation = {
  readonly id: string;
  readonly orgId: string;
  readonly orgName: string;
  readonly inviterName: string;
};

export type JoinableOrganization = {
  readonly orgId: string;
  readonly orgName: string;
};

export type Sharing = {
  readonly defaultVisibility: "org" | "private";
  readonly privateWork: boolean;
};

export type WorkspaceView = "invites" | "audience" | "team-name";

const owner = "features/onboarding/no-membership-page.tsx#NoMembershipPage";

function OrgMark({ name }: { name: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-sm font-medium text-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function WorkspaceStep({
  invitations,
  joinableOrganizations,
  personalName,
  busy = false,
  initialView,
  viewerEmail,
  onAcceptInvitation,
  onJoinByDomain,
  onChoose,
  onViewChange,
}: {
  invitations: ReadonlyArray<Invitation>;
  joinableOrganizations: ReadonlyArray<JoinableOrganization>;
  personalName: string;
  busy?: boolean;
  initialView?: WorkspaceView;
  viewerEmail?: string;
  onAcceptInvitation?: (invitation: Invitation) => void;
  onJoinByDomain?: (organization: JoinableOrganization) => void;
  onChoose: (
    name: string,
    path: "personal" | "team",
    sharing?: Sharing,
  ) => void;
  onViewChange?: (view: WorkspaceView) => void;
}) {
  const hasChoices = invitations.length > 0 || joinableOrganizations.length > 0;
  const [view, setViewState] = useState<WorkspaceView>(
    initialView ?? (hasChoices ? "invites" : "audience"),
  );
  const setView = setViewState;
  useEffect(() => {
    onViewChange?.(view);
  }, [onViewChange, view]);
  const [audience, setAudience] = useState<"personal" | "team">();
  const firstChoice =
    invitations[0] !== undefined
      ? `invite:${invitations[0].id}`
      : joinableOrganizations[0] !== undefined
        ? `domain:${joinableOrganizations[0].orgId}`
        : undefined;
  const [selected, setSelected] = useState(firstChoice);
  const [teamName, setTeamName] = useState("");
  const [visibility, setVisibility] = useState<"org" | "private">("org");
  const [privateWork, setPrivateWork] = useState(true);
  const trimmedName = teamName.trim();

  if (view === "invites") {
    const invitation = invitations.find(
      (candidate) => `invite:${candidate.id}` === selected,
    );
    const joinable = joinableOrganizations.find(
      (candidate) => `domain:${candidate.orgId}` === selected,
    );
    return (
      <StepBody>
        <StepHeader
          art="bite"
          title={
            invitations.length === 1 && invitations[0] !== undefined
              ? `You've been invited to ${invitations[0].orgName}`
              : "Join an organization"
          }
          description="Your team is already on Capy"
        />
        {hasChoices ? (
          <div className="flex flex-col gap-2">
            <Card rows role="radiogroup" aria-label="Organizations to join">
              {invitations.map((candidate) => (
                <OptionRow
                  key={candidate.id}
                  trackOwner={`${owner}:ChoiceRow.1`}
                  checked={`invite:${candidate.id}` === selected}
                  onSelect={() => setSelected(`invite:${candidate.id}`)}
                  icon={<OrgMark name={candidate.orgName} />}
                  label={candidate.orgName}
                  description={`${candidate.inviterName} invited you`}
                />
              ))}
              {joinableOrganizations.map((candidate) => (
                <OptionRow
                  key={candidate.orgId}
                  trackOwner={`${owner}:ChoiceRow.2`}
                  checked={`domain:${candidate.orgId}` === selected}
                  onSelect={() => setSelected(`domain:${candidate.orgId}`)}
                  icon={<OrgMark name={candidate.orgName} />}
                  label={candidate.orgName}
                  description="Open to your email domain"
                />
              ))}
            </Card>
            <p className="text-xs font-normal text-muted-foreground-2">
              Only the selected organization is joined
            </p>
          </div>
        ) : (
          <Card className="gap-3 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {viewerEmail === undefined
                  ? "No invitations available"
                  : `No invitations for ${viewerEmail}`}
              </p>
              <p className="text-xs font-normal text-muted-foreground-1">
                Ask an admin to invite you, or start your own workspace instead
              </p>
            </div>
          </Card>
        )}
        <StepFooter
          leading={
            hasChoices ? (
              <Button
                data-track-owner={`${owner}:Button[Create new org]`}
                variant="ghost"
                size="base"
                onClick={() => setView("audience")}
              >
                Create new org
              </Button>
            ) : undefined
          }
          primary={
            hasChoices ? (
              <Button
                data-track-owner={`${owner}:Button[Join]`}
                size="base"
                disabled={invitation === undefined && joinable === undefined}
                loading={busy}
                loadingLabel="Joining"
                onClick={() => {
                  if (invitation !== undefined)
                    onAcceptInvitation?.(invitation);
                  else if (joinable !== undefined) onJoinByDomain?.(joinable);
                }}
              >
                Join
                <StepKey />
              </Button>
            ) : (
              <Button
                data-track-owner={`${owner}:Button[Create new org].2`}
                intent="accent"
                size="base"
                onClick={() => setView("audience")}
              >
                Create new org
                <StepKey />
              </Button>
            )
          }
        />
      </StepBody>
    );
  }

  if (view === "audience") {
    const blocked =
      audience === undefined || (audience === "team" && trimmedName === "");
    return (
      <StepBody>
        <StepHeader
          art="sit"
          title="Who is this workspace for?"
          description="You can invite people later either way"
        />
        <div className="flex flex-col gap-4">
          <div
            role="radiogroup"
            aria-label="Workspace type"
            className="grid grid-cols-2 gap-3"
          >
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[Just me]`}
              layout="tile"
              checked={audience === "personal"}
              tabStop={audience === undefined}
              onSelect={() => setAudience("personal")}
              icon={<UserIcon />}
              label="Just me"
              description="Your repos, your plan"
            />
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[My team]`}
              layout="tile"
              checked={audience === "team"}
              onSelect={() => setAudience("team")}
              icon={<UserGroupIcon />}
              label="My team"
              description="Shared threads and reviews"
            />
          </div>
          {audience === "team" ? (
            <Field.Root className="flex flex-col gap-2">
              <Label htmlFor="onboarding-org-name">Workspace name</Label>
              <Input
                id="onboarding-org-name"
                name="organization"
                autoComplete="organization"
                autoFocus
                placeholder="Acme"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
            </Field.Root>
          ) : null}
        </div>
        <StepFooter
          onBack={hasChoices ? () => setView("invites") : undefined}
          primary={
            <Button
              data-track-owner={`${owner}:Button[Continue]`}
              size="base"
              disabled={blocked}
              loading={busy}
              loadingLabel={busy && audience === "team" ? "Creating" : "Saving"}
              onClick={() => {
                if (audience === "personal") onChoose(personalName, "personal");
                else if (audience === "team" && trimmedName !== "")
                  setView("team-name");
              }}
            >
              Continue
              <StepKey />
            </Button>
          }
        />
      </StepBody>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmedName === "") return;
    onChoose(trimmedName, "team", {
      defaultVisibility: visibility,
      privateWork,
    });
  };

  return (
    <StepBody>
      <StepHeader
        art="sit"
        title={`How ${trimmedName} shares work`}
        description="You can change both in Settings later"
      />
      <form
        id="onboarding-team-name"
        className="flex flex-col gap-4"
        onSubmit={submit}
      >
        <div
          role="radiogroup"
          aria-label="Who sees new work by default?"
          className="flex flex-col gap-2"
        >
          <h2 className="text-sm font-medium text-foreground">
            Who sees new work by default?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[Everyone]`}
              layout="tile"
              checked={visibility === "org"}
              onSelect={() => setVisibility("org")}
              icon={<GlobeIcon />}
              label="Everyone"
              description={`Visible to all of ${trimmedName}`}
            />
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[People you choose]`}
              layout="tile"
              checked={visibility === "private"}
              onSelect={() => setVisibility("private")}
              icon={<LockIcon />}
              label="People you choose"
              description="Starts private, shared on purpose"
              disabled={!privateWork}
            />
          </div>
        </div>
        <div
          role="radiogroup"
          aria-label="May people make private work?"
          className="flex flex-col gap-2"
        >
          <h2 className="text-sm font-medium text-foreground">
            May people make private work?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[Allow private work]`}
              layout="tile"
              checked={privateWork}
              onSelect={() => setPrivateWork(true)}
              icon={<LockIcon />}
              label="Allow private work"
              description="Private threads, projects and Captains"
            />
            <OptionRow
              trackOwner={`${owner}:ChoiceRow[Keep it shared]`}
              layout="tile"
              checked={!privateWork}
              onSelect={() => {
                setPrivateWork(false);
                setVisibility("org");
              }}
              icon={<GlobeIcon />}
              label="Keep it shared"
              description="Everything stays visible"
            />
          </div>
        </div>
      </form>
      <StepFooter
        onBack={() => setView("audience")}
        primary={
          <Button
            data-track-owner={`${owner}:Button[Continue].2`}
            type="submit"
            form="onboarding-team-name"
            size="base"
            disabled={trimmedName === ""}
            loading={busy}
            loadingLabel="Creating"
          >
            Continue
            <StepKey />
          </Button>
        }
      />
    </StepBody>
  );
}
