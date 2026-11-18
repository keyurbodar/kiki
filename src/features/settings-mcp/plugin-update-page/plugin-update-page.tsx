import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { mcpKeys, pluginMutation } from "../model/atoms.ts";
import type { InstalledPluginDetail } from "../model/types.ts";
import {
  useActiveOrgId,
  usePluginInstallation,
} from "../model/use-mcp-data.ts";
import { SkillsSection, WarningsSection } from "../ui/plugin-sections.tsx";
import { PluginIcon, shortVersion } from "../ui/plugin-shared.tsx";

export interface PluginUpdatePageProps {
  readonly installationId: string;
}

function Message({ children }: { readonly children: string }) {
  return (
    <SettingsPage title="Plugin">
      <div className="flex items-center justify-center gap-2 p-8 text-sm font-normal text-muted-foreground-2">
        {children}
      </div>
    </SettingsPage>
  );
}

export function PluginUpdatePage({ installationId }: PluginUpdatePageProps) {
  const orgId = useActiveOrgId();
  if (orgId === undefined) return <Message>Loading plugin</Message>;
  return <UpdateForOrg orgId={orgId} installationId={installationId} />;
}

function UpdateForOrg({
  orgId,
  installationId,
}: PluginUpdatePageProps & { readonly orgId: OrgId }) {
  const result = usePluginInstallation(orgId, installationId);
  if (result.status !== "ready") return <Message>Loading plugin</Message>;
  if (result.value === null)
    return <Message>This plugin no longer exists</Message>;
  if (result.value.pending === null)
    return <Message>No update is waiting for review</Message>;
  return <UpdateReview orgId={orgId} detail={result.value} />;
}

function UpdateReview({
  orgId,
  detail,
}: {
  readonly orgId: OrgId;
  readonly detail: InstalledPluginDetail;
}) {
  const navigate = useNavigate();
  const plugin = detail.installation;
  const pending = detail.pending ?? detail.version;
  const rollback = detail.pendingIsRollback;
  const apply = useAtomSet(pluginMutation.updateInstallation, {
    mode: "promise",
  });
  const roll = useAtomSet(pluginMutation.rollbackInstallation, {
    mode: "promise",
  });
  const [applying, setApplying] = useState(false);
  const current = new Set(detail.version.skills.map((skill) => skill.name));
  const added = new Set(
    pending.skills
      .map((skill) => skill.name)
      .filter((name) => !current.has(name)),
  );
  const keys = [mcpKeys.plugins(orgId), mcpKeys.plugin(orgId, plugin.id)];
  const params = { orgId, installationId: plugin.id };

  const submit = () => {
    setApplying(true);
    (rollback
      ? roll({
          params,
          payload: { updatedAt: plugin.updatedAt },
          reactivityKeys: keys,
        })
      : apply({
          params,
          payload: { updatedAt: plugin.updatedAt, versionId: pending.id },
          reactivityKeys: keys,
        })
    )
      .then(() =>
        navigate({
          to: "/settings/mcp/plugins/$installationId",
          params: { installationId: plugin.id },
        }),
      )
      .catch(() => toast.error(`Could not update ${plugin.displayName}`))
      .finally(() => setApplying(false));
  };

  return (
    <SettingsPage
      title={`${rollback ? "Roll back" : "Update"} ${plugin.displayName} to ${pending.version}`}
      description={
        rollback
          ? "Review what returns before it applies"
          : "Review what this version adds before it applies"
      }
      iconTile="brand"
      icon={<PluginIcon name={plugin.displayName} size="base" />}
    >
      <SettingsSection
        title="Version"
        action={
          <Button
            intent="accent"
            size="sm"
            disabled={applying}
            onClick={submit}
          >
            {applying
              ? rollback
                ? "Rolling back"
                : "Updating"
              : rollback
                ? "Roll back"
                : "Update"}
          </Button>
        }
      >
        <Card rows>
          <SettingsRow
            label={shortVersion(pending.version) ?? pending.version}
            description={
              pending.notes ??
              (rollback
                ? `From ${plugin.version}, back to the version you ran before`
                : `From ${plugin.version}${pending.source === "github" ? " on GitHub" : " in the marketplace"}. Owner and project stay the same`)
            }
          >
            <Badge size="sm">{rollback ? "Rollback" : "Changelog"}</Badge>
          </SettingsRow>
          <SettingsRow
            label={shortVersion(plugin.version) ?? plugin.version}
            description={
              detail.version.notes ?? "No changelog note for this version"
            }
          >
            <Badge size="sm">Running</Badge>
          </SettingsRow>
        </Card>
      </SettingsSection>
      <WarningsSection warnings={pending.warnings} />
      <SkillsSection
        skills={pending.skills}
        added={added}
        mark={rollback ? "Returns" : "New"}
      />
    </SettingsPage>
  );
}
