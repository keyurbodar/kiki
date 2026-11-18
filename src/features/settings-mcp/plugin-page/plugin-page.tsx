import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { toast } from "@/primitives/toaster";
import { mcpKeys, pluginMutation } from "../model/atoms.ts";
import { orgWide } from "../model/draft.ts";
import { projectRef } from "../model/status.ts";
import { timeAgo } from "../model/time.ts";
import type {
  InstalledPluginDetail,
  PluginSyncResult,
} from "../model/types.ts";
import {
  useActiveOrgId,
  usePluginInstallation,
  useProjects,
} from "../model/use-mcp-data.ts";
import { ProjectMenu } from "../server-form/fields.tsx";
import { SkillsSection, WarningsSection } from "../ui/plugin-sections.tsx";
import {
  PluginIcon,
  pluginServerSummary,
  ServerIcon,
  StatusBadge,
  shortVersion,
  toolsFromServers,
} from "../ui/plugin-shared.tsx";

export interface PluginPageProps {
  readonly installationId: string;
}

export function PluginPage({ installationId }: PluginPageProps) {
  const orgId = useActiveOrgId();
  if (orgId === undefined)
    return (
      <SettingsPage title="Plugin">
        <PluginMessage>Loading plugin</PluginMessage>
      </SettingsPage>
    );
  return <PluginPageForOrg orgId={orgId} installationId={installationId} />;
}

function PluginMessage({ children }: { readonly children: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-sm font-normal text-muted-foreground-2">
      {children}
    </div>
  );
}

function PluginPageForOrg({
  orgId,
  installationId,
}: PluginPageProps & { readonly orgId: OrgId }) {
  const result = usePluginInstallation(orgId, installationId);
  if (result.status !== "ready")
    return (
      <SettingsPage title="Plugin">
        <PluginMessage>
          {result.status === "failed"
            ? "This plugin no longer exists"
            : "Loading plugin"}
        </PluginMessage>
      </SettingsPage>
    );
  if (result.value === null)
    return (
      <SettingsPage title="Plugin">
        <PluginMessage>This plugin no longer exists</PluginMessage>
      </SettingsPage>
    );
  return (
    <PluginDetail
      key={result.value.installation.updatedAt}
      orgId={orgId}
      detail={result.value}
    />
  );
}

