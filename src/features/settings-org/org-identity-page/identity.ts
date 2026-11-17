import {
  type AllowedDomain,
  type EnterpriseConnection,
  enterpriseProviderLabels,
  identityProviderName,
  isSamlProvider,
  type OrgMember,
  type SsoConnection,
  type SsoStatus,
  ssoColumnName,
} from "@/features/settings-org/saml-sso";

export const adminOnlyReason = "Only organization admins can change this";

const freeEmailDomains = new Set(
  "gmail.com,googlemail.com,yahoo.com,yahoo.co.uk,yahoo.co.jp,ymail.com,rocketmail.com,outlook.com,hotmail.com,hotmail.co.uk,live.com,msn.com,icloud.com,me.com,mac.com,aol.com,protonmail.com,proton.me,pm.me,fastmail.com,fastmail.fm,tutanota.com,tutanota.de,tuta.io,zoho.com,yandex.com,yandex.ru,mail.com,mail.ru,gmx.com,gmx.de,gmx.net,qq.com,163.com,126.com,sina.com,sina.cn,naver.com,daum.net,hanmail.net,duck.com,duckduckgo.com,hey.com,yopmail.com,posteo.de,posteo.net,web.de,t-online.de,libero.it,virgilio.it,orange.fr,laposte.net,free.fr,wanadoo.fr,sfr.fr,comcast.net,verizon.net,sbcglobal.net,att.net,cox.net,earthlink.net,bigpond.com,telstra.com.au,shaw.ca,rogers.com,sympatico.ca".split(
    ",",
  ),
);

export const normalizeDomain = (value: string) => value.trim().toLowerCase();

export const emailDomain = (email: string | null | undefined) => {
  if (email === null || email === undefined) return undefined;
  const at = email.lastIndexOf("@");
  return at < 0 || at === email.length - 1
    ? undefined
    : normalizeDomain(email.slice(at + 1));
};

export const isValidDomain = (domain: string) =>
  domain.length <= 253 &&
  /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/.test(domain);

export const isFreeEmailDomain = (domain: string) =>
  freeEmailDomains.has(normalizeDomain(domain));

const isTestEmail = (email: string) => {
  const at = email.lastIndexOf("@");
  return (at < 0 ? email : email.slice(0, at))
    .toLowerCase()
    .includes("+clerk_test");
};

/** Work domains from the viewer's verified emails that aren't added yet. */
export const suggestedDomains = (
  emails: ReadonlyArray<{ email: string; verified: boolean }>,
  domains: ReadonlyArray<AllowedDomain>,
) => [
  ...new Set(
    emails.flatMap((entry) => {
      const domain =
        entry.verified && !isTestEmail(entry.email)
          ? emailDomain(entry.email)
          : undefined;
      return domain === undefined ||
        isFreeEmailDomain(domain) ||
        domains.some((existing) => existing.domain === domain)
        ? []
        : [domain];
    }),
  ),
];

/** Days Capy waits after a DNS record disappears before dropping verification. */
export const dnsGraceDays = 7;
const dnsGraceMs = dnsGraceDays * 24 * 60 * 60 * 1000;

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export const dnsExpiry = (missingSince: Date) =>
  monthDay.format(new Date(missingSince.getTime() + dnsGraceMs));

export type DomainSso = { name: string | undefined; state: string | undefined };

const connectionStateLabels: Record<
  SsoConnection["state"],
  string | undefined
> = {
  active: undefined,
  draft: "Draft",
  pending: "Connecting",
  off: "Off",
  suspended: "Paused",
  failed: "Not working",
};

/** What signs a domain in, for the domains table (Capy's domainSso). */
export const domainSso = (
  entry: AllowedDomain,
  status: SsoStatus | undefined,
): DomainSso => {
  const connection =
    status?.connection?.domainId === entry.id ? status.connection : null;
  const enterprise = status?.enterprise.find(
    (candidate) => candidate.domain === entry.domain,
  );
  if (connection !== null)
    return {
      name: ssoColumnName(connection.provider),
      state: connectionStateLabels[connection.state],
    };
  return {
    name:
      enterprise !== undefined
        ? enterpriseProviderLabels[enterprise.provider]
        : entry.sso === "google_workspace"
          ? "Google Workspace OAuth"
          : entry.sso === null
            ? undefined
            : "Single sign-on",
    state: undefined,
  };
};

