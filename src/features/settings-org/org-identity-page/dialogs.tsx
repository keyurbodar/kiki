import { useAtomSet } from "@effect/atom-react";
import { type FormEvent, Fragment, useState } from "react";
import { toast } from "sonner";
import {
  ActionButton,
  type AllowedDomain,
  type ApiKeySummary,
  addAllowedDomainAtom,
  CopyValue,
  decodeAllowedDomain,
  errorMessage,
  identityKeys,
  type OrgMember,
  verifyAllowedDomainAtom,
} from "@/features/settings-org/saml-sso";
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
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { TokenList } from "@/primitives/token-list";
import { SsoRequirementBadge } from "./domain-badges";
import {
  type DomainSso,
  deadlineFrom,
  domainDialogDescription,
  domainSsoNote,
  formatDeadline,
  graceOptions,
  isValidDomain,
  type MfaLevel,
  meetsMfaLevel,
  normalizeDomain,
  suggestedDomains,
} from "./identity";

export type AddDomainDialogProps = {
  organizationId: string;
  domains: ReadonlyArray<AllowedDomain>;
  emails: ReadonlyArray<{ email: string; verified: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (domain: AllowedDomain) => void;
};

export function AddDomainDialog({
  organizationId,
  domains,
  emails,
  open,
  onOpenChange,
  onAdded,
}: AddDomainDialogProps) {
  const add = useAtomSet(addAllowedDomainAtom, { mode: "promise" });
  const verify = useAtomSet(verifyAllowedDomainAtom, { mode: "promise" });
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<string>();
  const [adding, setAdding] = useState(false);
  const suggestions = suggestedDomains(emails, domains);
  const domain = normalizeDomain(value);
  const reactivityKeys = [identityKeys.domains(organizationId)];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidDomain(domain)) {
      setProblem("Enter a domain like example.com");
      return;
    }
    setAdding(true);
    setProblem(undefined);
    add({ params: { orgId: organizationId }, payload: { domain } })
      .then((created) => {
        const entry = decodeAllowedDomain(created);
        return entry.verification === "pending" && entry.dnsRecord === null
          ? verify({
              params: { orgId: organizationId, domainId: entry.id },
              reactivityKeys,
            }).then(decodeAllowedDomain)
          : entry;
      })
      .then((entry) => {
        setValue("");
        onOpenChange(false);
        onAdded(entry);
      })
      .catch((error) =>
        setProblem(errorMessage(error, "Could not add this domain")),
      )
      .finally(() => setAdding(false));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (adding) return;
        setProblem(undefined);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add domain</DialogTitle>
            <DialogDescription>
              Once the domain is verified with DNS, people with a verified email
              on it can join this organization
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            <label
              htmlFor="add-domain"
              className="flex flex-col gap-1.5 text-sm font-medium text-foreground"
            >
              Domain
              <Input
                id="add-domain"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setProblem(undefined);
                }}
                placeholder="example.com"
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </label>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-normal text-muted-foreground">
                Use a domain from your emails
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setValue(suggestion);
                      setProblem(undefined);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            <span className="text-xs font-normal text-muted-foreground">
              {`Next you add a TXT record at your DNS provider to prove you own ${domain === "" ? "the domain" : domain}, and nobody can join with it until then`}
            </span>
            {problem !== undefined && (
              <span className="text-xs font-normal text-destructive">
                {problem}
              </span>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              disabled={adding}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <ActionButton
              intent="accent"
              type="submit"
              loading={adding}
              loadingLabel="Adding"
              disabled={domain === ""}
            >
              Continue
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type DomainDialogProps = {
  organizationId: string;
  entry: AllowedDomain | undefined;
  sso: DomainSso;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

export function DomainDialog({
  organizationId,
  entry,
  sso,
  onOpenChange,
  onChanged,
}: DomainDialogProps) {
  const verify = useAtomSet(verifyAllowedDomainAtom, { mode: "promise" });
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string>();
  const record = entry?.dnsRecord ?? null;
  const verified = entry?.verification === "dns";

  const check = () => {
    if (entry === undefined) return;
    setChecking(true);
    setProblem(undefined);
    verify({
      params: { orgId: organizationId, domainId: entry.id },
      reactivityKeys: [identityKeys.domains(organizationId)],
    })
      .then((result) => {
        const next = decodeAllowedDomain(result);
        onChanged();
        if (next.verification === "dns") {
          onOpenChange(false);
          toast.success(`${next.domain} verified`);
        }
      })
      .catch((error) =>
        setProblem(errorMessage(error, "Could not verify this domain")),
      )
      .finally(() => setChecking(false));
  };

  return (
    <Dialog
      open={entry !== undefined}
      onOpenChange={(next) => {
        if (checking) return;
        setProblem(undefined);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry?.domain ?? "domain"}</DialogTitle>
          {entry !== undefined && (
            <DialogDescription>
              {domainDialogDescription(entry)}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {record !== null && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground-2">
                DNS record
              </span>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                {(
                  [
                    ["Host", record.host],
                    ["Type", record.type],
                    ["Value", record.value],
                  ] as const
                ).map(([label, value]) => (
                  <Fragment key={label}>
                    <span className="w-12 text-xs font-normal text-muted-foreground-2">
                      {label}
                    </span>
                    <CopyValue value={value} label={label.toLowerCase()} />
                  </Fragment>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground-2">
              Single sign-on
            </span>
            <TokenList>
              <div className="flex min-h-14 items-center justify-between gap-4 py-2.5 pr-3 pl-3">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {sso.name ?? "Not connected"}
                  </span>
                  {entry !== undefined && (
                    <span className="text-xs font-normal text-muted-foreground-2">
                      {domainSsoNote(entry, sso)}
                    </span>
                  )}
                </span>
                {entry !== undefined && (
                  <SsoRequirementBadge entry={entry} sso={sso} />
                )}
              </div>
            </TokenList>
          </div>
          {problem !== undefined && (
            <span className="text-xs font-normal text-destructive">
              {problem}
            </span>
          )}
        </DialogBody>
        <DialogFooter>
          {verified ? (
            <Button intent="accent" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                disabled={checking}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <ActionButton
                intent="accent"
                loading={checking}
                loadingLabel="Checking"
                onClick={check}
              >
                {record === null ? "Get DNS record" : "Verify"}
              </ActionButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const graceItems = graceOptions as Record<string, string>;

export type RequireMfaDialogProps = {
  organizationName: string;
  members: ReadonlyArray<OrgMember>;
  apiKeys: ReadonlyArray<ApiKeySummary>;
  level: MfaLevel;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (graceDays: number) => void;
};

export function RequireMfaDialog({
  organizationName,
  members,
  apiKeys,
  level,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: RequireMfaDialogProps) {
  const [grace, setGrace] = useState("7");
  const now = Date.now();
  const missing = members.filter((member) => !meetsMfaLevel(member, level));
  const deadline = formatDeadline(deadlineFrom(now, Number(grace)));
  const keyCount = (member: OrgMember) =>
    apiKeys.filter(
      (key) =>
        key.principalKind === "human" &&
        key.principalUserId === member.userId &&
        key.revokedAt === null &&
        (key.expiresAt === null || key.expiresAt.getTime() > now),
    ).length;
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {level === "passkey"
              ? "Require passkeys?"
              : "Require two-step verification?"}
          </DialogTitle>
          <DialogDescription>
            {level === "passkey"
              ? `Nobody is signed out: members without a trusted passkey see a reminder until ${deadline}, then sign in with a passkey, and authenticator apps stop counting in ${organizationName}`
              : `Nobody is signed out: members without it see a reminder until ${deadline}, then set up a passkey or an authenticator app at their next sign-in`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-normal text-foreground">
              Deadline
            </span>
            <MenuSelect
              items={graceItems}
              value={grace}
              disabled={pending}
              onValueChange={(value) => value !== null && setGrace(value)}
            >
              <MenuSelectTrigger className="w-40">
                <MenuSelectValue />
              </MenuSelectTrigger>
              <MenuSelectContent>
                {Object.entries(graceOptions).map(([days, label]) => (
                  <MenuSelectItem key={days} value={days}>
                    {label}
                  </MenuSelectItem>
                ))}
              </MenuSelectContent>
            </MenuSelect>
          </div>
          {missing.length > 0 && (
            <>
              <p className="text-sm font-normal text-muted-foreground-1">
                {`${missing.length} of ${members.length} members ${level === "passkey" ? "don't have a trusted passkey" : "haven't set it up"}, and after ${deadline}, their API keys, Slack, Linear and paired devices pause in ${organizationName} until they do`}
              </p>
              <TokenList className="max-h-56 overflow-y-auto">
                {missing.map((member) => {
                  const keys = keyCount(member);
                  const name = member.name ?? member.userId;
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-2.5 py-1.5 pr-3 pl-3"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-muted-foreground-1"
                      >
                        {member.imageUrl === null ? (
                          name.slice(0, 1).toUpperCase()
                        ) : (
                          <img
                            src={member.imageUrl}
                            alt=""
                            className="size-full"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-normal text-foreground">
                        {name}
                      </span>
                      <span className="shrink-0 text-xs font-normal text-muted-foreground-2 tabular-nums">
                        {keys === 0
                          ? "No API keys"
                          : `${keys} API ${keys === 1 ? "key" : "keys"}`}
                      </span>
                    </div>
                  );
                })}
              </TokenList>
            </>
          )}
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
            loadingLabel="Saving"
            onClick={() => onConfirm(Number(grace))}
          >
            {level === "passkey" ? "Require passkeys" : "Require two-step"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ConnectGoogleWorkspaceDialogProps = {
  domains: ReadonlyArray<AllowedDomain>;
  domainId: string | undefined;
  open: boolean;
  pending: boolean;
  onDomainChange: (domainId: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: (domainId: string) => void;
};

export function ConnectGoogleWorkspaceDialog({
  domains,
  domainId,
  open,
  pending,
  onDomainChange,
  onOpenChange,
  onConfirm,
}: ConnectGoogleWorkspaceDialogProps) {
  const selected =
    domains.find((domain) => domain.id === domainId) ?? domains[0];
  const items = Object.fromEntries(
    domains.map((domain) => [domain.id, domain.domain]),
  );
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Google Workspace OAuth?</DialogTitle>
          <DialogDescription>
            {`Everyone with an address on ${selected?.domain ?? "the domain"}, in any organization, signs in to Capy with their work Google account from their next sign-in`}
          </DialogDescription>
        </DialogHeader>
        {domains.length > 1 && selected !== undefined && (
          <DialogBody className="flex items-center justify-between gap-3">
            <span className="text-sm font-normal text-foreground">Domain</span>
            <MenuSelect
              items={items}
              value={selected.id}
              disabled={pending}
              onValueChange={(value) => value !== null && onDomainChange(value)}
            >
              <MenuSelectTrigger className="w-48">
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
          </DialogBody>
        )}
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
            loadingLabel="Connecting"
            disabled={selected === undefined}
            onClick={() => selected !== undefined && onConfirm(selected.id)}
          >
            Connect
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
