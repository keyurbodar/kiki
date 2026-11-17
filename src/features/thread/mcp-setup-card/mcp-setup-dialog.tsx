import type { ReactNode } from "react";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import {
  canSubmitSetup,
  clientIdLabel,
  clientSecretLabel,
  credentialHeaderNames,
  diffValueLabel,
  endpointLabel,
  environmentNames,
  type McpAvailability,
  type McpSecretGroup,
  type McpSecretValues,
  proposalServer,
  referencedSecrets,
  requestHeaderNames,
  requiredSecrets,
  secretLabel,
  secretValueLabel,
  transportLabel,
  visibleSecretKeys,
  workingDirectoryLabel,
} from "./helpers";
import { AvailabilityValue, ServerTile } from "./parts";
import type { McpServerProposal, McpUpdateProposal } from "./proposal";

export type McpConnectionOwner = "personal" | "shared";

export type McpSetupDialogProps = {
  proposal: McpServerProposal;
  availableTo: McpAvailability;
  iconDataUri?: string;
  values: McpSecretValues;
  connectionOwner: McpConnectionOwner | null;
  lockedOwner?: McpConnectionOwner;
  ownerQuestion: boolean;
  submitting: boolean;
  error?: string;
  onValuesChange: (values: McpSecretValues) => void;
  onConnectionOwnerChange: (owner: McpConnectionOwner) => void;
  onSubmit: () => void;
  onClose: () => void;
};

function SummaryRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-9 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-4 px-4 py-2 text-sm">
      <span className="text-muted-foreground-2">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1.5 text-right font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}

function ServerSummary({
  proposal,
  availableTo,
  iconDataUri,
  connectionOwner,
}: Pick<
  McpSetupDialogProps,
  "proposal" | "availableTo" | "iconDataUri" | "connectionOwner"
>) {
  const server = proposalServer(proposal);
  const transport = server.transport;
  const availability: McpAvailability =
    availableTo.owner === "open" && connectionOwner !== null
      ? {
          ...availableTo,
          owner: connectionOwner === "personal" ? "user" : "organization",
        }
      : availableTo;
  return (
    <Card rows>
      <div className="flex min-w-0 items-center gap-3 p-4">
        <ServerTile iconDataUri={iconDataUri} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {server.displayName}
          </span>
          <span className="truncate text-xs text-muted-foreground-2">
            {server.serverKey}
          </span>
        </div>
      </div>
      <SummaryRow label="Available to">
        <AvailabilityValue availability={availability} />
      </SummaryRow>
      {proposal.kind === "connect" && (
        <SummaryRow label="Connection">
          {connectionOwner === null
            ? "Loading"
            : connectionOwner === "personal"
              ? "Your account"
              : "The organization's account"}
        </SummaryRow>
      )}
      {transport.type === "http" ? (
        <SummaryRow label="Runs at">
          <span className="truncate">{new URL(transport.url).host}</span>
        </SummaryRow>
      ) : (
        <>
          <SummaryRow label="Command">
            <span className="truncate text-xs font-normal">
              {[transport.command, ...transport.args].join(" ")}
            </span>
          </SummaryRow>
          <SummaryRow label="Working directory">
            {transport.cwd ?? "Repository root"}
          </SummaryRow>
        </>
      )}
      <SummaryRow label="Transport">{transportLabel(transport)}</SummaryRow>
      {transport.type === "http" &&
        transport.auth.type === "oauth" &&
        transport.auth.clientId !== null && (
          <SummaryRow label="OAuth client ID">
            <span className="truncate">{transport.auth.clientId}</span>
          </SummaryRow>
        )}
      {transport.type === "http" &&
        transport.auth.type === "oauth" &&
        transport.auth.clientSecretRequired && (
          <SummaryRow label="OAuth client secret">Required</SummaryRow>
        )}
    </Card>
  );
}

function ChangeRow({
  label,
  before,
  after,
}: {
  label: string;
  before: unknown;
  after: unknown;
}) {
  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  return (
    <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-center gap-3 px-4 py-2 text-sm">
      <span className="text-muted-foreground-2">{label}</span>
      <span className="flex min-w-0 items-center justify-end gap-1.5 text-right font-medium text-foreground">
        <span className="truncate text-muted-foreground-2 line-through">
          {diffValueLabel(before)}
        </span>
        <span className="truncate">{diffValueLabel(after)}</span>
      </span>
    </div>
  );
}

const names = (list: readonly string[]) => list.join(", ") || "None";

