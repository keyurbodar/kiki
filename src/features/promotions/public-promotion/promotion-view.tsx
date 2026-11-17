import { type FormEvent, useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Input } from "@/primitives/input";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { type ClaimState, terminalCopy, type ViewState } from "./claim-outcome";
import { formatCredits } from "./format";
import { CheckGlyph, ChevronDownGlyph, CrossGlyph, PlusGlyph } from "./glyphs";
import { LoadingButton } from "./loading-button";
import { OrgAvatar } from "./org-avatar";
import type { PlanTier } from "./plan-tiers";
import { PromotionPage } from "./promotion-page";
import { TrialStartedCard } from "./trial-started-card";
import type { PromotionOrganization } from "./use-promotion-organizations";

const track = (owner: string) =>
  `features/promotions/public-promotion-view.tsx#${owner}`;

export type OrganizationSelectProps = {
  organizations: ReadonlyArray<PromotionOrganization>;
  selected: PromotionOrganization | undefined;
  onSelect: (orgId: string) => void;
  onCreate: () => void;
  "data-track-owner"?: string;
};

export function OrganizationSelect({
  organizations,
  selected,
  onSelect,
  onCreate,
}: OrganizationSelectProps) {
  return (
    <Menu>
      <MenuTrigger
        data-track-owner={track("OrganizationSelect:ResponsiveMenuTrigger.1")}
        render={
          <Button
            data-track-owner={track(
              "OrganizationSelect:Button[Destination organization]",
            )}
            variant="outline"
            size="base"
            aria-label="Destination organization"
            className="w-full justify-between"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected === undefined ? (
            <span className="text-muted-foreground-2">
              Select an organization
            </span>
          ) : (
            <>
              <OrgAvatar src={selected.avatarUrl} name={selected.name} />
              <span className="min-w-0 truncate">{selected.name}</span>
            </>
          )}
        </span>
        <ChevronDownGlyph className="size-(--icon-sm) shrink-0 text-muted-foreground-3" />
      </MenuTrigger>
      <MenuContent align="start" className="w-(--anchor-width) min-w-56">
        <div className="max-h-80 overflow-y-auto md:scroll-fade-y">
          {organizations.map((organization) => (
            <MenuItem
              key={organization.id}
              data-track-owner={track(
                "OrganizationSelect:ResponsiveMenuItem.1",
              )}
              onClick={() => onSelect(organization.id)}
            >
              <OrgAvatar
                src={organization.avatarUrl}
                name={organization.name}
              />
              <span className="min-w-0 truncate">{organization.name}</span>
              {organization.id === selected?.id ? (
                <CheckGlyph className="ml-auto size-(--icon-sm) shrink-0 text-foreground" />
              ) : null}
            </MenuItem>
          ))}
        </div>
        <MenuSeparator />
        <MenuItem
          data-track-owner={track(
            "OrganizationSelect:ResponsiveMenuItem[Create new organization]",
          )}
          onClick={onCreate}
        >
          <PlusGlyph />
          Create new organization
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export type CreateOrganizationProps = {
  busy: boolean;
  onCancel?: () => void;
  onCreate: (name: string) => Promise<void>;
};

export function CreateOrganization({
  busy,
  onCancel,
  onCreate,
}: CreateOrganizationProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed.length > 0) onCreate(trimmed).catch(() => undefined);
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="promotion-org-name"
          data-slot="label"
          className="text-sm font-medium text-foreground"
        >
          Organization name
        </label>
        <Input
          id="promotion-org-name"
          name="organization"
          autoComplete="organization"
          autoFocus
          placeholder="Acme"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <p className="text-xs font-normal text-muted-foreground-2">
          You will review the destination before claiming
        </p>
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel === undefined ? null : (
          <Button
            data-track-owner={track("CreateOrganization:Button[Cancel]")}
            type="button"
            variant="ghost"
            size="base"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <LoadingButton
          data-track-owner={track(
            "CreateOrganization:Button[Create organization]",
          )}
          type="submit"
          intent="accent"
          size="base"
          disabled={trimmed.length === 0}
          loading={busy}
          loadingLabel="Creating"
        >
          Create organization
        </LoadingButton>
      </div>
    </form>
  );
}

export type TerminalStateProps = {
  state: ClaimState;
  onContinue: () => void;
  onSwitchAccount: () => void;
};

export function TerminalState({
  state,
  onContinue,
  onSwitchAccount,
}: TerminalStateProps) {
  const copy = terminalCopy[state];
  return (
    <div
      data-slot="promotion-terminal"
      data-state={state}
      className="flex flex-col items-center gap-4 px-4 py-8 text-center"
    >
      <span
        className={`grid size-10 place-items-center rounded-md bg-secondary [&_svg]:size-(--icon-base) ${copy.positive ? "text-success" : "text-muted-foreground-1"}`}
      >
        {copy.positive ? <CheckGlyph /> : <CrossGlyph />}
      </span>
      <div className="flex max-w-80 flex-col gap-1">
        <h2 className="text-base font-medium text-foreground">{copy.title}</h2>
        <p className="text-sm font-normal text-muted-foreground-1">
          {copy.description}
        </p>
      </div>
      {copy.positive ? (
        <Button
          data-track-owner={track("TerminalState:Button[Start building]")}
          intent="accent"
          size="base"
          onClick={onContinue}
        >
          Start building
        </Button>
      ) : state === "email_mismatch" ? (
        <Button
          data-track-owner={track("TerminalState:Button[Switch account]")}
          size="base"
          onClick={onSwitchAccount}
        >
          Switch account
        </Button>
      ) : (
        <Button
          data-track-owner={track("TerminalState:Button[Go to Capy]")}
          size="base"
          onClick={onContinue}
        >
          Go to Capy
        </Button>
      )}
    </div>
  );
}

export type ClaimedBalance = {
  organization: PromotionOrganization;
  beforeCredits: number;
  afterCredits: number;
  settled: boolean;
};

export function ClaimedBalanceCard({
  creditAmount,
  balance,
  onContinue,
}: {
  creditAmount: number;
  balance: ClaimedBalance;
  onContinue: () => void;
}) {
  const before = Math.min(
    Math.max(balance.beforeCredits, 0) / Math.max(balance.afterCredits, 1),
    1,
  );
  return (
    <div data-slot="claimed-balance-card" className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <OrgAvatar
            src={balance.organization.avatarUrl}
            name={balance.organization.name}
          />
          <span className="min-w-0 truncate text-sm font-normal text-foreground">
            {balance.organization.name}
          </span>
        </div>
        <Badge color="success">
          <CheckGlyph />
          {balance.settled ? "Added" : "On the way"}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-normal text-muted-foreground-2">
          Credit balance
        </span>
        <span className="text-3xl font-medium tabular-nums text-foreground">
          {formatCredits(balance.afterCredits)}
        </span>
        <span className="text-sm font-normal tabular-nums text-success">
          +{formatCredits(creditAmount)}{" "}
          {balance.settled
            ? "from this promotion"
            : "will appear on this balance shortly"}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full shrink-0 bg-muted-foreground-3"
          style={{ width: `${before * 100}%` }}
        />
        <div className="h-full flex-1 bg-success" />
      </div>
      <div className="flex items-center justify-between text-xs font-normal tabular-nums text-muted-foreground-2">
        <span>{formatCredits(balance.beforeCredits)} before</span>
        <span>{formatCredits(balance.afterCredits)} now</span>
      </div>
      <Button
        data-track-owner={track("ClaimedBalanceCard:Button[Start building]")}
        intent="accent"
        size="base"
        className="w-full"
        onClick={onContinue}
      >
        Start building
      </Button>
    </div>
  );
}

export type PublicPromotionSignUpViewProps = {
  description?: string;
  creditAmount?: number;
  heading?: string;
  receives?: string;
  onSignUp: () => void;
};

export function PublicPromotionSignUpView({
  description,
  creditAmount,
  heading,
  receives = "the credits",
  onSignUp,
}: PublicPromotionSignUpViewProps) {
  return (
    <PromotionPage
      description={description}
      creditAmount={creditAmount}
      heading={heading}
    >
      <Card>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-0.5 text-center">
            <h2 className="text-sm font-medium text-foreground">
              Claim with a Capy account
            </h2>
            <p className="text-xs font-normal text-muted-foreground-2">
              Sign up free, then choose the organization that receives{" "}
              {receives}
            </p>
          </div>
          <Button
            data-track-owner={track(
              "PublicPromotionSignUpView:Button[Sign up to claim]",
            )}
            intent="accent"
            size="base"
            className="w-full"
            onClick={onSignUp}
          >
            Sign up to claim
          </Button>
        </div>
      </Card>
    </PromotionPage>
  );
}

export type StartedTrial = {
  organization: PromotionOrganization;
  tier: PlanTier;
  trialDays: number;
};

export type PublicPromotionViewProps = {
  name?: string;
  description?: string;
  heading?: string;
  creditAmount: number;
  state: ViewState;
  balance?: ClaimedBalance;
  trial?: StartedTrial;
  organizations: ReadonlyArray<PromotionOrganization> | undefined;
  organizationsError: boolean;
  selectedOrgId: string | undefined;
  claiming: boolean;
  creating?: boolean;
  onSelectOrganization: (orgId: string) => void;
  onRetryOrganizations?: () => void;
  onClaim: () => void;
  onCreateOrganization: (name: string) => Promise<void>;
  onContinue: () => void;
  onSwitchAccount: () => void;
};

export function PublicPromotionView(props: PublicPromotionViewProps) {
  const [creatingOpen, setCreatingOpen] = useState(false);
  const selected = props.organizations?.find(
    (organization) => organization.id === props.selectedOrgId,
  );
  const noOrganizations =
    props.organizations !== undefined && props.organizations.length === 0;

  const body = () => {
    if (props.trial !== undefined && props.state === "granted")
      return (
        <TrialStartedCard
          organization={props.trial.organization}
          tier={props.trial.tier}
          trialDays={props.trial.trialDays}
          creditAmount={props.creditAmount}
          onContinue={props.onContinue}
        />
      );
    if (
      props.balance !== undefined &&
      (props.state === "granted" || props.state === "pending")
    )
      return (
        <ClaimedBalanceCard
          creditAmount={props.creditAmount}
          balance={props.balance}
          onContinue={props.onContinue}
        />
      );
    if (props.state !== "available")
      return (
        <TerminalState
          state={props.state}
          onContinue={props.onContinue}
          onSwitchAccount={props.onSwitchAccount}
        />
      );
    return (
      <div className="flex flex-col gap-5 p-4">
        {creatingOpen || noOrganizations ? (
          <CreateOrganization
            busy={props.creating ?? false}
            onCancel={
              noOrganizations ? undefined : () => setCreatingOpen(false)
            }
            onCreate={(name) =>
              props
                .onCreateOrganization(name)
                .then(() => setCreatingOpen(false))
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-sm font-medium text-foreground">
                  Choose an organization
                </h2>
                <p className="text-xs font-normal text-muted-foreground-2">
                  Credits belong to one organization and cannot be moved
                </p>
              </div>
              {props.organizations === undefined ? (
                props.organizationsError ? (
                  <OrganizationsError onRetry={props.onRetryOrganizations} />
                ) : (
                  <div
                    role="status"
                    aria-label="Loading organizations"
                    className="flex flex-col gap-2"
                  >
                    <SkeletonPanel className="w-full py-4" />
                  </div>
                )
              ) : (
                <OrganizationSelect
                  data-track-owner={track(
                    "PublicPromotionView:OrganizationSelect[onSelect=onSelectOrganization]",
                  )}
                  organizations={props.organizations}
                  selected={selected}
                  onSelect={props.onSelectOrganization}
                  onCreate={() => setCreatingOpen(true)}
                />
              )}
            </div>
            {props.organizations === undefined ? null : (
              <LoadingButton
                data-track-owner={track(
                  "PublicPromotionView:Button[onClick=onClaim]",
                )}
                intent="accent"
                size="base"
                className="w-full"
                disabled={selected === undefined}
                loading={props.claiming}
                loadingLabel="Claiming"
                onClick={props.onClaim}
              >
                {selected === undefined
                  ? "Claim credits"
                  : `Claim for ${selected.name}`}
              </LoadingButton>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <PromotionPage
      name={props.name}
      description={props.description}
      creditAmount={props.creditAmount}
      heading={props.heading}
      footer={props.balance === undefined && props.trial === undefined}
    >
      <Card>{body()}</Card>
    </PromotionPage>
  );
}

export function OrganizationsError({
  onRetry,
  trackOwner = track("PublicPromotionView:Button[Retry]"),
}: {
  onRetry?: () => void;
  trackOwner?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-(--radius-inner) bg-secondary p-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">
          Could not load organizations
        </p>
        <p className="text-xs font-normal text-muted-foreground-1">
          Try again before choosing a destination
        </p>
      </div>
      {onRetry === undefined ? null : (
        <Button
          data-track-owner={trackOwner}
          size="sm"
          variant="ghost"
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
