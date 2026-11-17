import { cx } from "class-variance-authority";
import type { AllowedDomain } from "@/features/settings-org/saml-sso";
import { Badge } from "@/primitives/badge";
import { Icon } from "@/primitives/icon";
import { type DomainSso, dnsExpiry } from "./identity";

export function VerificationBadge({ entry }: { entry: AllowedDomain }) {
  if (entry.verification === "pending")
    return (
      <Badge size="sm">
        <Icon name="clock" />
        Waiting for DNS
      </Badge>
    );
  if (entry.verification === "dns" && entry.dnsMissingSince !== null)
    return (
      <Badge size="sm" color="warning">
        Expires {dnsExpiry(entry.dnsMissingSince)}
      </Badge>
    );
  if (entry.verification === "dns")
    return (
      <Badge size="sm" color="success">
        Verified
      </Badge>
    );
  return (
    <Badge size="sm">
      <Icon name="circle-dashed" />
      Unverified
    </Badge>
  );
}

export function SsoRequirementBadge({
  entry,
  sso,
}: {
  entry: AllowedDomain;
  sso: DomainSso;
}) {
  if (entry.ssoRequired)
    return (
      <Badge size="sm" color={sso.name === undefined ? "warning" : "success"}>
        <Icon name="shield-check" />
        Required
      </Badge>
    );
  return sso.state === undefined ? null : <Badge size="sm">{sso.state}</Badge>;
}

export function SsoCell({
  entry,
  sso,
}: {
  entry: AllowedDomain;
  sso: DomainSso;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cx(
          "truncate text-sm",
          sso.name === undefined && "text-muted-foreground-2",
        )}
      >
        {sso.name ??
          (entry.verification === "dns" ? "Not connected" : "Verify first")}
      </span>
      <SsoRequirementBadge entry={entry} sso={sso} />
    </span>
  );
}
