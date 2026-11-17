import type { ReactNode } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  githubInstallationAtom,
  githubUserAtom,
  linearConnectionAtom,
  mobileConnectionAtom,
  paperStatusAtom,
  slackConnectionAtom,
  tailscaleConnectionAtom,
} from "@/data/atoms/integrations";
import { Badge } from "@/primitives/badge";
import { Card } from "@/primitives/card";
import {
  SettingsPage,
  SettingsRowLink,
  SettingsSection,
  useActiveOrgId,
  useResultValue,
} from "../shared";
import {
  GitHubIcon,
  LinearIcon,
  LockIcon,
  PaperIcon,
  RevylIcon,
  SlackIcon,
  TailscaleIcon,
} from "./brand-icons";
import {
  activeStatus,
  type ConnectStatus,
  githubStatus,
  paperStatus,
  type RevylConnection,
  type RevylStatus,
  revylStatus,
  slackStatus,
} from "./status";

const statusBadges: Record<ConnectStatus, ReactNode> = {
  connected: <Badge color="success">Connected</Badge>,
  disconnecting: <Badge color="warning">Disconnecting</Badge>,
  reconnect: <Badge color="warning">Reconnect needed</Badge>,
  update: <Badge color="warning">Update needed</Badge>,
};

const statusBadge = (status: ConnectStatus | null | undefined) =>
  status == null ? null : statusBadges[status];

const revylBadges: Partial<Record<RevylStatus, ReactNode>> = {
  not_configured: null,
  off_plan: (
    <Badge color="neutral" size="sm">
      <LockIcon />
      Pro
    </Badge>
  ),
  off: <Badge color="neutral">Off</Badge>,
  not_connected: <Badge color="neutral">On</Badge>,
  connecting: <Badge color="warning">Setting up</Badge>,
  awaiting_approval: <Badge color="warning">Waiting for approval</Badge>,
  declined: <Badge color="danger">Declined</Badge>,
  expired: <Badge color="neutral">Approval expired</Badge>,
  connected: <Badge color="success">Connected</Badge>,
  not_admitted: <Badge color="neutral">Not available yet</Badge>,
  needs_support: <Badge color="warning">Needs support</Badge>,
};

export function IntegrationsPage() {
  const orgId = useActiveOrgId();
  return (
    <SettingsPage
      title="Integrations"
      description="Connected accounts and workspaces"
    >
      <SettingsSection>
        {orgId === undefined ? (
          <IntegrationRows />
        ) : (
          <OrgIntegrationRows orgId={orgId} />
        )}
      </SettingsSection>
    </SettingsPage>
  );
}

function OrgIntegrationRows({ orgId }: { orgId: OrgId }) {
  const githubUser = useResultValue(githubUserAtom);
  const installation = useResultValue(githubInstallationAtom(orgId));
  const slack = useResultValue(slackConnectionAtom(orgId));
  const linear = useResultValue(linearConnectionAtom(orgId));
  const tailscale = useResultValue(tailscaleConnectionAtom(orgId));
  const paper = useResultValue(paperStatusAtom);
  const mobile = useResultValue(mobileConnectionAtom(orgId));
  return (
    <IntegrationRows
      github={githubStatus(githubUser, installation)}
      slack={slack === undefined ? undefined : slackStatus(slack)}
      linear={activeStatus(linear)}
      paperConfigured={paper?.configured === true}
      paper={paperStatus(paper)}
      revyl={
        mobile === undefined
          ? undefined
          : revylStatus(mobile as RevylConnection)
      }
      tailscale={activeStatus(tailscale)}
    />
  );
}

type IntegrationRowsProps = {
  github?: ConnectStatus | null;
  slack?: ConnectStatus | null;
  linear?: ConnectStatus | null;
  paperConfigured?: boolean;
  paper?: ConnectStatus | null;
  revyl?: RevylStatus;
  tailscale?: ConnectStatus | null;
};

function IntegrationRows({
  github,
  slack,
  linear,
  paperConfigured,
  paper,
  revyl,
  tailscale,
}: IntegrationRowsProps) {
  return (
    <Card rows>
      <SettingsRowLink
        to="/settings/integrations/github"
        id="github"
        label="GitHub"
        icon={<GitHubIcon />}
        iconTile="brand"
        description="Repositories, pull requests, and your account"
      >
        {statusBadge(github)}
      </SettingsRowLink>
      <SettingsRowLink
        to="/settings/integrations/slack"
        id="slack"
        label="Slack"
        icon={<SlackIcon />}
        iconTile="brand"
        description="Start threads from Slack messages and reply in thread"
      >
        {slack === null ? (
          <Badge color="neutral">Not connected</Badge>
        ) : (
          statusBadge(slack)
        )}
      </SettingsRowLink>
      <SettingsRowLink
        to="/settings/integrations/linear"
        id="linear"
        label="Linear"
        icon={<LinearIcon />}
        iconTile="brand"
        description="Delegate issues to Capy from Linear"
      >
        {statusBadge(linear)}
      </SettingsRowLink>
      {paperConfigured && (
        <SettingsRowLink
          to="/settings/integrations/paper"
          id="paper"
          label="Paper"
          icon={<PaperIcon />}
          iconTile="brand"
          description="Design files the agent can read and edit, shown live in the thread"
        >
          {statusBadge(paper)}
        </SettingsRowLink>
      )}
      <SettingsRowLink
        to="/settings/integrations/revyl"
        id="revyl"
        label="Revyl"
        icon={<RevylIcon />}
        iconTile="brand"
        description="iOS and Android cloud devices for the agent"
      >
        {revyl === undefined ? null : revylBadges[revyl]}
      </SettingsRowLink>
      <SettingsRowLink
        to="/settings/integrations/tailscale"
        id="tailscale"
        label="Tailscale"
        icon={<TailscaleIcon />}
        iconTile="brand"
        description="Reach private services from machines on your tailnet"
      >
        {statusBadge(tailscale)}
      </SettingsRowLink>
    </Card>
  );
}
