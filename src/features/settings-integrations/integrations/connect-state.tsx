import type { ReactNode } from "react";
import { SettingsSection } from "@/components/settings-page";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";

export type IntegrationProvider =
  | "slack"
  | "linear"
  | "github"
  | "tailscale"
  | "paper"
  | "revyl";

const guideLabels: Record<IntegrationProvider, string | null> = {
  slack: "Slack guide",
  linear: "Linear guide",
  github: "GitHub guide",
  tailscale: "Tailscale guide",
  paper: null,
  revyl: null,
};

export const integrationDocsUrl = (provider: IntegrationProvider) =>
  `https://docs.capy.ai/integrations/${provider}`;

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-normal text-muted-foreground-2">{label}</dt>
      <dd className="flex h-5 items-center text-sm text-muted-foreground-1">
        {children}
      </dd>
    </div>
  );
}

export function IntegrationMetaStrip({
  provider,
  connectedOn,
  action,
}: {
  provider: IntegrationProvider;
  connectedOn?: ReactNode;
  action?: ReactNode;
}) {
  const guide = guideLabels[provider];
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        {connectedOn !== undefined && (
          <MetaItem label="Connected on">{connectedOn}</MetaItem>
        )}
        {guide !== null && (
          <MetaItem label="Docs">
            <Button
              variant="bare"
              size="auto-sm"
              render={
                // biome-ignore lint/a11y/useAnchorContent: Button renders the children into the anchor
                <a
                  href={integrationDocsUrl(provider)}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Icon name="book" className="size-4" />
              {guide}
            </Button>
          </MetaItem>
        )}
      </dl>
      {action}
    </div>
  );
}

export function IntegrationConnectedStrip({
  provider,
  connectedOn,
}: {
  provider: IntegrationProvider;
  connectedOn?: ReactNode;
}) {
  return (
    <SettingsSection>
      <Card className="p-4">
        <IntegrationMetaStrip
          provider={provider}
          connectedOn={connectedOn}
          action={
            guideLabels[provider] === null ? null : (
              <Button
                variant="ghost"
                size="base"
                render={
                  // biome-ignore lint/a11y/useAnchorContent: Button renders the children into the anchor
                  <a
                    href={integrationDocsUrl(provider)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                About integration
              </Button>
            )
          }
        />
      </Card>
    </SettingsSection>
  );
}

export type IntegrationIntroProps = {
  provider: IntegrationProvider;
  icon: ReactNode;
  previews?: ReadonlyArray<string>;
  overview: ReactNode;
  label?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  action?: ReactNode;
  children?: ReactNode;
};

export function IntegrationIntro({
  provider,
  icon,
  previews = [],
  overview,
  label,
  loading = false,
  disabled = false,
  title,
  onClick,
  action,
  children,
}: IntegrationIntroProps) {
  return (
    <SettingsSection>
      <Card rows>
        <div className="flex flex-col gap-6 p-6">
          <IntegrationMetaStrip
            provider={provider}
            action={
              action ?? (
                <Button
                  variant="solid"
                  intent="accent"
                  size="base"
                  aria-busy={loading || undefined}
                  disabled={disabled || loading}
                  title={title}
                  onClick={onClick}
                >
                  {label}
                </Button>
              )
            }
          />
          {previews.length === 0 ? (
            <div className="grid h-28 place-items-center rounded-md bg-secondary [&_svg]:size-8">
              {icon}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {previews.map((src) => (
                <div
                  key={src}
                  className="grid place-items-center overflow-hidden rounded-md bg-secondary p-4"
                >
                  <img src={src} alt="" className="w-full rounded-sm" />
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-medium text-foreground">Overview</h2>
            <p className="text-sm font-normal text-muted-foreground-1">
              {overview}
            </p>
            {guideLabels[provider] !== null && (
              <Button
                variant="bare"
                size="auto-sm"
                className="self-start"
                render={
                  // biome-ignore lint/a11y/useAnchorContent: Button renders the children into the anchor
                  <a
                    href={integrationDocsUrl(provider)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Read more
              </Button>
            )}
          </div>
        </div>
        {children}
      </Card>
    </SettingsSection>
  );
}
