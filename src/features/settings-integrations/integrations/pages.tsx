import { useNavigate } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";
import { useActiveOrgId } from "../shared";
import slackPreview1 from "./assets/slack-1.png";
import slackPreview2 from "./assets/slack-2.png";
import tailscalePreview1 from "./assets/tailscale-1.png";
import tailscalePreview2 from "./assets/tailscale-2.png";
import {
  LinearIcon,
  PaperIcon,
  RevylIcon,
  SlackIcon,
  TailscaleIcon,
} from "./brand-icons";
import { IntegrationIntro } from "./connect-state";
import { useStartOAuth } from "./oauth";
import { TailscaleSetup } from "./tailscale-setup";

export function SlackIntegrationPage() {
  const orgId = useActiveOrgId();
  const { opening, start } = useStartOAuth("slack");
  return (
    <SettingsPage
      title="Slack"
      description="Start threads from Slack messages and reply in thread"
      icon={<SlackIcon />}
      iconTile="brand"
    >
      <IntegrationIntro
        provider="slack"
        icon={<SlackIcon />}
        previews={[slackPreview1, slackPreview2]}
        overview="Mention @Capy in a channel to start a thread from that message, replies come back in the Slack thread, and pull request cards and status post as the work lands"
        label="Connect Slack"
        loading={opening}
        disabled={orgId === undefined}
        onClick={() => orgId && start(orgId)}
      />
    </SettingsPage>
  );
}

export function LinearIntegrationPage() {
  const orgId = useActiveOrgId();
  const { opening, start } = useStartOAuth("linear");
  return (
    <SettingsPage
      title="Linear"
      description="Delegate issues to Capy from Linear"
      icon={<LinearIcon />}
      iconTile="brand"
    >
      <IntegrationIntro
        provider="linear"
        icon={<LinearIcon />}
        overview="Delegate an issue to Capy from Linear, it works the issue and reports back in the agent session"
        label="Connect Linear"
        loading={opening}
        disabled={orgId === undefined}
        onClick={() => orgId && start(orgId)}
      />
    </SettingsPage>
  );
}

export function PaperIntegrationPage() {
  const orgId = useActiveOrgId();
  const { opening, start } = useStartOAuth("paper");
  return (
    <SettingsPage
      title="Paper"
      description="Design files the agent can read and edit, shown live in the thread"
      icon={<PaperIcon />}
      iconTile="brand"
    >
      <IntegrationIntro
        provider="paper"
        icon={<PaperIcon />}
        overview="Connect your Paper account and Capy can open, read, and edit your design files, with the canvas shown live in the thread as it works"
        label="Connect Paper"
        loading={opening}
        disabled={orgId === undefined}
        onClick={() => orgId && start(orgId)}
      />
    </SettingsPage>
  );
}

export function RevylIntegrationPage() {
  const navigate = useNavigate();
  return (
    <SettingsPage
      title="Revyl"
      description="iOS and Android cloud devices for the agent"
      icon={<RevylIcon />}
      iconTile="brand"
    >
      <IntegrationIntro
        provider="revyl"
        icon={<RevylIcon />}
        overview="Mobile builds and devices come with Pro and above"
        label="View plans"
        onClick={() => navigate({ to: "/settings/org/billing" })}
      />
    </SettingsPage>
  );
}

export function TailscaleIntegrationPage() {
  return (
    <SettingsPage
      title="Tailscale"
      description="Give cloud machines access to private services on your tailnet"
      icon={<TailscaleIcon />}
      iconTile="brand"
    >
      <IntegrationIntro
        provider="tailscale"
        icon={<TailscaleIcon />}
        previews={[tailscalePreview1, tailscalePreview2]}
        overview="Add a Tailscale OAuth client and machines in the projects you choose join your tailnet at boot as tagged, ephemeral nodes, so the agent can reach private databases, APIs, and staging hosts"
        label="Connect Tailscale"
      />
      <TailscaleSetup />
    </SettingsPage>
  );
}
