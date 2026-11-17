import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/primitives/badge";
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
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
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
import { Sheet, SheetContent, SheetTitle } from "@/primitives/sheet";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { Textarea } from "@/primitives/textarea";
import { GoogleIcon } from "./brand-icons";
import {
  type AllowedDomain,
  addSsoCertificateAtom,
  configureSsoAtom,
  decodeSsoResult,
  disconnectSsoAtom,
  draftSsoAtom,
  type SamlProvider,
  type SsoConnection,
  type SsoProvider,
  type SsoStatus,
  setSsoActiveAtom,
  ssoReactivityKeys,
} from "./data";
import {
  BuildingsIcon,
  CircleDashedIcon,
  ClipboardIcon,
  ClockIcon,
  DotsIcon,
  KeyIcon,
  PencilIcon,
  ToggleIcon,
  TrashIcon,
} from "./icons";
import {
  copyValue,
  formatShortDate,
  identityProviderName,
  isSamlProvider,
  methodFields,
  methodLabels,
  mobileSignInNote,
  otherProvidersHint,
  providerChoices,
  type SamlField,
  type SamlMethod,
  samlLabel,
  samlProviderConfig,
  singleSignOnRowId,
  ssoAddOnPrice,
} from "./providers";
import {
  ActionButton,
  Choice,
  ChoiceGroup,
  ConfirmDialog,
  CopyValue,
  errorMessage,
  menuIconSlot,
  showError,
} from "./ui";

export type SetupTarget = {
  mode: "create" | "edit" | "certificate";
  provider: SamlProvider;
  domainId: string;
};

const settle = <A,>(promise: Promise<A>) =>
  promise.then((value) => value as A | undefined);

export type SelfServeSsoProps = {
  organizationId: string;
  status: SsoStatus | undefined;
  domains: ReadonlyArray<AllowedDomain>;
  mfaEnabled: boolean;
  accountProtected: boolean;
  onDomainsChanged: () => void;
  onGoogleWorkspace: () => void;
  children?: ReactNode;
};

