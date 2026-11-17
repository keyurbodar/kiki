import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult, type Atom } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { Organization } from "@/data/api/schemas/organization";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import {
  type AllowedDomain,
  accountAtom,
  allowedDomainsAtom,
  apiKeysAtom,
  BuildingsIcon,
  ConfirmDialog,
  connectSsoAtom,
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DotsIcon,
  decodeAccountEmails,
  decodeAllowedDomains,
  decodeApiKeys,
  decodeMembers,
  decodeSsoResult,
  decodeSsoStatus,
  disconnectSsoAtom,
  type EnterpriseConnection,
  enterpriseProviderIcons,
  enterpriseProviderLabels,
  GlobeIcon,
  GoogleIcon,
  identityKeys,
  LockIcon,
  linkClass,
  membersAtom,
  menuIconSlot,
  PasskeysIcon,
  PlusMediumIcon,
  removeAllowedDomainAtom,
  SelfServeSso,
  ShieldCheckIcon,
  type SsoStatus,
  setMfaRequiredAtom,
  setOrgSsoRequiredAtom,
  showError,
  singleSignOnRowId,
  ssoReactivityKeys,
  ssoStatusAtom,
  ToggleIcon,
  TrashIcon,
} from "@/features/settings-org/saml-sso";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import {
  AddDomainDialog,
  ConnectGoogleWorkspaceDialog,
  DomainDialog,
  RequireMfaDialog,
} from "./dialogs";
import { SsoCell, VerificationBadge } from "./domain-badges";
import {
  adminOnlyReason,
  domainSso,
  formatDeadline,
  type MfaLevel,
  meetsMfaLevel,
  mfaLevelLabels,
  mfaToastCopy,
  remainingGraceDays,
  requireSsoState,
} from "./identity";

const domainsRow = { id: "org-email-domains", title: "Domains" };
const twoStepRow = {
  id: "org-require-two-step",
  title: "Require two-step verification",
};

function useResult<A, E>(atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>) {
  const result = useAtomValue(atom);
  return AsyncResult.isSuccess(result) ? result.value : undefined;
}

function useSsoStatus(orgId: string): SsoStatus | undefined {
  const value = useResult(ssoStatusAtom(orgId));
  return value === undefined ? undefined : decodeSsoStatus(value);
}

function useDomains(orgId: string): ReadonlyArray<AllowedDomain> {
  const value = useResult(allowedDomainsAtom(orgId));
  return value === undefined ? [] : decodeAllowedDomains(value);
}

function useMembers(orgId: string) {
  const members = decodeMembers(useResult(membersAtom(orgId)) ?? []);
  const user = useResult(currentUserAtom);
  return {
    members,
    me: members.find((member) => member.userId === user?.id),
  };
}

export type GoogleWorkspaceStep = {
  kind: "connect" | "buy";
  domainId: string | undefined;
} | null;

/** Identity & access: /settings/org/identity (Capy's OrgIdentityPage). */
export function OrgIdentityPage() {
  const organizations = useResult(organizationsAtom);
  const organization = organizations?.[0];
  const [googleWorkspaceStep, setGoogleWorkspaceStep] =
    useState<GoogleWorkspaceStep>(null);
  if (organization === undefined) return null;
  const isAdmin =
    organization.accessLevel === "admin" ||
    organization.accessLevel === "owner";
  const adminReason = isAdmin ? undefined : adminOnlyReason;
  return (
    <SettingsPage title="Identity & access">
      {isAdmin ? (
        <DomainsSection organizationId={organization.id} />
      ) : (
        <SettingsSection
          id={domainsRow.id}
          title={domainsRow.title}
          description={adminReason}
        >
          <DataTable card density="pick" columns="minmax(0,1fr)">
            <DataTableRow interactive={false}>
              <DataTableCell className="min-h-24 justify-center">
                Only organization admins can see domains
              </DataTableCell>
            </DataTableRow>
          </DataTable>
        </SettingsSection>
      )}
      <AuthenticationSection
        organization={organization}
        isAdmin={isAdmin}
        adminReason={adminReason}
        googleWorkspaceStep={googleWorkspaceStep}
        onGoogleWorkspaceStepChange={setGoogleWorkspaceStep}
      />
    </SettingsPage>
  );
}

