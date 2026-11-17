import type { ReactNode } from "react";
import { SettingsSection } from "@/components/settings-page";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { integrationDocsUrl } from "./connect-state";

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="link"
      size="auto-sm"
      className="mt-2"
      render={
        // biome-ignore lint/a11y/useAnchorContent: Button renders the children into the anchor
        <a href={href} target="_blank" rel="noopener noreferrer" />
      }
    >
      {children}
    </Button>
  );
}

function Step({
  title,
  children,
  link,
}: {
  title: string;
  children: ReactNode;
  link?: ReactNode;
}) {
  return (
    <li className="pl-1">
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-1">{children}</p>
      {link}
    </li>
  );
}

export function TailscaleSetup() {
  return (
    <SettingsSection
      title="Setup"
      action={
        <Button
          variant="link"
          size="auto-sm"
          render={
            // biome-ignore lint/a11y/useAnchorContent: Button renders the children into the anchor
            <a
              href={integrationDocsUrl("tailscale")}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          Full guide
        </Button>
      }
    >
      <Card className="p-4">
        <ol className="flex list-decimal flex-col gap-4 pl-5 text-sm text-muted-foreground-1 marker:text-muted-foreground-2">
          <Step
            title="Create a tag"
            link={
              <ExternalLink href="https://tailscale.com/docs/features/tags">
                Tag docs
              </ExternalLink>
            }
          >
            Add <code>tag:capy</code> to <code>tagOwners</code> in your tailnet
            policy, then grant it access to the services machines need
          </Step>
          <Step
            title="Create an OAuth client"
            link={
              <ExternalLink href="https://login.tailscale.com/admin/settings/trust-credentials">
                Open Trust credentials
              </ExternalLink>
            }
          >
            In Trust credentials, generate an OAuth client with Auth Keys write
            access on your tag, the secret is shown once
          </Step>
          <Step title="Connect">Enter the client ID, secret and tag above</Step>
          <Step title="Enable projects">
            Turn on each project that needs tailnet access, its machines join at
            boot, enable MagicDNS from the project menu to resolve tailnet
            hostnames
          </Step>
        </ol>
      </Card>
    </SettingsSection>
  );
}