/** The self-serve SAML rows and dialogs on Identity & access (Capy's SelfServeSso). */
export function SelfServeSso({
  organizationId,
  status,
  domains,
  accountProtected,
  onDomainsChanged,
  onGoogleWorkspace,
  children,
}: SelfServeSsoProps) {
  const reactivityKeys = ssoReactivityKeys(organizationId);
  const draft = useAtomSet(draftSsoAtom, { mode: "promise" });
  const setActive = useAtomSet(setSsoActiveAtom, { mode: "promise" });
  const disconnect = useAtomSet(disconnectSsoAtom, { mode: "promise" });
  const [providerOpen, setProviderOpen] = useState(false);
  const [target, setTarget] = useState<SetupTarget | null>(null);
  const [drafted, setDrafted] = useState<SsoConnection | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [draftFailure, setDraftFailure] = useState<string>();
  const [turnOnOpen, setTurnOnOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const enterprise = status?.enterprise ?? [];
  const connection = status?.connection ?? null;
  const samlProvider =
    connection !== null && isSamlProvider(connection.provider)
      ? connection.provider
      : undefined;
  const addOn = status?.addOn ?? null;
  const verified = domains.filter(
    (domain) =>
      domain.verification === "dns" &&
      !enterprise.some((entry) => entry.domain === domain.domain),
  );
  const connected = connection !== null || enterprise.length > 0;
  const targetConnection =
    target === null
      ? undefined
      : [drafted, connection].find(
          (candidate) =>
            candidate !== null &&
            candidate.provider === target.provider &&
            candidate.domainId === target.domainId,
        );

  const startSetup = (provider: SamlProvider, domainId: string) => {
    setTarget({ mode: "create", provider, domainId });
    setDraftFailure(undefined);
    if (
      connection?.state === "draft" &&
      connection.provider === provider &&
      connection.domainId === domainId &&
      connection.serviceProvider !== null
    )
      return;
    setPreparing(true);
    settle(
      draft({
        params: { orgId: organizationId },
        payload: { provider, domainId },
        reactivityKeys,
      }),
    )
      .then((result) => {
        if (result === undefined) setTarget(null);
        else setDrafted(decodeSsoResult(result).connection);
      })
      .catch((error) =>
        setDraftFailure(
          errorMessage(error, "Could not start the connection, try again"),
        ),
      )
      .finally(() => setPreparing(false));
  };

  const run = (
    action: () => Promise<unknown>,
    onDone: () => void,
    failure: string,
  ) => {
    setPending(true);
    action()
      .then(() => {
        onDomainsChanged();
        onDone();
      })
      .catch((error) => showError(error, failure))
      .finally(() => setPending(false));
  };

  const plansOnly = addOn?.status === "none" && !addOn.eligible;
  const emptyDescription =
    verified.length === 0
      ? "Verify a domain with DNS to set up single sign-on"
      : plansOnly
        ? `Single sign-on needs a Lite, Pro or Max plan, then ${ssoAddOnPrice(addOn?.priceCents)}`
        : otherProvidersHint;

  const googleUnavailable =
    status?.available === true
      ? accountProtected
        ? undefined
        : "Set up a passkey or an authenticator app on your account first"
      : "Contact us to connect Google Workspace OAuth";

  const activeProvider = target?.provider ?? samlProvider ?? "saml";
  const activeDomain =
    domains.find((domain) => domain.id === target?.domainId)?.domain ??
    connection?.domain ??
    "";

  return (
    <>
      {connection !== null && samlProvider !== undefined && (
        <SamlConnectionRow
          connection={connection}
          provider={samlProvider}
          pending={pending}
          onContinue={() =>
            connection.state === "draft" && connection.configured
              ? setTurnOnOpen(true)
              : startSetup(samlProvider, connection.domainId)
          }
          onEdit={(mode) =>
            setTarget({
              mode,
              provider: samlProvider,
              domainId: connection.domainId,
            })
          }
          onToggle={() =>
            connection.state === "active"
              ? run(
                  () =>
                    setActive({
                      params: { orgId: organizationId },
                      payload: { active: false },
                      reactivityKeys,
                    }),
                  () =>
                    toast.success(`${samlLabel(samlProvider)} is off`, {
                      description: `Members on ${connection.domain} sign in the way they did before`,
                    }),
                  "Could not turn single sign-on off",
                )
              : setTurnOnOpen(true)
          }
          onRemove={() => setRemoveOpen(true)}
        />
      )}
      {children}
      {!connected && (
        <SettingsRow
          id={singleSignOnRowId}
          icon={<BuildingsIcon />}
          label="No identity provider connected"
          description={emptyDescription}
        >
          {plansOnly ? (
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/settings/org/billing" />}
            >
              See plans
            </Button>
          ) : (
            <Button
              variant="solid"
              size="sm"
              disabled={verified.length === 0}
              onClick={() => setProviderOpen(true)}
            >
              Set up
            </Button>
          )}
        </SettingsRow>
      )}
      <ProviderDialog
        open={providerOpen}
        google={googleUnavailable}
        onOpenChange={setProviderOpen}
        onContinue={(provider) => {
          const first = verified[0];
          setProviderOpen(false);
          if (provider === "google_workspace") onGoogleWorkspace();
          else if (first !== undefined) startSetup(provider, first.id);
        }}
      />
      {target !== null && (
        <SamlSetupSheet
          key={`${target.mode} ${target.provider}`}
          organizationId={organizationId}
          open={!turnOnOpen}
          target={target}
          connection={targetConnection ?? null}
          domains={verified}
          preparing={preparing}
          draftFailure={draftFailure}
          onDomainChange={(domainId) => startSetup(target.provider, domainId)}
          onClose={() => setTarget(null)}
          onSaved={() => {
            if (target.mode === "create") {
              setTurnOnOpen(true);
              return;
            }
            setTarget(null);
            if (target.mode === "certificate")
              toast.success("Certificate added", {
                description: `Capy trusts both, so sign-ins keep working when ${identityProviderName(target.provider)} switches`,
              });
            else
              toast.success("Saved", {
                description: `Capy uses the new ${samlLabel(target.provider)} values from the next sign-in`,
              });
          }}
        />
      )}
      <TurnOnDialog
        provider={activeProvider}
        domain={activeDomain}
        open={turnOnOpen}
        pending={pending}
        onOpenChange={(open) => !pending && setTurnOnOpen(open)}
        onConfirm={() =>
          run(
            () =>
              setActive({
                params: { orgId: organizationId },
                payload: { active: true },
                reactivityKeys,
              }),
            () => {
              const provider = target?.provider ?? samlProvider ?? "saml";
              setTurnOnOpen(false);
              setTarget(null);
              setDrafted(null);
              toast.success(`${samlLabel(provider)} is on`, {
                description:
                  target === null &&
                  connection !== null &&
                  connection.testedAt !== null
                    ? `Members on ${connection.domain} sign in through ${identityProviderName(provider)}`
                    : "Sign in through it once to finish",
              });
            },
            "Could not turn single sign-on on",
          )
        }
      />
      <ConfirmDialog
        open={removeOpen}
        onOpenChange={(open) => !pending && setRemoveOpen(open)}
        title={`Remove the ${samlProvider === undefined ? "single sign-on" : samlLabel(samlProvider)} connection?`}
        description={`Members on ${connection?.domain ?? "your domain"} sign in the way they did before, and their accounts and memberships stay`}
        confirmLabel="Remove"
        loading={pending}
        loadingLabel="Removing"
        closeOnConfirm={false}
        onConfirm={() =>
          run(
            () =>
              disconnect({ params: { orgId: organizationId }, reactivityKeys }),
            () => {
              setRemoveOpen(false);
              setDrafted(null);
              toast.success("Connection removed", {
                description: `${identityProviderName(samlProvider ?? "saml")} no longer signs anyone in to Capy`,
              });
            },
            "Could not remove the connection",
          )
        }
      />
    </>
  );
}

const copyTestLink = () => {
  const link = window.location.href;
  (navigator.clipboard?.writeText(link) ?? Promise.reject(new Error()))
    .then(() => toast.success("Link copied"))
    .catch(() => toast.error("Could not copy the link"));
};

/** Capy's connection state badge for a SAML connection. */
export function connectionBadge(connection: SsoConnection) {
  const untested =
    connection.state === "active" && connection.testedAt === null;
  if (connection.state === "draft")
    return (
      <Badge size="sm">
        <CircleDashedIcon />
        Draft
      </Badge>
    );
  if (untested)
    return (
      <Badge size="sm" color="warning">
        <ClockIcon />
        Waiting for a test sign-in
      </Badge>
    );
  if (connection.state === "active")
    return (
      <Badge size="sm" color="success">
        Active
      </Badge>
    );
  if (connection.state === "off") return <Badge size="sm">Off</Badge>;
  if (connection.state === "suspended")
    return (
      <Badge size="sm" color="warning">
        Paused
      </Badge>
    );
  return (
    <Badge size="sm" color="warning">
      Not working
    </Badge>
  );
}

/** Capy's description line for a SAML connection row. */
export function connectionDescription(
  connection: SsoConnection,
  provider: SamlProvider,
) {
  const name = identityProviderName(provider);
  const domain = connection.domain;
  if (connection.state === "draft")
    return `Finish setting up ${name} for ${domain} to turn it on`;
  if (connection.state === "active" && connection.testedAt === null)
    return `Open this page in a private window and sign in with your ${domain} address to finish`;
  if (connection.state === "active" && connection.testedAt !== null)
    return `Members on ${domain} sign in with ${name}, tested ${formatShortDate(connection.testedAt)}`;
  if (connection.state === "off")
    return `Members on ${domain} sign in the way they did before`;
  if (connection.state === "suspended")
    return `Paused until ${domain} is verified with DNS and the single sign-on add-on is active`;
  return `${name} for ${domain} is not working, remove it and add it again`;
}

export type SamlConnectionRowProps = {
  connection: SsoConnection;
  provider: SamlProvider;
  pending: boolean;
  onContinue: () => void;
  onEdit: (mode: "edit" | "certificate") => void;
  onToggle: () => void;
  onRemove: () => void;
};

export function SamlConnectionRow({
  connection,
  provider,
  pending,
  onContinue,
  onEdit,
  onToggle,
  onRemove,
}: SamlConnectionRowProps) {
  const label = samlLabel(provider);
  const untested =
    connection.state === "active" && connection.testedAt === null;
  return (
    <SettingsRow
      id={singleSignOnRowId}
      icon={samlProviderConfig[provider].icon}
      label={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {label}
          {provider !== "saml" && (
            <span className="font-normal text-muted-foreground-2">SAML</span>
          )}
          {connectionBadge(connection)}
        </span>
      }
      description={connectionDescription(connection, provider)}
    >
      {connection.state === "draft" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onContinue}
        >
          Continue
        </Button>
      )}
      {untested && (
        <Button variant="ghost" size="sm" onClick={copyTestLink}>
          <ClipboardIcon />
          Copy link
        </Button>
      )}
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label={`Manage ${label}`}
            />
          }
        >
          <DotsIcon />
        </MenuTrigger>
        <MenuContent align="end" className="w-52">
          {connection.state !== "draft" && (
            <>
              <MenuItem onClick={() => onEdit("edit")}>
                <span className={menuIconSlot}>
                  <PencilIcon />
                </span>
                Edit
              </MenuItem>
              <MenuItem onClick={() => onEdit("certificate")}>
                <span className={menuIconSlot}>
                  <KeyIcon />
                </span>
                Add certificate
              </MenuItem>
            </>
          )}
          {(connection.state === "active" || connection.state === "off") && (
            <MenuItem onClick={onToggle}>
              <span className={menuIconSlot}>
                <ToggleIcon />
              </span>
              {connection.state === "active" ? "Turn off" : "Turn on"}
            </MenuItem>
          )}
          {connection.state !== "draft" && <MenuSeparator />}
          <MenuItem intent="danger" onClick={onRemove}>
            <span className={menuIconSlot}>
              <TrashIcon />
            </span>
            Remove
          </MenuItem>
        </MenuContent>
      </Menu>
    </SettingsRow>
  );
}