function DomainsSection({ organizationId }: { organizationId: string }) {
  const domains = useDomains(organizationId);
  const refresh = useAtomRefresh(allowedDomainsAtom(organizationId));
  const remove = useAtomSet(removeAllowedDomainAtom, { mode: "promise" });
  const status = useSsoStatus(organizationId);
  const emails = decodeAccountEmails(useResult(accountAtom));
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<AllowedDomain | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = domains.find((entry) => entry.id === openId);

  return (
    <SettingsSection
      id={domainsRow.id}
      title={domainsRow.title}
      description="People with a verified email on these domains can join"
      action={
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <PlusMediumIcon />
          Add domain
        </Button>
      }
    >
      <DataTable
        card
        density="pick"
        columns="minmax(8rem,1fr) minmax(9.5rem,auto) minmax(12.5rem,auto) 2.5rem"
      >
        <DataTableHeader>
          <DataTableHead>Domain</DataTableHead>
          <DataTableHead>Verification</DataTableHead>
          <DataTableHead>Single sign-on</DataTableHead>
          <DataTableHead />
        </DataTableHeader>
        {domains.length === 0 ? (
          <DataTableRow interactive={false}>
            <DataTableCell className="col-span-full min-h-24 justify-center">
              No domains yet
            </DataTableCell>
          </DataTableRow>
        ) : (
          domains.map((entry) => (
            <DataTableRow
              key={entry.id}
              tabIndex={0}
              aria-label={`${entry.domain} details`}
              className="cursor-pointer outline-none focus-visible:outline-ring-inset"
              onClick={() => setOpenId(entry.id)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setOpenId(entry.id);
              }}
            >
              <DataTableCell lead>
                <span className="truncate text-sm">{entry.domain}</span>
              </DataTableCell>
              <DataTableCell>
                <VerificationBadge entry={entry} />
              </DataTableCell>
              <DataTableCell>
                <SsoCell entry={entry} sso={domainSso(entry, status)} />
              </DataTableCell>
              <DataTableCell
                className="justify-end pr-0"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${entry.domain} actions`}
                      />
                    }
                  >
                    <DotsIcon />
                  </MenuTrigger>
                  <MenuContent align="end" className="w-52">
                    <MenuItem onClick={() => setOpenId(entry.id)}>
                      <span className={menuIconSlot}>
                        {entry.verification === "dns" ? (
                          <GlobeIcon />
                        ) : (
                          <ShieldCheckIcon />
                        )}
                      </span>
                      {entry.verification === "dns"
                        ? "Show DNS record"
                        : "Verify with DNS"}
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem
                      intent="danger"
                      onClick={() => setRemoving(entry)}
                    >
                      <span className={menuIconSlot}>
                        <TrashIcon />
                      </span>
                      Remove
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTable>
      <AddDomainDialog
        organizationId={organizationId}
        domains={domains}
        emails={emails}
        open={adding}
        onOpenChange={setAdding}
        onAdded={(entry) => {
          refresh();
          if (entry.verification === "pending") setOpenId(entry.id);
        }}
      />
      <DomainDialog
        organizationId={organizationId}
        entry={open}
        sso={
          open === undefined
            ? { name: undefined, state: undefined }
            : domainSso(open, status)
        }
        onOpenChange={(next) => !next && setOpenId(null)}
        onChanged={refresh}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove ${removing?.domain ?? "domain"}?`}
        description="People with this email domain will no longer be able to join"
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing === null) return;
          const entry = removing;
          remove({
            params: { orgId: organizationId, domainId: entry.id },
            reactivityKeys: ssoReactivityKeys(organizationId),
          })
            .then(() => {
              refresh();
              toast.success(`${entry.domain} removed`);
            })
            .catch((error) => showError(error, "Could not remove this domain"));
        }}
      />
    </SettingsSection>
  );
}