/** The note under Single sign-on in a domain's dialog. */
export const domainSsoNote = (entry: AllowedDomain, sso: DomainSso) => {
  const verified = entry.verification === "dns";
  if (entry.ssoRequired)
    return `Members with @${entry.domain} emails can only sign in with ${sso.name ?? "single sign-on"}`;
  if (sso.name !== undefined && sso.state !== undefined)
    return `Manage ${sso.name} under Single sign-on below`;
  if (sso.name === undefined)
    return verified
      ? "Set up single sign-on below"
      : "Verify this domain with DNS to set up single sign-on";
  return `Members with @${entry.domain} emails can sign in with ${sso.name}, require it under Single sign-on below`;
};

/** The description of a domain's dialog (Capy's DomainDialog). */
export const domainDialogDescription = (entry: AllowedDomain) => {
  const verified = entry.verification === "dns";
  if (entry.dnsRecord === null)
    return "Verify with DNS to prove your organization owns this domain, limited to one organization per domain";
  if (verified && entry.dnsMissingSince !== null)
    return `The TXT record is missing, add it back at your DNS provider before ${dnsExpiry(entry.dnsMissingSince)} to keep verification`;
  if (verified)
    return `Verified with DNS, keep this TXT record since Capy checks it daily and removes verification after ${dnsGraceDays} days without it`;
  return `Add this TXT record at your DNS provider and keep it there, since Capy checks it daily after verifying and removes verification after ${dnsGraceDays} days without it`;
};

export type RequireSsoState = {
  checked: boolean;
  disabled: boolean;
  description: string;
  scope: string;
};

/** Capy's RequireSsoRow: null when there's nothing to require yet. */
export const requireSsoState = (
  status: SsoStatus | undefined,
  domains: ReadonlyArray<AllowedDomain>,
  superadmin: boolean,
): RequireSsoState | null => {
  const connection = status?.connection ?? null;
  const enterprise: EnterpriseConnection | undefined = status?.enterprise[0];
  const name =
    connection === null
      ? enterprise === undefined
        ? "single sign-on"
        : enterpriseProviderLabels[enterprise.provider]
      : identityProviderName(connection.provider);
  const ssoDomains = domains
    .filter((entry) => entry.sso !== null)
    .map((entry) => entry.domain);
  const checked = domains.some((entry) => entry.ssoRequired);
  const scope =
    ssoDomains.length > 0
      ? ssoDomains.join(", ")
      : (connection?.domain ?? enterprise?.domain ?? "your domains");
  if (connection === null && enterprise === undefined && !checked) return null;
  const blocker =
    connection === null
      ? ssoDomains.length === 0 && enterprise === undefined
        ? "Set up single sign-on first"
        : superadmin
          ? ssoDomains.length === 0
            ? `Sign in through ${name} once first`
            : undefined
          : `Contact us to require single sign-on for ${scope}`
      : connection.state === "draft"
        ? `Finish setting up ${name} first`
        : connection.state === "pending"
          ? `${name} is still connecting`
          : connection.state === "active"
            ? connection.testedAt === null &&
              (isSamlProvider(connection.provider) || !superadmin)
              ? `Sign in through ${name} once first`
              : !superadmin &&
                  domains.find((entry) => entry.id === connection.domainId)
                    ?.verification !== "dns"
                ? `Verify ${connection.domain} with DNS first`
                : undefined
            : `Turn ${name} on first`;
  return {
    checked,
    disabled: !checked && blocker !== undefined,
    description: checked
      ? `Members on ${scope} can only sign in through ${name}`
      : (blocker ?? `Members on ${scope} can still sign in another way`),
    scope,
  };
};

export type MfaLevel = "any" | "passkey";

/** Whether a member already meets the org's two-step level. */
export const meetsMfaLevel = (member: OrgMember, level: MfaLevel) =>
  member.enterpriseSso ||
  member.passkeyTrusted ||
  (level === "any" && member.mfaEnabled);

export const mfaLevelLabels: Record<MfaLevel, string> = {
  any: "Two-step",
  passkey: "Passkeys only",
};

export const graceOptions = {
  1: "In 1 day",
  7: "In 7 days",
  14: "In 14 days",
  30: "In 30 days",
} as const;

export const formatDeadline = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const deadlineFrom = (now: number, graceDays: number) =>
  new Date(now + graceDays * 24 * 60 * 60 * 1000);

/** Remaining grace days when switching level (Capy rounds up, never below 0). */
export const remainingGraceDays = (enforceAt: Date | null, now: number) =>
  enforceAt === null
    ? 0
    : Math.max(0, Math.ceil((enforceAt.getTime() - now) / 86400000));

export const mfaToastCopy = (required: boolean, level: MfaLevel) =>
  required
    ? level === "passkey"
      ? "Passkeys required"
      : "Two-step verification required"
    : "Two-step verification no longer required";
