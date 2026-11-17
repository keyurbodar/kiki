import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  changeCount,
  healthLabel,
  hostLabel,
  type McpAvailability,
  type McpRecovery,
  type McpServerHealth,
  type McpSetupBusy,
  type McpSetupState,
  proposalServer,
  reviewLabel,
  setupStatus,
  setupStatusLabel,
} from "./helpers";
import {
  AvailabilityValue,
  DETAIL_LIST,
  DetailRow,
  FromTo,
  SecretRows,
  SetupCard,
} from "./parts";
import type { McpServerProposal } from "./proposal";

export type McpSetupCardViewProps = {
  proposal: McpServerProposal;
  state: McpSetupState;
  availableTo: McpAvailability;
  health?: McpServerHealth;
  recovery?: McpRecovery;
  busy?: McpSetupBusy;
  error?: string;
  iconDataUri?: string;
  onReview?: () => void;
  onDecline?: () => void;
  onRetry?: () => void;
  onViewServer?: () => void;
};

function ProposalDetails({
  proposal,
  availableTo,
}: {
  proposal: McpServerProposal;
  availableTo: McpAvailability;
}) {
  const availability = (
    <DetailRow label="Available to">
      <AvailabilityValue availability={availableTo} />
    </DetailRow>
  );
  const quickEdit = availableTo.quickEdit;
  if (quickEdit !== undefined && proposal.kind === "update") {
    const { before, after } = proposal;
    return (
      <>
        {before.enabled !== after.enabled && (
          <DetailRow label="Status">
            <FromTo
              from={before.enabled ? "On" : "Off"}
              to={after.enabled ? "On" : "Off"}
            />
          </DetailRow>
        )}
        {before.displayName !== after.displayName && (
          <DetailRow label="Name">
            <FromTo from={before.displayName} to={after.displayName} />
          </DetailRow>
        )}
        {before.serverKey !== after.serverKey && (
          <DetailRow label="Key">
            <span className="flex min-w-0 items-center gap-1.5 text-xs">
              <FromTo
                from={`tools.${before.serverKey}`}
                to={`tools.${after.serverKey}`}
              />
            </span>
          </DetailRow>
        )}
        {before.projectId !== after.projectId && (
          <DetailRow label="Available in">
            <Icon
              name="folder-1"
              className="size-(--icon-sm) shrink-0 text-icon-muted"
            />
            <FromTo from={quickEdit.fromProject} to="All projects" />
          </DetailRow>
        )}
        {availability}
        <DetailRow label="Connection">Kept as it is, no key to enter</DetailRow>
      </>
    );
  }
  if (proposal.kind === "update") {
    const count = changeCount(proposal);
    return (
      <>
        <DetailRow label="Changes">
          {count} {count === 1 ? "setting" : "settings"}
        </DetailRow>
        {availability}
        {proposal.dropsCredentials && (
          <DetailRow label="Connection">Reconnect required</DetailRow>
        )}
        <SecretRows secrets={proposal.secrets} />
      </>
    );
  }
  const transport = proposalServer(proposal).transport;
  if (transport.type === "stdio")
    return (
      <>
        <DetailRow label="Command">
          <span className="truncate text-xs">{transport.command}</span>
        </DetailRow>
        <DetailRow label="Runs on">Thread machines</DetailRow>
        {availability}
        {transport.environmentNames.length > 0 && (
          <DetailRow label="Environment">
            {transport.environmentNames.length} values
          </DetailRow>
        )}
        <SecretRows secrets={proposal.secrets} />
      </>
    );
  return (
    <>
      <DetailRow label="Runs at">
        <span className="truncate">{hostLabel(transport.url)}</span>
      </DetailRow>
      {availability}
      <DetailRow label="Connection">
        {transport.auth.type === "oauth"
          ? "OAuth"
          : transport.auth.type === "headers"
            ? "Authentication headers"
            : "No authentication"}
      </DetailRow>
      {transport.requestHeaderNames.length > 0 && (
        <DetailRow label="Request headers">
          {transport.requestHeaderNames.length} required
        </DetailRow>
      )}
      <SecretRows secrets={proposal.secrets} />
    </>
  );
}