type AuthenticationSectionProps = {
  organization: Organization;
  isAdmin: boolean;
  adminReason: string | undefined;
  googleWorkspaceStep: GoogleWorkspaceStep;
  onGoogleWorkspaceStepChange: (step: GoogleWorkspaceStep) => void;
};

function AuthenticationSection({
  organization,
  isAdmin,
  adminReason,
  googleWorkspaceStep,
  onGoogleWorkspaceStepChange,
}: AuthenticationSectionProps) {
  const { members, me } = useMembers(organization.id);
  const apiKeys = decodeApiKeys(useResult(apiKeysAtom(organization.id)) ?? []);
  const setMfaRequired = useAtomSet(setMfaRequiredAtom, { mode: "promise" });
  const [confirmLevel, setConfirmLevel] = useState<MfaLevel | null>(null);
  const [pending, setPending] = useState(false);
  const accountProtected = me !== undefined && meetsMfaLevel(me, "any");
  const passkeyReady = me !== undefined && meetsMfaLevel(me, "passkey");
  const needsOwnMfa = !organization.mfaRequired && !accountProtected;
  const enforceAt =
    organization.mfaEnforceAt === null
      ? null
      : new Date(organization.mfaEnforceAt.epochMilliseconds);
  const now = Date.now();
  const extended = organization.mfaRequired
    ? members.filter(
        (member) =>
          member.mfaExtendedUntil !== null &&
          member.mfaExtendedUntil.getTime() > now,
      ).length
    : 0;

  const contactUs = () => {
    window.open(
      `mailto:support@capy.ai?subject=${encodeURIComponent(`Single sign-on for ${organization.name}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const save = (required: boolean, graceDays: number, level: MfaLevel) => {
    setPending(true);
    setMfaRequired({
      params: { orgId: organization.id },
      payload: { required, graceDays, level },
      reactivityKeys: [identityKeys.organizations],
    })
      .then(() => {
        setConfirmLevel(null);
        toast.success(mfaToastCopy(required, level));
      })
      .catch((error) =>
        showError(error, "Could not change two-step verification"),
      )
      .finally(() => setPending(false));
  };

  const description = !isAdmin ? (
    adminReason
  ) : needsOwnMfa ? (
    <>
      Set up two-step verification on your account first,{" "}
      <Link to="/settings/security" className={linkClass}>
        in Security
      </Link>
    </>
  ) : (
    <span className="flex flex-col gap-0.5">
      <span>
        {organization.mfaRequired &&
        enforceAt !== null &&
        enforceAt.getTime() > now
          ? `Members without it have until ${formatDeadline(enforceAt)} to set it up`
          : organization.mfaLevel === "passkey"
            ? "Members sign in with a trusted passkey"
            : "Members sign in with a passkey or an authenticator app"}
      </span>
      {extended > 0 && (
        <Link to="/settings/org/members" className={linkClass}>
          {extended === 1
            ? "1 member has an extended deadline"
            : `${extended} members have extended deadlines`}
        </Link>
      )}
    </span>
  );

  return (
    <>
      <SettingsSection
        title="Single sign-on"
        description="Members on your domains sign in through your company's identity provider"
      >
        <Card rows className="@container">
          {isAdmin ? (
            <>
              <SsoRows
                organizationId={organization.id}
                accountProtected={accountProtected}
                mfaEnabled={me?.mfaEnabled === true}
                googleWorkspaceStep={googleWorkspaceStep}
                onGoogleWorkspaceStepChange={onGoogleWorkspaceStepChange}
                onContactUs={contactUs}
              />
              <RequireSsoRow organizationId={organization.id} />
            </>
          ) : (
            <SettingsRow
              id={singleSignOnRowId}
              icon={<BuildingsIcon />}
              label="Single sign-on"
              description={adminReason}
            />
          )}
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Two-step verification"
        description="A second factor on top of every other sign-in"
      >
        <Card rows className="@container">
          <SettingsRow
            id={twoStepRow.id}
            icon={<PasskeysIcon />}
            label={twoStepRow.title}
            className="@max-md:flex-col @max-md:items-stretch"
            description={description}
          >
            <div className="flex items-center gap-3 @max-md:flex-1 @max-md:justify-between">
              {organization.mfaRequired && (
                <MenuSelect
                  items={mfaLevelLabels}
                  value={organization.mfaLevel}
                  disabled={!isAdmin || pending}
                  onValueChange={(value) => {
                    if (value === null || value === organization.mfaLevel)
                      return;
                    if (value === "passkey") setConfirmLevel("passkey");
                    else save(true, remainingGraceDays(enforceAt, now), "any");
                  }}
                >
                  <MenuSelectTrigger
                    className="w-44"
                    aria-label="Two-step level"
                  >
                    <MenuSelectValue />
                  </MenuSelectTrigger>
                  <MenuSelectContent>
                    <MenuSelectItem value="any">
                      {mfaLevelLabels.any}
                    </MenuSelectItem>
                    <MenuSelectItem value="passkey" disabled={!passkeyReady}>
                      {mfaLevelLabels.passkey}
                      {!passkeyReady && (
                        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
                          Trust a passkey first
                        </span>
                      )}
                    </MenuSelectItem>
                  </MenuSelectContent>
                </MenuSelect>
              )}
              <Switch
                checked={organization.mfaRequired}
                disabled={!isAdmin || needsOwnMfa || pending}
                title={adminReason}
                aria-label="Require two-step verification"
                onCheckedChange={(checked) =>
                  checked ? setConfirmLevel("any") : save(false, 0, "any")
                }
              />
            </div>
          </SettingsRow>
        </Card>
        {isAdmin && (
          <RequireMfaDialog
            organizationName={organization.name}
            members={members}
            apiKeys={apiKeys}
            level={confirmLevel ?? "any"}
            open={confirmLevel !== null}
            pending={pending}
            onOpenChange={(next) => !next && setConfirmLevel(null)}
            onConfirm={(graceDays) =>
              save(true, graceDays, confirmLevel ?? "any")
            }
          />
        )}
      </SettingsSection>
    </>
  );
}

type SsoRowsProps = {
  organizationId: string;
  mfaEnabled: boolean;
  accountProtected: boolean;
  googleWorkspaceStep: GoogleWorkspaceStep;
  onGoogleWorkspaceStepChange: (step: GoogleWorkspaceStep) => void;
  onContactUs: () => void;
};

function SsoRows({
  organizationId,
  mfaEnabled,
  accountProtected,
  googleWorkspaceStep,
  onGoogleWorkspaceStepChange,
  onContactUs,
}: SsoRowsProps) {
  const status = useSsoStatus(organizationId);
  const domains = useDomains(organizationId);
  const refreshDomains = useAtomRefresh(allowedDomainsAtom(organizationId));
  const enterprise = status?.enterprise ?? [];
  return (
    <SelfServeSso
      organizationId={organizationId}
      status={status}
      domains={domains}
      mfaEnabled={mfaEnabled}
      accountProtected={accountProtected}
      onDomainsChanged={refreshDomains}
      onGoogleWorkspace={() =>
        onGoogleWorkspaceStepChange({ kind: "connect", domainId: undefined })
      }
    >
      {enterprise.map((entry) => (
        <EnterpriseRow
          key={`${entry.provider} ${entry.domain}`}
          entry={entry}
          onContactUs={onContactUs}
        />
      ))}
      <GoogleWorkspaceRow
        organizationId={organizationId}
        status={status}
        domains={domains}
        accountProtected={accountProtected}
        step={googleWorkspaceStep}
        onStepChange={onGoogleWorkspaceStepChange}
        onDomainsChanged={refreshDomains}
      />
    </SelfServeSso>
  );
}

function EnterpriseRow({
  entry,
  onContactUs,
}: {
  entry: EnterpriseConnection;
  onContactUs: () => void;
}) {
  const label = enterpriseProviderLabels[entry.provider];
  return (
    <SettingsRow
      icon={enterpriseProviderIcons[entry.provider]}
      label={
        <span className="flex items-center gap-2">
          {label}
          <Badge size="sm" color="success">
            Connected
          </Badge>
        </span>
      }
      description={`Members on ${entry.domain} sign in with ${label}, set up for you by Capy`}
    >
      <Button variant="ghost" size="sm" onClick={onContactUs}>
        Change
      </Button>
    </SettingsRow>
  );
}

type GoogleWorkspaceRowProps = {
  organizationId: string;
  status: SsoStatus | undefined;
  domains: ReadonlyArray<AllowedDomain>;
  accountProtected: boolean;
  step: GoogleWorkspaceStep;
  onStepChange: (step: GoogleWorkspaceStep) => void;
  onDomainsChanged: () => void;
};

function GoogleWorkspaceRow({
  organizationId,
  status,
  domains,
  accountProtected,
  step,
  onStepChange,
  onDomainsChanged,
}: GoogleWorkspaceRowProps) {
  const connect = useAtomSet(connectSsoAtom, { mode: "promise" });
  const disconnect = useAtomSet(disconnectSsoAtom, { mode: "promise" });
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const enterprise = status?.enterprise ?? [];
  const eligible = domains.filter(
    (domain) =>
      domain.verification === "dns" &&
      !enterprise.some((entry) => entry.domain === domain.domain),
  );
  const connection =
    status?.connection?.provider === "google_workspace"
      ? status.connection
      : null;
  const addOn = status?.addOn ?? null;
  const addOnEnded = addOn?.status === "none";
  const endsOn =
    addOn?.status === "cancelling" && addOn.currentPeriodEnd !== null
      ? formatDeadline(addOn.currentPeriodEnd)
      : undefined;
  const reactivityKeys = ssoReactivityKeys(organizationId);

  const run = <A,>(
    action: () => Promise<A>,
    onDone: (result: A) => void,
    failure: string,
  ) => {
    setPending(true);
    action()
      .then((result) => {
        onDomainsChanged();
        onDone(result);
      })
      .catch((error) => showError(error, failure))
      .finally(() => setPending(false));
  };

  const state = connection?.state;
  const description =
    connection === null
      ? ""
      : state === "active"
        ? endsOn === undefined
          ? `Members on ${connection.domain} sign in with their work Google account`
          : `Members on ${connection.domain} sign in with their work Google account until the add-on ends on ${endsOn}`
        : state === "pending"
          ? `Connecting ${connection.domain}`
          : state === "suspended"
            ? addOnEnded
              ? `Paused because the single sign-on add-on ended, add it again to turn ${connection.domain} back on`
              : `Paused until ${connection.domain} is verified with DNS again`
            : `Google Workspace OAuth for ${connection.domain} is not working, turn it on to try again or remove it`;

  return (
    <>
      {connection !== null && (
        <SettingsRow
          id={singleSignOnRowId}
          icon={<GoogleIcon />}
          label={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              Google Workspace OAuth
              {state === "active" ? (
                <Badge size="sm" color="success">
                  Active
                </Badge>
              ) : state === "pending" ? (
                <Badge size="sm">Connecting</Badge>
              ) : state === "suspended" ? (
                <Badge size="sm" color="warning">
                  Paused
                </Badge>
              ) : (
                <Badge size="sm" color="warning">
                  Not working
                </Badge>
              )}
            </span>
          }
          description={description}
        >
          {addOnEnded &&
            state !== "active" &&
            state !== "pending" &&
            (addOn?.eligible ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  onStepChange({ kind: "buy", domainId: connection.domainId })
                }
              >
                Add single sign-on
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                render={<Link to="/settings/org/billing" />}
              >
                See plans
              </Button>
            ))}
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label="Manage Google Workspace OAuth"
                />
              }
            >
              <DotsIcon />
            </MenuTrigger>
            <MenuContent align="end" className="w-52">
              {state === "failed" && !addOnEnded && accountProtected && (
                <>
                  <MenuItem
                    onClick={() =>
                      onStepChange({
                        kind: "connect",
                        domainId: connection.domainId,
                      })
                    }
                  >
                    <span className={menuIconSlot}>
                      <ToggleIcon />
                    </span>
                    Turn on
                  </MenuItem>
                  <MenuSeparator />
                </>
              )}
              <MenuItem intent="danger" onClick={() => setDisconnectOpen(true)}>
                <span className={menuIconSlot}>
                  <TrashIcon />
                </span>
                {state === "active" || state === "pending"
                  ? "Disconnect"
                  : "Remove"}
              </MenuItem>
            </MenuContent>
          </Menu>
        </SettingsRow>
      )}
      <ConnectGoogleWorkspaceDialog
        domains={eligible}
        domainId={step?.domainId}
        open={step !== null}
        pending={pending}
        onDomainChange={(domainId) =>
          onStepChange({ kind: "connect", domainId })
        }
        onOpenChange={(next) => !next && onStepChange(null)}
        onConfirm={(domainId) =>
          run(
            () =>
              connect({
                params: { orgId: organizationId },
                payload: { provider: "google_workspace", domainId },
                reactivityKeys,
              }),
            (result) => {
              onStepChange(null);
              const connected = decodeSsoResult(result).connection;
              if (connected?.state === "active")
                toast.success(
                  `Google Workspace OAuth connected for ${connected.domain}`,
                );
              else
                toast.error(
                  "Could not connect Google Workspace OAuth, try again or contact us",
                );
            },
            "Could not connect Google Workspace OAuth",
          )
        }
      />
      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={(next) => !pending && setDisconnectOpen(next)}
        title="Disconnect Google Workspace OAuth?"
        description={`Members on ${connection?.domain ?? "your domain"} go back to signing in with a password, a Google account or an email code`}
        confirmLabel="Disconnect"
        loading={pending}
        loadingLabel="Disconnecting"
        closeOnConfirm={false}
        onConfirm={() =>
          run(
            () =>
              disconnect({ params: { orgId: organizationId }, reactivityKeys }),
            () => {
              setDisconnectOpen(false);
              toast.success("Google Workspace OAuth disconnected");
            },
            "Could not disconnect Google Workspace OAuth",
          )
        }
      />
    </>
  );
}

