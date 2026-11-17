import { Field } from "@base-ui/react/field";
import { useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  repositoriesLabel,
  type SubscriptionService,
  subscriptionDescriptions,
  subscriptionLabels,
  subscriptionServices,
} from "./flow";
import {
  CheckIcon,
  LaptopIcon,
  LinearIcon,
  LockIcon,
  PullRequestIcon,
  ShieldIcon,
  SlackIcon,
  SparkleIcon,
  WindowAppIcon,
} from "./icons";
import {
  FeatureList,
  RowValue,
  StepBody,
  StepFooter,
  StepHeader,
  StepKey,
  StepRow,
} from "./shell";

function NameField({
  id,
  label,
  value,
  disabled,
  autoComplete,
  onCommit,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  autoComplete?: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const current = draft ?? value;
  const commit = () => {
    const trimmed = current.trim();
    setDraft(null);
    if (trimmed !== "" && trimmed !== value) onCommit(trimmed);
  };
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-lg font-medium text-foreground"
      >
        {current.trim().slice(0, 1).toUpperCase()}
      </span>
      <Field.Root className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={current}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") setDraft(null);
          }}
        />
      </Field.Root>
    </div>
  );
}

export function ProfileStep({
  team,
  name,
  orgName,
  loading,
  onRename,
  onRenameOrg,
  onContinue,
  onBack,
}: {
  team: boolean;
  name: string;
  orgName: string;
  loading: boolean;
  onRename: (name: string) => void;
  onRenameOrg: (name: string) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const profile = (
    <NameField
      id="onboarding-profile-name"
      label="Your name"
      value={name}
      autoComplete="name"
      disabled={loading}
      onCommit={onRename}
    />
  );
  return (
    <StepBody>
      <StepHeader
        art="peer"
        title="What should we call you?"
        description={
          team
            ? "Teammates see this on threads and reviews"
            : "Shown on your threads and reviews"
        }
      />
      {team ? (
        <div className="flex flex-col gap-5">
          {profile}
          <NameField
            id="onboarding-org-rename"
            label="Workspace name"
            value={orgName}
            disabled={loading}
            onCommit={onRenameOrg}
          />
        </div>
      ) : (
        profile
      )}
      <StepFooter
        onBack={onBack}
        primary={
          <Button
            data-track-owner="features/onboarding/profile-step.tsx#ProfileStep:Button[Continue]"
            intent="accent"
            size="base"
            onClick={onContinue}
          >
            Continue
            <StepKey />
          </Button>
        }
      />
    </StepBody>
  );
}

const serviceIcons: Record<SubscriptionService, () => React.ReactNode> = {
  claude: () => <SparkleIcon />,
  codex: () => <WindowAppIcon />,
  copilot: () => <Icon name="github" />,
  supergrok: () => <SparkleIcon />,
};

const connectOwner = "features/onboarding/connect-step.tsx#ConnectStep";

export function ConnectStep({
  connected,
  onConnect,
  onContinue,
  onBack,
}: {
  connected: ReadonlySet<SubscriptionService>;
  onConnect: (service: SubscriptionService) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const anyConnected = subscriptionServices.some((service) =>
    connected.has(service),
  );
  return (
    <StepBody>
      <StepHeader
        art="sail"
        title="Bring a model subscription"
        description="Capy runs on plans you already pay for"
      />
      <div className="flex flex-col gap-2">
        <Card rows>
          {subscriptionServices.map((service) => (
            <StepRow
              key={service}
              icon={serviceIcons[service]()}
              label={subscriptionLabels[service]}
              description={subscriptionDescriptions[service]}
            >
              {connected.has(service) ? (
                <Badge color="success">Connected</Badge>
              ) : (
                <Button
                  data-track-owner={`${connectOwner}:Button[Connect]`}
                  size="sm"
                  onClick={() => onConnect(service)}
                >
                  Connect
                </Button>
              )}
            </StepRow>
          ))}
        </Card>
        <p className="text-xs font-normal text-muted-foreground-2">
          Capy credits cover model use without a subscription
        </p>
      </div>
      <StepFooter
        onBack={onBack}
        primary={
          <Button
            data-track-owner={
              anyConnected
                ? `${connectOwner}:Button[Continue]`
                : `${connectOwner}:Button[Continue].2`
            }
            intent="accent"
            size="base"
            onClick={onContinue}
          >
            Continue
            <StepKey />
          </Button>
        }
      />
    </StepBody>
  );
}

const githubOwner = "features/onboarding/github-step.tsx#GitHubStep";

export function GitHubStep({
  connected,
  repositories,
  installing,
  onInstall,
  onContinue,
  onBack,
}: {
  connected: boolean;
  repositories?: number;
  installing: boolean;
  onInstall: () => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  return (
    <StepBody>
      <StepHeader
        art="build"
        title="Connect GitHub"
        description="Capy works in the repositories you pick"
      />
      {connected ? (
        <Card rows>
          <StepRow
            icon={<Icon name="github" />}
            label="GitHub is connected"
            description={repositoriesLabel(repositories)}
          />
        </Card>
      ) : (
        <FeatureList
          items={[
            {
              icon: <LockIcon />,
              label: "Only the repositories you pick",
              description: "Change the list any time from GitHub",
            },
            {
              icon: <PullRequestIcon />,
              label: "Changes arrive as pull requests",
              description: "Each on its own branch, ready for review",
            },
            {
              icon: <ShieldIcon />,
              label: "No token on the machine",
              description: "Git goes through Capy, tokens stay on our servers",
            },
          ]}
        />
      )}
      <StepFooter
        onBack={onBack}
        secondary={
          connected ? undefined : (
            <Button
              data-track-owner={`${githubOwner}:Button[Skip].2`}
              variant="ghost"
              size="base"
              disabled={installing}
              onClick={onContinue}
            >
              Skip
            </Button>
          )
        }
        primary={
          connected ? (
            <Button
              data-track-owner={`${githubOwner}:Button[Continue]`}
              intent="accent"
              size="base"
              onClick={onContinue}
            >
              Continue
              <StepKey />
            </Button>
          ) : (
            <Button
              data-track-owner={`${githubOwner}:Button[onClick=install]`}
              intent="accent"
              size="base"
              disabled={installing}
              aria-busy={installing}
              onClick={onInstall}
            >
              <Icon name="github" size="sm" />
              {installing ? "Opening GitHub" : "Connect GitHub"}
              <StepKey />
            </Button>
          )
        }
      />
    </StepBody>
  );
}

export function PlanStep({
  leaving,
  onBack,
  onDone,
  wide,
  stepper,
}: {
  leaving: boolean;
  onBack: () => void;
  onDone: (purchased: boolean) => void;
  wide: boolean;
  stepper?: React.ReactNode;
}) {
  return (
    <StepBody>
      <StepHeader
        centered
        title="Pick a plan"
        description={
          <span className="block text-muted-foreground-1">
            Every plan includes monthly usage
          </span>
        }
      />
      <div data-slot="plan-picker" data-gap="billing" className="min-h-40" />
      <p className="text-center text-xs font-normal text-muted-foreground-2">
        One plan per organization, plus a $0.20 per million token fee once a
        second member joins
      </p>
      <StepFooter
        wide={wide}
        stepper={stepper}
        onBack={onBack}
        secondary={
          <Button
            data-track-owner="features/onboarding/plan-step.tsx#PlanStep:Button[Skip for now]"
            variant="outline"
            size="base"
            disabled={leaving}
            onClick={() => onDone(false)}
          >
            Skip for now
          </Button>
        }
      />
    </StepBody>
  );
}

export type RecommendedPage =
  | "list"
  | "slack"
  | "linear"
  | "invite"
  | "desktop";

const recommendedOwner = "features/onboarding/recommended-step.tsx";

function SubPage({
  title,
  description,
  onBack,
  primary,
  children,
}: {
  title: string;
  description: string;
  onBack: () => void;
  primary: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <StepHeader
        art="gift"
        onBreadcrumb={onBack}
        title={title}
        description={description}
      />
      {children}
      <StepFooter onBack={onBack} showBack={false} primary={primary} />
    </>
  );
}

export function RecommendedStep({
  team,
  showReview,
  githubConnected,
  slackConnected,
  linearConnected,
  finishLabel,
  finishBusy,
  themeLabel,
  invite,
  onConnectSlack,
  onConnectLinear,
  onFinish,
  onConnectGitHub,
  onBack,
}: {
  team: boolean;
  showReview: boolean;
  githubConnected: boolean;
  slackConnected: boolean;
  linearConnected: boolean;
  finishLabel: string;
  finishBusy: boolean;
  themeLabel: string;
  invite: {
    sent: number;
    busy: boolean;
    send: (emails: string) => Promise<boolean>;
  };
  onConnectSlack: () => void;
  onConnectLinear: () => void;
  onFinish: () => void;
  onConnectGitHub: () => void;
  onBack?: () => void;
}) {
  const [page, setPage] = useState<RecommendedPage>("list");
  const [downloaded, setDownloaded] = useState(false);
  const [emails, setEmails] = useState("");
  const toList = () => setPage("list");

  const body =
    page === "slack" ? (
      <SubPage
        title="Slack"
        description="Start threads from Slack messages and reply in thread"
        onBack={toList}
        primary={
          slackConnected ? (
            <Button
              data-track-owner={`${recommendedOwner}#SlackPage:Button[Done]`}
              intent="accent"
              size="base"
              onClick={toList}
            >
              Done
              <StepKey />
            </Button>
          ) : (
            <Button
              data-track-owner={`${recommendedOwner}#SlackPage:Button[Connect Slack]`}
              intent="accent"
              size="base"
              onClick={onConnectSlack}
            >
              Connect Slack
              <StepKey />
            </Button>
          )
        }
      >
        <Card rows>
          <StepRow
            icon={<SlackIcon />}
            label={
              slackConnected
                ? "Slack is connected"
                : "Mention @Capy in a channel"
            }
            description="Capy starts a thread from that message"
          />
          <StepRow label="Replies come back in the Slack thread" />
          <StepRow label="Pull request cards and status post as the work lands" />
        </Card>
      </SubPage>
    ) : page === "linear" ? (
      <SubPage
        title="Linear"
        description="Delegate an issue to Capy from Linear"
        onBack={toList}
        primary={
          linearConnected ? (
            <Button
              data-track-owner={`${recommendedOwner}#LinearPage:Button[Done]`}
              intent="accent"
              size="base"
              onClick={toList}
            >
              Done
              <StepKey />
            </Button>
          ) : (
            <Button
              data-track-owner={`${recommendedOwner}#LinearPage:Button[Connect Linear]`}
              intent="accent"
              size="base"
              onClick={onConnectLinear}
            >
              Connect Linear
              <StepKey />
            </Button>
          )
        }
      >
        <Card rows>
          <StepRow
            icon={<LinearIcon />}
            label={
              linearConnected
                ? "Linear is connected"
                : "Assign an issue to Capy"
            }
            description="Capy works the issue like a teammate"
          />
          <StepRow label="It reports back in the agent session" />
        </Card>
      </SubPage>
    ) : page === "invite" ? (
      <SubPage
        title="Invite teammates"
        description="They join with one click from the email"
        onBack={toList}
        primary={
          <Button
            data-track-owner={`${recommendedOwner}#InvitePage:Button[Send invitations]`}
            intent="accent"
            size="base"
            disabled={emails.trim() === "" || invite.busy}
            aria-busy={invite.busy}
            onClick={() =>
              invite.send(emails).then((done) => {
                setEmails("");
                if (done) toList();
              })
            }
          >
            {invite.busy ? "Sending" : "Send invitations"}
            <StepKey />
          </Button>
        }
      >
        <Card>
          <Field.Root className="flex flex-col gap-2 p-4">
            <Label htmlFor="onboarding-invite-emails">Emails</Label>
            <Input
              id="onboarding-invite-emails"
              placeholder="name@company.com, name@company.com"
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
            />
            <p className="text-xs font-normal text-muted-foreground-2">
              {invite.sent === 0
                ? "Separate addresses with commas or spaces"
                : invite.sent === 1
                  ? "1 invitation sent"
                  : `${invite.sent} invitations sent`}
            </p>
          </Field.Root>
        </Card>
      </SubPage>
    ) : page === "desktop" ? (
      <SubPage
        title="Desktop app"
        description="Run threads on your own computer"
        onBack={toList}
        primary={
          <Button
            data-track-owner={`${recommendedOwner}#DesktopPage:Button[Download]`}
            intent="accent"
            size="base"
            onClick={() => {
              window.open("https://capy.ai/download", "_blank", "noopener");
              setDownloaded(true);
              toList();
            }}
          >
            Download
            <StepKey />
          </Button>
        }
      >
        <Card rows>
          <StepRow
            icon={<LaptopIcon />}
            label="Work in your own folders"
            description="Edits land on your disk as they happen"
          />
          <StepRow label="Git runs with your own credentials" />
        </Card>
      </SubPage>
    ) : (
      <>
        <StepHeader
          art="gift"
          title="A few things worth turning on"
          description={
            showReview
              ? "Code review is where most teams start"
              : "All optional, and all in Settings later"
          }
        />
        <Card rows>
          {showReview ? (
            <StepRow
              trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow.1`}
              icon={<Icon name="review" size="sm" />}
              label={
                <span className="flex items-center gap-2">
                  Code review
                  <Badge color="success" size="sm">
                    <CheckIcon className="size-(--icon-xs)" />
                    Recommended
                  </Badge>
                </span>
              }
              description={
                githubConnected
                  ? "Checking which repositories Capy can reach"
                  : "Connect GitHub and Capy reviews every pull request"
              }
              onClick={githubConnected ? undefined : onConnectGitHub}
            >
              <Button
                data-track-owner={`${recommendedOwner}#RecommendedStep:Button.1`}
                intent="accent"
                size="sm"
                onClick={githubConnected ? undefined : onConnectGitHub}
              >
                {githubConnected ? "Turn on" : "Set up"}
              </Button>
            </StepRow>
          ) : null}
          <StepRow
            trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow[Slack]`}
            icon={<SlackIcon />}
            label="Slack"
            description="Mention @Capy in any channel"
            onClick={() => setPage("slack")}
          >
            {slackConnected ? (
              <Badge color="success">Connected</Badge>
            ) : (
              <Button
                data-track-owner={`${recommendedOwner}#RecommendedStep:Button[Connect]`}
                size="sm"
                onClick={() => setPage("slack")}
              >
                Connect
              </Button>
            )}
          </StepRow>
          <StepRow
            trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow[Linear]`}
            icon={<LinearIcon />}
            label="Linear"
            description="Assign issues to Capy"
            onClick={() => setPage("linear")}
          >
            {linearConnected ? (
              <Badge color="success">Connected</Badge>
            ) : (
              <Button
                data-track-owner={`${recommendedOwner}#RecommendedStep:Button[Connect].2`}
                size="sm"
                onClick={() => setPage("linear")}
              >
                Connect
              </Button>
            )}
          </StepRow>
          {team ? (
            <StepRow
              trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow[Invite teammates]`}
              icon={<Icon name="people-add" size="sm" />}
              label="Invite teammates"
              description={
                invite.sent === 0
                  ? "Add them by email"
                  : `${invite.sent} invited`
              }
              onClick={() => setPage("invite")}
            >
              {invite.sent === 0 ? (
                <Button
                  data-track-owner={`${recommendedOwner}#RecommendedStep:Button[Invite]`}
                  size="sm"
                  onClick={() => setPage("invite")}
                >
                  Invite
                </Button>
              ) : (
                <Badge color="success">Invited</Badge>
              )}
            </StepRow>
          ) : null}
          <StepRow
            trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow[Desktop app]`}
            icon={<LaptopIcon />}
            label="Desktop app"
            description="Run threads on your own computer"
            onClick={() => setPage("desktop")}
          >
            {downloaded ? (
              <Badge color="success">Downloaded</Badge>
            ) : (
              <Button
                data-track-owner={`${recommendedOwner}#RecommendedStep:Button[Download]`}
                size="sm"
                onClick={() => setPage("desktop")}
              >
                Download
              </Button>
            )}
          </StepRow>
          <StepRow
            trackOwner={`${recommendedOwner}#RecommendedStep:SettingsRow[Theme]`}
            icon={<Icon name="color-palette" size="sm" />}
            label="Theme"
            description="Mode, colors and background"
          >
            <RowValue chevron>{themeLabel}</RowValue>
          </StepRow>
        </Card>
        <StepFooter
          onBack={onBack}
          primaryKey="mod-enter"
          primary={
            <Button
              data-track-owner={`${recommendedOwner}#RecommendedStep:Button[onClick=onFinish].2`}
              intent="accent"
              size="base"
              disabled={finishBusy}
              aria-busy={finishBusy}
              onClick={onFinish}
            >
              {finishBusy ? "Finishing" : finishLabel}
              <StepKey mod />
            </Button>
          }
        />
      </>
    );

  return (
    <StepBody>
      <div key={page} className="flex flex-col gap-6">
        {body}
      </div>
    </StepBody>
  );
}