function UpdateChanges({ proposal }: { proposal: McpUpdateProposal }) {
  const { before, after } = proposal;
  const b = before.transport;
  const a = after.transport;
  return (
    <Card rows>
      <ChangeRow
        label="Name"
        before={before.displayName}
        after={after.displayName}
      />
      <ChangeRow
        label="Key"
        before={before.serverKey}
        after={after.serverKey}
      />
      <ChangeRow
        label="Placement"
        before={before.projectId}
        after={after.projectId}
      />
      <ChangeRow label="Status" before={before.enabled} after={after.enabled} />
      <ChangeRow
        label="Private threads only"
        before={before.privateThreadsOnly === true ? "On" : "Off"}
        after={after.privateThreadsOnly === true ? "On" : "Off"}
      />
      <ChangeRow
        label="Transport"
        before={transportLabel(b)}
        after={transportLabel(a)}
      />
      <ChangeRow
        label="Endpoint"
        before={endpointLabel(b)}
        after={endpointLabel(a)}
      />
      <ChangeRow
        label="Working directory"
        before={workingDirectoryLabel(b)}
        after={workingDirectoryLabel(a)}
      />
      <ChangeRow
        label="Request headers"
        before={names(requestHeaderNames(b))}
        after={names(requestHeaderNames(a))}
      />
      <ChangeRow
        label="Authentication headers"
        before={names(credentialHeaderNames(b))}
        after={names(credentialHeaderNames(a))}
      />
      <ChangeRow
        label="Environment"
        before={names(environmentNames(b))}
        after={names(environmentNames(a))}
      />
      <ChangeRow
        label="OAuth client ID"
        before={clientIdLabel(b)}
        after={clientIdLabel(a)}
      />
      <ChangeRow
        label="OAuth client secret"
        before={clientSecretLabel(b)}
        after={clientSecretLabel(a)}
      />
      {before.iconUrl !== after.iconUrl && (
        <SummaryRow label="Icon">Updated</SummaryRow>
      )}
      {proposal.dropsCredentials && (
        <SummaryRow label="Connection">Reconnect required</SummaryRow>
      )}
    </Card>
  );
}