function RequireSsoRow({ organizationId }: { organizationId: string }) {
  const status = useSsoStatus(organizationId);
  const domains = useDomains(organizationId);
  const refreshDomains = useAtomRefresh(allowedDomainsAtom(organizationId));
  const user = useResult(currentUserAtom);
  const setRequired = useAtomSet(setOrgSsoRequiredAtom, { mode: "promise" });
  const [pending, setPending] = useState(false);
  const state = requireSsoState(status, domains, user?.superadmin === true);
  if (state === null) return null;
  return (
    <SettingsRow
      icon={<LockIcon />}
      label="Require single sign-on"
      description={state.description}
    >
      <Switch
        checked={state.checked}
        disabled={pending || state.disabled}
        aria-label="Require single sign-on"
        onCheckedChange={(required) => {
          setPending(true);
          setRequired({
            params: { orgId: organizationId },
            payload: { required },
            reactivityKeys: ssoReactivityKeys(organizationId),
          })
            .then(() => {
              refreshDomains();
              toast.success(
                required
                  ? `Single sign-on required for ${state.scope}`
                  : "Single sign-on no longer required",
              );
            })
            .catch((error) =>
              showError(error, "Could not change single sign-on"),
            )
            .finally(() => setPending(false));
        }}
      />
    </SettingsRow>
  );
}