export type ProviderDialogProps = {
  open: boolean;
  /** Why Google Workspace OAuth can't be picked, or undefined when it can. */
  google: string | undefined;
  onOpenChange: (open: boolean) => void;
  onContinue: (provider: SsoProvider) => void;
};

export function ProviderDialog({
  open,
  google,
  onOpenChange,
  onContinue,
}: ProviderDialogProps) {
  const [picked, setPicked] = useState<SsoProvider>();
  const provider =
    picked ?? (google === undefined ? "google_workspace" : "okta");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set up single sign-on</DialogTitle>
          <DialogDescription>
            Pick the provider your company signs in with
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ChoiceGroup label="Provider">
            <Choice
              checked={provider === "google_workspace"}
              disabled={google !== undefined}
              onSelect={() => setPicked("google_workspace")}
              icon={<GoogleIcon />}
              label="Google Workspace OAuth"
              wrapDescription
              description={
                google ??
                "Nothing to set up in Google, everyone on your domain signs in with Google"
              }
            />
            {providerChoices.map((choice) => (
              <Choice
                key={choice}
                checked={provider === choice}
                onSelect={() => setPicked(choice)}
                icon={samlProviderConfig[choice].icon}
                label={
                  choice === "google_saml"
                    ? "Google Workspace SAML"
                    : samlProviderConfig[choice].label
                }
                description={samlProviderConfig[choice].hint}
                wrapDescription
              />
            ))}
          </ChoiceGroup>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button intent="accent" onClick={() => onContinue(provider)}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetupField({
  label,
  htmlFor,
  problem,
  hint,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  problem?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {problem !== undefined ? (
        <span className="text-xs font-normal text-destructive">{problem}</span>
      ) : hint !== undefined ? (
        <span className="text-xs font-normal text-muted-foreground-2">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function SetupStep({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description !== undefined && (
          <p className="text-xs font-normal text-muted-foreground-2">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

type SetupValues = Record<SamlField | "metadataName", string>;

export const setupFieldsFor = (
  mode: SetupTarget["mode"],
  method: SamlMethod,
) =>
  mode === "certificate" ? (["certificate"] as const) : methodFields[method];

/** The configure payload for the chosen method (Capy's SamlSetupSheet submit). */
export const configurePayload = (method: SamlMethod, values: SetupValues) =>
  method === "metadataUrl"
    ? { kind: "metadataUrl" as const, metadataUrl: values.metadataUrl.trim() }
    : method === "metadata"
      ? { kind: "metadata" as const, metadata: values.metadata }
      : {
          kind: "manual" as const,
          ssoUrl: values.ssoUrl.trim(),
          entityId: values.entityId.trim(),
          certificate: values.certificate,
        };

const fieldProblems = (error: unknown, fields: ReadonlyArray<SamlField>) => {
  if (typeof error !== "object" || error === null) return undefined;
  const raw = (error as { fields?: unknown }).fields;
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter(
      (entry): entry is { field: SamlField; message: string } =>
        typeof entry === "object" &&
        entry !== null &&
        fields.includes(entry.field) &&
        typeof entry.message === "string",
    )
    .map((entry) => [entry.field, entry.message] as const);
};

export type SamlSetupSheetProps = {
  organizationId: string;
  open: boolean;
  target: SetupTarget;
  connection: SsoConnection | null;
  domains: ReadonlyArray<AllowedDomain>;
  preparing: boolean;
  draftFailure: string | undefined;
  onDomainChange: (domainId: string) => void;
  onClose: () => void;
  onSaved: () => void;
};

export function SamlSetupSheet({
  organizationId,
  open,
  target,
  connection,
  domains,
  preparing,
  draftFailure,
  onDomainChange,
  onClose,
  onSaved,
}: SamlSetupSheetProps) {
  const configure = useAtomSet(configureSsoAtom, { mode: "promise" });
  const addCertificate = useAtomSet(addSsoCertificateAtom, { mode: "promise" });
  const config = samlProviderConfig[target.provider];
  const name = identityProviderName(target.provider);
  const fileRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<SamlMethod>(
    config.methods[0] ?? "manual",
  );
  const [values, setValues] = useState<SetupValues>({
    metadataUrl: "",
    metadata: "",
    metadataName: "",
    ssoUrl: "",
    entityId: "",
    certificate: "",
  });
  const [problems, setProblems] = useState<Partial<Record<SamlField, string>>>(
    {},
  );
  const [failure, setFailure] = useState<string>();
  const [saving, setSaving] = useState(false);
  const reactivityKeys = ssoReactivityKeys(organizationId);
  const fields = setupFieldsFor(target.mode, method);
  const complete = fields.every((field) => values[field].trim() !== "");
  const serviceProvider = connection?.serviceProvider ?? null;
  const set = (field: keyof SetupValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setProblems((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    setSaving(true);
    setProblems({});
    setFailure(undefined);
    const request =
      target.mode === "certificate"
        ? addCertificate({
            params: { orgId: organizationId },
            payload: { certificate: values.certificate },
            reactivityKeys,
          })
        : configure({
            params: { orgId: organizationId },
            payload: configurePayload(method, values),
            reactivityKeys,
          });
    request
      .then(() => onSaved())
      .catch((error) => {
        const found = fieldProblems(error, fields);
        if (found === undefined) {
          setFailure(errorMessage(error, "Could not save, try again"));
          return;
        }
        setProblems(Object.fromEntries(found));
        if (found.length === 0)
          setFailure(errorMessage(error, "Could not save, try again"));
      })
      .finally(() => setSaving(false));
  };

  const textField = (
    field: "metadataUrl" | "ssoUrl" | "entityId",
    label: string,
    placeholder: string,
    hint?: string,
  ) => (
    <SetupField
      label={label}
      htmlFor={`saml-${field}`}
      problem={problems[field]}
      hint={hint}
    >
      <Input
        id={`saml-${field}`}
        value={values[field]}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={problems[field] !== undefined}
        disabled={saving}
        onChange={(event) => set(field, event.target.value)}
      />
    </SetupField>
  );

  const certificateField = (
    <SetupField
      label={config.certificate}
      htmlFor="saml-certificate"
      problem={problems.certificate}
      hint={
        target.mode === "certificate"
          ? undefined
          : `Capy checks the signature on every sign-in from ${name} with it`
      }
    >
      <Textarea
        id="saml-certificate"
        rows={6}
        value={values.certificate}
        placeholder="-----BEGIN CERTIFICATE-----"
        spellCheck={false}
        aria-invalid={problems.certificate !== undefined}
        disabled={saving}
        onChange={(event) => set("certificate", event.target.value)}
      />
    </SetupField>
  );

  const title =
    target.mode === "certificate"
      ? "Add a certificate"
      : `${target.mode === "edit" ? "Edit" : "Set up"} ${samlLabel(target.provider)}`;
  const shownFailure = failure ?? draftFailure;
  const domainItems = Object.fromEntries(
    domains.map((domain) => [domain.id, domain.domain]),
  );

  return (
    <Sheet open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <SheetContent aria-label={title}>
        <div data-slot="sheet-header">
          <SheetTitle>
            <span className="flex items-center gap-2">
              {config.icon}
              {title}
            </span>
          </SheetTitle>
        </div>
        <div data-slot="sheet-body" className="gap-6">
          {target.mode === "certificate" ? (
            <>
              <p className="text-sm font-normal text-muted-foreground-1">
                {`Paste ${name}'s new certificate, Capy trusts both, so sign-ins keep working when ${name} switches`}
              </p>
              {certificateField}
            </>
          ) : (
            <>
              <SetupStep title="Domain">
                <SetupField
                  label={`Sign in with ${name} for`}
                  hint={`Everyone with an address on this domain signs in through ${name}, only domains verified by DNS are listed`}
                >
                  <MenuSelect
                    items={domainItems}
                    value={target.domainId}
                    disabled={target.mode === "edit" || preparing || saving}
                    onValueChange={(value) => {
                      if (value !== null && value !== target.domainId)
                        onDomainChange(value);
                    }}
                  >
                    <MenuSelectTrigger className="w-full" aria-label="Domain">
                      <MenuSelectValue />
                    </MenuSelectTrigger>
                    <MenuSelectContent>
                      {domains.map((domain) => (
                        <MenuSelectItem key={domain.id} value={domain.id}>
                          {domain.domain}
                        </MenuSelectItem>
                      ))}
                    </MenuSelectContent>
                  </MenuSelect>
                </SetupField>
                {target.provider === "google_saml" && (
                  <p className="text-xs font-normal text-muted-foreground-1">
                    Google Workspace OAuth on this page needs nothing set up in
                    Google, use SAML here when your Google admin wants to choose
                    who gets access
                  </p>
                )}
              </SetupStep>
              <SetupStep
                title={`Add Capy to ${name}`}
                description={config.where}
              >
                {preparing || serviceProvider === null ? (
                  shownFailure === undefined || preparing ? (
                    <div className="flex flex-col gap-3" aria-busy="true">
                      <SkeletonPanel className="h-(--h-control-base) w-full" />
                      <SkeletonPanel className="h-(--h-control-base) w-full" />
                    </div>
                  ) : null
                ) : (
                  connection !== null &&
                  config.copy.map(([label, source]) => (
                    <SetupField key={label} label={label}>
                      <CopyValue
                        value={copyValue(source, connection)}
                        label={label}
                      />
                    </SetupField>
                  ))
                )}
              </SetupStep>
              <SetupStep
                title={`Connect ${name} to Capy`}
                description={config.from}
              >
                {config.methods.length > 1 && (
                  <fieldset
                    aria-label="How to connect"
                    className="flex items-center self-start"
                  >
                    {config.methods.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant="segmented"
                        size="sm"
                        data-selected={method === option || undefined}
                        aria-pressed={method === option}
                        disabled={saving}
                        onClick={() => {
                          setMethod(option);
                          setProblems({});
                          setFailure(undefined);
                        }}
                      >
                        {methodLabels[option]}
                      </Button>
                    ))}
                  </fieldset>
                )}
                {method === "metadataUrl" &&
                  config.metadataUrl !== undefined &&
                  textField(
                    "metadataUrl",
                    config.metadataUrl.label,
                    config.metadataUrl.example,
                    config.metadataUrl.hint,
                  )}
                {method === "metadata" && (
                  <SetupField label="Metadata file" problem={problems.metadata}>
                    <div className="flex min-w-0 items-center gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".xml,application/xml,text/xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file === undefined) return;
                          file
                            .text()
                            .then((text) => {
                              set("metadata", text);
                              set("metadataName", file.name);
                            })
                            .catch(() =>
                              setProblems({
                                metadata:
                                  "Could not read this file, choose it again",
                              }),
                            );
                        }}
                      />
                      <Button
                        variant="solid"
                        size="sm"
                        disabled={saving}
                        onClick={() => fileRef.current?.click()}
                      >
                        Choose file
                      </Button>
                      <span className="min-w-0 truncate text-xs font-normal text-muted-foreground-2">
                        {values.metadataName === ""
                          ? "GoogleIDPMetadata.xml from Download metadata"
                          : values.metadataName}
                      </span>
                    </div>
                  </SetupField>
                )}
                {method === "manual" && (
                  <>
                    {textField("ssoUrl", config.ssoUrl[0], config.ssoUrl[1])}
                    {textField(
                      "entityId",
                      config.entityId[0],
                      config.entityId[1],
                    )}
                    {certificateField}
                  </>
                )}
              </SetupStep>
            </>
          )}
        </div>
        <div data-slot="sheet-footer" className="items-center">
          {shownFailure !== undefined && (
            <span
              role="alert"
              className="mr-auto min-w-0 text-xs font-normal text-destructive"
            >
              {shownFailure}
            </span>
          )}
          <Button variant="ghost" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <ActionButton
            intent="accent"
            loading={saving}
            loadingLabel="Checking"
            disabled={
              !complete ||
              (target.mode === "create" &&
                (preparing || serviceProvider === null))
            }
            onClick={submit}
          >
            {target.mode === "certificate"
              ? "Add certificate"
              : target.mode === "edit"
                ? "Save"
                : "Save and turn on"}
          </ActionButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type TurnOnDialogProps = {
  provider: SamlProvider;
  domain: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function TurnOnDialog({
  provider,
  domain,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: TurnOnDialogProps) {
  const name = identityProviderName(provider);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{`Turn on ${samlLabel(provider)} for ${domain}?`}</DialogTitle>
          <DialogDescription>
            {`Everyone with an address on ${domain}, in any organization, signs in to Capy through ${name} from their next sign-in, and people already signed in stay signed in`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm font-normal text-muted-foreground-1">
            {`Capy counts a sign-in through ${name} as two-step verification, so turn on MFA in ${name}`}
          </p>
          <p className="text-sm font-normal text-muted-foreground-1">
            {mobileSignInNote(domain)}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <ActionButton
            intent="accent"
            loading={pending}
            loadingLabel="Turning on"
            onClick={onConfirm}
          >
            Turn on
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