function SecretFields({
  title,
  description,
  names: fieldNames,
  values,
  visible,
  onChange,
}: {
  title: string;
  description: string;
  names: readonly string[];
  values: Record<string, string>;
  visible: (name: string) => boolean;
  onChange: (name: string, value: string) => void;
}) {
  if (fieldNames.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground-2">{description}</span>
      </div>
      <div className="flex flex-col gap-2">
        {fieldNames.map((name) => (
          <div
            key={name}
            className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-2"
          >
            <Input
              size="sm"
              value={name}
              readOnly
              aria-label={`${title} ${name}`}
            />
            <Input
              size="sm"
              type={visible(name) ? "text" : "password"}
              autoComplete="new-password"
              value={values[name] ?? ""}
              aria-label={`${name} value`}
              placeholder="Required value"
              title={
                visible(name)
                  ? "The model wrote this value; replace it to change it"
                  : undefined
              }
              onChange={(event) => onChange(name, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountOption({
  owner,
  selected,
  disabledReason,
  onSelect,
}: {
  owner: McpConnectionOwner;
  selected: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  const personal = owner === "personal";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabledReason !== undefined}
      title={disabledReason}
      className="relative flex min-h-11 w-full items-center gap-3 rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card p-3 text-left shadow-card outline-none transition-colors duration-100 hover:bg-card-hover focus-visible:outline-ring-inset aria-pressed:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-card"
      onClick={onSelect}
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-md bg-button text-foreground [&_svg]:size-(--icon-base)" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {personal ? "You" : "Organization"}
        </span>
        <span className="text-xs text-pretty text-muted-foreground-2">
          {disabledReason ??
            (personal
              ? "Visible only to you; members who message your threads can use it"
              : "Every member can use it")}
        </span>
      </div>
    </button>
  );
}

const headingFor = (proposal: McpServerProposal, locked: boolean) => {
  const { displayName } = proposalServer(proposal);
  return locked
    ? {
        title: `Update ${displayName}`,
        description: `${displayName} already added, review before updating`,
      }
    : proposal.kind === "add"
      ? {
          title: `Add ${displayName}`,
          description: "Review the server and add required secure values",
        }
      : proposal.kind === "update"
        ? {
            title: `Update ${displayName}`,
            description: "Review the requested changes before updating",
          }
        : {
            title: `Connect ${displayName}`,
            description: "Review the server and choose how to connect",
          };
};

export function McpSetupDialog(props: McpSetupDialogProps) {
  const { proposal, values, onValuesChange } = props;
  const needs = requiredSecrets(proposal);
  const visibleKeys = visibleSecretKeys(proposal);
  const references = referencedSecrets(proposal);
  const server = proposalServer(proposal);
  const locked = proposal.kind === "add" && props.lockedOwner !== undefined;
  const heading = headingFor(proposal, locked);
  const submitLabel = needs.oauth
    ? `Continue to ${server.displayName}`
    : locked || proposal.kind === "update"
      ? "Update server"
      : proposal.kind === "add"
        ? "Add server"
        : "Add connection";
  const visible = (prefix: string) => (name: string) =>
    visibleKeys.has(`${prefix}:${name.toLowerCase()}`);
  const change = (group: McpSecretGroup) => (name: string, value: string) =>
    onValuesChange({ ...values, [group]: { ...values[group], [name]: value } });
  const ready = canSubmitSetup(
    proposal,
    values,
    props.connectionOwner,
    props.ownerQuestion,
  );
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{heading.title}</DialogTitle>
          <DialogDescription>{heading.description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ServerSummary
            proposal={proposal}
            availableTo={props.availableTo}
            iconDataUri={props.iconDataUri}
            connectionOwner={props.connectionOwner}
          />
          {proposal.kind === "update" && <UpdateChanges proposal={proposal} />}
          {references.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  Referenced values
                </span>
                <span className="text-xs text-muted-foreground-2">
                  Read where the server runs; nothing to enter here
                </span>
              </div>
              <Card rows>
                {references.map(([key, secret]) => (
                  <SummaryRow key={key} label={secretLabel(key)}>
                    <span className="truncate text-xs font-normal">
                      {secretValueLabel(secret)}
                    </span>
                  </SummaryRow>
                ))}
              </Card>
            </div>
          )}
          <SecretFields
            title="Request headers"
            description="Sent with every request, whatever the authentication method"
            names={needs.requestHeaders}
            values={values.requestHeaders}
            visible={visible("header")}
            onChange={change("requestHeaders")}
          />
          <SecretFields
            title="Authentication headers"
            description="Used to authenticate this shared server connection"
            names={needs.credentialHeaders}
            values={values.credentialHeaders}
            visible={visible("credential_header")}
            onChange={change("credentialHeaders")}
          />
          <SecretFields
            title="Environment variables"
            description="Sealed on save and passed to this process on thread machines"
            names={needs.environment}
            values={values.environment}
            visible={visible("env")}
            onChange={change("environment")}
          />
          {needs.clientSecret && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcp-setup-client-secret">
                OAuth client secret
              </Label>
              <Input
                id="mcp-setup-client-secret"
                type={visibleKeys.has("client_secret") ? "text" : "password"}
                autoComplete="new-password"
                value={values.clientSecret}
                placeholder="Required value"
                onChange={(event) =>
                  onValuesChange({
                    ...values,
                    clientSecret: event.target.value,
                  })
                }
              />
            </div>
          )}
          {props.ownerQuestion && (
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-medium text-foreground">Owner</span>
              <AccountOption
                owner="personal"
                selected={props.connectionOwner === "personal"}
                disabledReason={
                  props.lockedOwner === "shared"
                    ? "This server belongs to the organization"
                    : undefined
                }
                onSelect={() => props.onConnectionOwnerChange("personal")}
              />
              <AccountOption
                owner="shared"
                selected={props.connectionOwner === "shared"}
                disabledReason={
                  props.lockedOwner === "personal"
                    ? "This server belongs to you"
                    : references.some(
                          ([, secret]) => secret.kind !== "project_env",
                        )
                      ? "Machine and file references need a server you own"
                      : undefined
                }
                onSelect={() => props.onConnectionOwnerChange("shared")}
              />
            </div>
          )}
          <div className="flex items-start gap-2 rounded-(--radius-card) bg-secondary p-3 text-xs text-muted-foreground-1">
            <span>
              {server.transport.type === "stdio"
                ? "Secrets are sealed on save and passed as plaintext only to this process"
                : "Secure values are encrypted and sent only while using this server"}
            </span>
          </div>
          {props.error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              {props.error}
            </p>
          )}
        </DialogBody>
        <DialogFooter className="items-center">
          <a
            href="https://docs.capy.ai/integrations/mcp"
            target="_blank"
            rel="noreferrer"
            className="mr-auto text-sm text-muted-foreground-1 hover:text-foreground"
          >
            MCP guide
          </a>
          <Button
            type="button"
            variant="ghost"
            disabled={props.submitting}
            onClick={props.onClose}
          >
            Cancel
          </Button>
          <Button
            intent="accent"
            disabled={!ready || props.submitting}
            aria-busy={props.submitting || undefined}
            aria-label={
              props.submitting
                ? proposal.kind === "update"
                  ? "Updating"
                  : "Saving"
                : undefined
            }
            onClick={props.onSubmit}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
