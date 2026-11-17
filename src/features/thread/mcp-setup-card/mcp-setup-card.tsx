import { useState } from "react";
import {
  asksOwner,
  initialSecretValues,
  type McpAvailability,
  type McpRecovery,
  type McpSecretValues,
  type McpServerHealth,
  type McpSetupBusy,
  type McpSetupState,
} from "./helpers";
import { McpSetupCardView } from "./mcp-setup-card-view";
import { type McpConnectionOwner, McpSetupDialog } from "./mcp-setup-dialog";
import { decodeProposal, type McpServerProposal } from "./proposal";

export type McpSetupSubmission = {
  values: McpSecretValues;
  owner: McpConnectionOwner | null;
};

export type McpSetupCardProps = {
  proposal: unknown;
  state?: McpSetupState;
  availableTo: McpAvailability;
  health?: McpServerHealth;
  recovery?: McpRecovery;
  iconDataUri?: string;
  existingOwner?: McpConnectionOwner;
  lockedOwner?: McpConnectionOwner;
  busy?: McpSetupBusy;
  error?: string;
  onSubmit?: (submission: McpSetupSubmission) => void;
  onDecline?: () => void;
  onRetry?: () => void;
  onViewServer?: () => void;
};

const presetOwner = (
  proposal: McpServerProposal,
  lockedOwner: McpConnectionOwner | undefined,
  existingOwner: McpConnectionOwner | undefined,
  chosen: McpConnectionOwner | null,
): McpConnectionOwner | null =>
  proposal.kind === "add"
    ? proposal.owner === undefined
      ? (lockedOwner ?? chosen)
      : proposal.owner === "user"
        ? "personal"
        : "shared"
    : (existingOwner ?? null);

export function McpSetupCard(props: McpSetupCardProps) {
  const proposal = decodeProposal(props.proposal);
  if (proposal === undefined || proposal.kind === "plugin") return null;
  return <ServerSetup {...props} proposal={proposal} />;
}

function ServerSetup({
  proposal,
  state = "pending",
  ...props
}: McpSetupCardProps & { proposal: McpServerProposal }) {
  const [reviewing, setReviewing] = useState(false);
  const [values, setValues] = useState(() => initialSecretValues(proposal));
  const [chosenOwner, setChosenOwner] = useState<McpConnectionOwner | null>(
    null,
  );
  const owner = presetOwner(
    proposal,
    props.lockedOwner,
    props.existingOwner,
    chosenOwner,
  );
  const submit = () => props.onSubmit?.({ values, owner });
  const close = () => {
    setReviewing(false);
    setValues(initialSecretValues(proposal));
    setChosenOwner(null);
  };
  return (
    <>
      <McpSetupCardView
        proposal={proposal}
        state={state}
        availableTo={props.availableTo}
        health={props.health}
        recovery={props.recovery}
        busy={props.busy}
        error={props.error}
        iconDataUri={props.iconDataUri}
        onReview={
          props.availableTo.quickEdit === undefined
            ? () => setReviewing(true)
            : submit
        }
        onDecline={state === "pending" ? props.onDecline : undefined}
        onRetry={props.onRetry}
        onViewServer={props.onViewServer}
      />
      {reviewing && state === "pending" && (
        <McpSetupDialog
          proposal={proposal}
          availableTo={props.availableTo}
          iconDataUri={props.iconDataUri}
          values={values}
          connectionOwner={owner}
          lockedOwner={props.lockedOwner}
          ownerQuestion={asksOwner(proposal)}
          submitting={props.busy === "review"}
          error={props.error}
          onValuesChange={setValues}
          onConnectionOwnerChange={setChosenOwner}
          onSubmit={submit}
          onClose={close}
        />
      )}
    </>
  );
}