function PluginDetail({
  orgId,
  detail,
}: {
  readonly orgId: OrgId;
  readonly detail: InstalledPluginDetail;
}) {
  const navigate = useNavigate();
  const projects = useProjects(orgId) ?? [];
  const plugin = detail.installation;
  const params = { orgId, installationId: plugin.id };
  const keys = [mcpKeys.plugins(orgId), mcpKeys.plugin(orgId, plugin.id)];
  const patch = useAtomSet(pluginMutation.patchInstallation, {
    mode: "promise",
  });
  const sync = useAtomSet(pluginMutation.syncInstallation, { mode: "promise" });
  const remove = useAtomSet(pluginMutation.removeInstallation, {
    mode: "promise",
  });
  const [syncing, setSyncing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const status = plugin.updateNeedsYou ? "Update needs you" : plugin.status;
  const project = projectRef(plugin.projectId, projects, undefined);
  const statusDescription = detail.removedFromMarketplace
    ? `Removed from the marketplace. Running ${plugin.version}`
    : plugin.source === "marketplace"
      ? `${plugin.version} from the marketplace, added ${timeAgo(plugin.createdAt)}`
      : `${shortVersion(plugin.version) ?? "Synced"} from GitHub ${timeAgo(detail.version.createdAt)}`;
  const toolCount = detail.servers.reduce(
    (total, server) => total + (server.toolCount ?? 0),
    0,
  );

  const update = (payload: Record<string, unknown>, verb: string) =>
    patch({
      params,
      payload: { ...payload, updatedAt: plugin.updatedAt },
      reactivityKeys: keys,
    }).catch(() => toast.error(`Could not ${verb} ${plugin.displayName}`));

  const runSync = () => {
    setSyncing(true);
    sync({ params, reactivityKeys: keys })
      .then((value) => {
        const outcome = (value as PluginSyncResult).outcome;
        if (outcome === "unchanged")
          toast.success(`${plugin.displayName} is up to date`);
        else if (outcome === "applied")
          toast.success(
            `${plugin.displayName} updated to ${(value as PluginSyncResult).plugin.installation.version}`,
          );
        else
          toast(`${plugin.displayName} has an update that needs your review`);
      })
      .catch(() => toast.error(`Could not sync ${plugin.displayName}`))
      .finally(() => setSyncing(false));
  };

  return (
    <SettingsPage
      title={plugin.displayName}
      description={plugin.description}
      iconTile="brand"
      icon={<PluginIcon name={plugin.displayName} size="base" />}
    >
      <SettingsSection>
        <Card rows>
          <SettingsRow
            label="Enabled"
            description={
              plugin.enabled
                ? "Available to the model"
                : "Hidden from the model until you turn it on"
            }
          >
            <Switch
              aria-label={`${plugin.enabled ? "Disable" : "Enable"} ${plugin.displayName}`}
              checked={plugin.enabled}
              onCheckedChange={(enabled) =>
                void update({ enabled }, enabled ? "enable" : "disable")
              }
            />
          </SettingsRow>
          <SettingsRow
            label="Status"
            description={statusDescription}
            className="max-sm:flex-col max-sm:items-start"
          >
            {project?.state === "deleted" ? (
              <Badge color="danger">Project deleted</Badge>
            ) : (
              <StatusBadge
                status={plugin.enabled ? (status ?? "Not checked") : "Disabled"}
              />
            )}
            {detail.pending !== null && (
              <Button
                variant="soft"
                size="sm"
                onClick={() =>
                  void navigate({
                    to: "/settings/mcp/plugins/$installationId/update",
                    params: { installationId: plugin.id },
                  })
                }
              >
                Review
              </Button>
            )}
            {plugin.source === "github" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={syncing}
                onClick={runSync}
              >
                {syncing ? "Syncing" : "Sync"}
              </Button>
            )}
            <Menu>
              <MenuTrigger
                aria-label="Plugin actions"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Icon name="bubble-dots" />
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  intent="danger"
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove
                </MenuItem>
              </MenuContent>
            </Menu>
          </SettingsRow>
        </Card>
        <Card rows>
          <SettingsRow
            label="Owner"
            description={
              plugin.owner === "me"
                ? "Visible only to you"
                : "Every member can see and use it"
            }
          >
            <span className="text-sm font-normal text-muted-foreground-1">
              {plugin.owner === "me" ? "Only me" : "Organization"}
            </span>
          </SettingsRow>
          <SettingsRow
            label="Project"
            description="Available in every project, or only in one"
          >
            <ProjectMenu
              value={plugin.projectId ?? orgWide}
              projects={projects}
              onChange={(projectId) =>
                void update(
                  { projectId: projectId === orgWide ? null : projectId },
                  "move",
                )
              }
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      <WarningsSection warnings={detail.version.warnings} />
      {detail.servers.length > 0 && (
        <SettingsSection
          title="Tools"
          description={toolsFromServers(detail.servers.length, toolCount)}
        >
          <Card rows>
            {detail.servers.map((server) => (
              <SettingsRowLink
                key={server.serverId}
                to="/settings/mcp/$serverId"
                params={{ serverId: server.ownServerId ?? server.serverId }}
                icon={<ServerIcon iconUrl={null} />}
                label={server.displayName}
                description={pluginServerSummary(server, "view", plugin.owner)}
                chevron="wide"
              >
                <StatusBadge status={server.status} />
              </SettingsRowLink>
            ))}
          </Card>
        </SettingsSection>
      )}
      <SkillsSection skills={detail.version.skills} />
      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Remove {plugin.displayName}?</DialogTitle>
          <DialogDescription>
            Its servers, their connections, and every member's keys are removed
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button
              intent="danger"
              onClick={() =>
                void remove({ params, reactivityKeys: keys })
                  .then(() => {
                    toast.success(`${plugin.displayName} removed`);
                    return navigate({ to: "/settings/mcp" });
                  })
                  .catch(() =>
                    toast.error(`Could not remove ${plugin.displayName}`),
                  )
              }
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsPage>
  );
}