function StatusDetails({
  proposal,
  state,
  availableTo,
  health,
}: {
  proposal: McpServerProposal;
  state: McpSetupState;
  availableTo: McpAvailability;
  health?: McpServerHealth;
}) {
  const availability = (
    <DetailRow label="Available to">
      <AvailabilityValue availability={availableTo} />
    </DetailRow>
  );
  if (state === "private")
    return (
      <>
        {availability}
        <DetailRow label="Connection details">Private</DetailRow>
      </>
    );
  if (state === "changed")
    return (
      <>
        {availability}
        <DetailRow label="Current setup">Review MCP settings</DetailRow>
      </>
    );
  if (proposal.kind === "update" && !proposal.after.enabled)
    return (
      <>
        {availability}
        <DetailRow label="Status">Off, no thread can use its tools</DetailRow>
      </>
    );
  const current = health ?? { state: "unchecked" as const };
  const label = healthLabel(current);
  return (
    <>
      {availability}
      <DetailRow label="Tools">
        {current.state === "ready" || current.state === "empty" ? (
          label
        ) : current.state === "error" ? (
          <span className="text-warning" title={current.detail}>
            {label}
          </span>
        ) : state === "connected" || current.state === "checking" ? (
          "Authorized, checking tools"
        ) : (
          label
        )}
      </DetailRow>
      {proposal.kind === "update" && proposal.dropsCredentials && (
        <DetailRow label="Connection">Reconnect required</DetailRow>
      )}
    </>
  );
}

function CardActions(props: McpSetupCardViewProps) {
  const { proposal, state, busy, recovery, availableTo } = props;
  if (state === "declined" || state === "expired" || recovery === "automatic")
    return undefined;
  if (recovery === "exhausted")
    return (
      <Button
        size="sm"
        intent="accent"
        aria-busy={busy === "retry" || undefined}
        aria-label={busy === "retry" ? "Retrying" : undefined}
        disabled={props.onRetry === undefined}
        onClick={props.onRetry}
      >
        Try again
      </Button>
    );
  if (state === "pending")
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          aria-busy={busy === "decline" || undefined}
          aria-label={busy === "decline" ? "Declining" : undefined}
          disabled={busy !== undefined || props.onDecline === undefined}
          onClick={props.onDecline}
        >
          Decline
        </Button>
        <Button
          size="sm"
          intent="accent"
          aria-busy={busy === "review" || undefined}
          aria-label={
            busy !== "review"
              ? undefined
              : availableTo.quickEdit === undefined
                ? "Opening"
                : "Approving"
          }
          disabled={busy !== undefined || props.onReview === undefined}
          onClick={props.onReview}
        >
          {reviewLabel(proposal, availableTo)}
        </Button>
      </>
    );
  if (state === "changed" && props.onDecline !== undefined)
    return (
      <>
        <Button
          size="sm"
          variant="ghost"
          aria-busy={busy === "decline" || undefined}
          aria-label={busy === "decline" ? "Declining" : undefined}
          onClick={props.onDecline}
        >
          Decline
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={props.onViewServer === undefined}
          onClick={props.onViewServer}
        >
          {proposal.kind === "add" ? "View MCP settings" : "View server"}
        </Button>
      </>
    );
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={props.onViewServer === undefined}
      onClick={props.onViewServer}
    >
      View server
    </Button>
  );
}

export function McpSetupCardView(props: McpSetupCardViewProps) {
  const { proposal, state, availableTo, health, recovery, error } = props;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-5 text-foreground">{proposal.reason}</p>
      <SetupCard
        status={setupStatus(state, health)}
        icon={
          props.iconDataUri === undefined ? (
            <Icon name="plugin-1" />
          ) : (
            <img
              src={props.iconDataUri}
              alt=""
              className="size-5 rounded-(--radius-inner) object-cover"
            />
          )
        }
        title={proposalServer(proposal).displayName}
        description={setupStatusLabel(
          proposal,
          state,
          health,
          availableTo.quickEdit,
        )}
        action={CardActions(props)}
      >
        {state !== "declined" && state !== "expired" && (
          <div className={DETAIL_LIST}>
            {state === "pending" ? (
              <ProposalDetails proposal={proposal} availableTo={availableTo} />
            ) : (
              <StatusDetails
                proposal={proposal}
                state={state}
                availableTo={availableTo}
                health={health}
              />
            )}
          </div>
        )}
        {recovery === "automatic" && (
          <div className="text-xs text-muted-foreground-2">Finishing setup</div>
        )}
        {error !== undefined && (
          <div role="alert" className="text-sm text-destructive">
            {error}
          </div>
        )}
      </SetupCard>
    </div>
  );
}
