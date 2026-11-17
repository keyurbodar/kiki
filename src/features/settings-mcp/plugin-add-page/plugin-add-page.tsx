import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsPage, SettingsSection } from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";
import { mcpKeys, pluginMutation } from "../model/atoms.ts";
import { orgWide } from "../model/draft.ts";
import type {
  InstalledPluginDetail,
  PluginOwner,
  PluginVersion,
} from "../model/types.ts";
import {
  useActiveOrgId,
  useMarketplace,
  usePluginVersion,
  useProjects,
} from "../model/use-mcp-data.ts";
import { ProjectMenu, SelectField } from "../server-form/fields.tsx";
import {
  SecretFields,
  SkillsSection,
  WarningsSection,
} from "../ui/plugin-sections.tsx";
import {
  makerLine,
  PluginIcon,
  pluginServerSummary,
  ServerIcon,
} from "../ui/plugin-shared.tsx";

export type PluginAddPageProps =
  | { readonly versionId: string; readonly sourceRef?: string }
  | { readonly name: string };

function Message({ children }: { readonly children: string }) {
  return (
    <SettingsPage title="Add plugin">
      <div className="flex items-center justify-center gap-2 p-8 text-sm font-normal text-muted-foreground-2">
        {children}
      </div>
    </SettingsPage>
  );
}

export function PluginAddPage(props: PluginAddPageProps) {
  const orgId = useActiveOrgId();
  if (orgId === undefined) return <Message>Loading plugin</Message>;
  return "name" in props ? (
    <AddByName orgId={orgId} name={props.name} />
  ) : (
    <AddByVersion
      orgId={orgId}
      versionId={props.versionId}
      sourceRef={props.sourceRef}
    />
  );
}

function AddByName({
  orgId,
  name,
}: {
  readonly orgId: OrgId;
  readonly name: string;
}) {
  const marketplace = useMarketplace(orgId);
  if (marketplace === undefined) return <Message>Loading plugin</Message>;
  const listing = marketplace.find((plugin) => plugin.name === name);
  if (listing === undefined)
    return <Message>This plugin is not available</Message>;
  return <AddForm orgId={orgId} version={listing.version} />;
}

function AddByVersion({
  orgId,
  versionId,
  sourceRef,
}: {
  readonly orgId: OrgId;
  readonly versionId: string;
  readonly sourceRef?: string;
}) {
  const result = usePluginVersion(orgId, versionId);
  if (AsyncResult.isSuccess(result))
    return result.value === null ? (
      <Message>This plugin is not available</Message>
    ) : (
      <AddForm orgId={orgId} version={result.value} sourceRef={sourceRef} />
    );
  return (
    <Message>
      {AsyncResult.isFailure(result)
        ? "This plugin is not available"
        : "Loading plugin"}
    </Message>
  );
}

function AddForm({
  orgId,
  version,
  sourceRef,
}: {
  readonly orgId: OrgId;
  readonly version: PluginVersion;
  readonly sourceRef?: string;
}) {
  const navigate = useNavigate();
  const projects = useProjects(orgId) ?? [];
  const add = useAtomSet(pluginMutation.addInstallation, { mode: "promise" });
  const [owner, setOwner] = useState<PluginOwner>("organization");
  const [projectId, setProjectId] = useState(orgWide);
  const [secrets, setSecrets] = useState<
    Readonly<Record<string, Readonly<Record<string, string>>>>
  >({});
  const [adding, setAdding] = useState(false);

  const keyedServers = version.servers.filter(
    (server) =>
      Object.keys(server.secrets).length > 0 &&
      (owner === "me" || server.connection === "organization"),
  );
  const missingKey = keyedServers.some((server) =>
    Object.entries(server.secrets).some(
      ([name, secret]) =>
        secret.optional !== true &&
        (secrets[server.entry]?.[name] ?? "").trim() === "",
    ),
  );

  const submit = () => {
    setAdding(true);
    add({
      params: { orgId },
      payload: {
        versionId: version.id,
        owner,
        projectId: projectId === orgWide ? null : projectId,
        keys: secrets,
        sourceRef,
      },
      reactivityKeys: [mcpKeys.plugins(orgId), mcpKeys.servers(orgId)],
    })
      .then((value) =>
        navigate({
          to: "/settings/mcp/plugins/$installationId",
          params: {
            installationId: (value as InstalledPluginDetail).installation.id,
          },
        }),
      )
      .catch(() => toast.error(`Could not add ${version.displayName}`))
      .finally(() => setAdding(false));
  };

  return (
    <SettingsPage
      title={version.displayName}
      description={
        version.maker === undefined || version.maker === null
          ? version.description
          : `${makerLine(version.maker)} · ${version.description}`
      }
      iconTile="brand"
      icon={<PluginIcon name={version.displayName} size="base" />}
    >
      <SettingsSection
        title="Plugin"
        action={
          <Button
            intent="accent"
            size="sm"
            disabled={adding || missingKey}
            onClick={submit}
          >
            {adding ? "Adding" : `Add ${version.displayName}`}
          </Button>
        }
      >
        <Card rows>
          <SettingsRow
            label="Source"
            description={`github.com/${version.repository}${version.path === "" ? "" : `/${version.path}`}`}
          >
            <span className="text-sm font-normal text-muted-foreground-1">
              {version.version}
            </span>
          </SettingsRow>
          <SettingsRow
            label="Owner"
            description={
              owner === "me"
                ? "Visible only to you"
                : "Every member can see and use it"
            }
          >
            <SelectField
              label="Owner"
              value={owner}
              options={[
                { value: "organization", label: "Organization" },
                { value: "me", label: "Only me" },
              ]}
              onChange={setOwner}
            />
          </SettingsRow>
          <SettingsRow
            label="Project"
            description="Available in every project, or only in one"
          >
            <ProjectMenu
              value={projectId}
              projects={projects}
              onChange={setProjectId}
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      <WarningsSection warnings={version.warnings} />
      {keyedServers.length > 0 && (
        <SettingsSection
          title="Keys"
          description={`Stored for ${owner === "me" ? "you" : "the organization"} and used by the ${keyedServers.map((server) => server.displayName).join(", ")} server${keyedServers.length === 1 ? "" : "s"}. ${owner === "me" ? "Nobody else" : "Members"} can't read it back`}
        >
          {keyedServers.map((server) => (
            <Card key={server.entry} rows>
              <SecretFields
                secrets={server.secrets}
                values={secrets[server.entry] ?? {}}
                onChange={(values) =>
                  setSecrets({ ...secrets, [server.entry]: values })
                }
              />
            </Card>
          ))}
        </SettingsSection>
      )}
      {version.servers.length > 0 && (
        <SettingsSection title="Tools">
          <Card rows>
            {version.servers.map((server) => (
              <SettingsRow
                key={server.entry}
                icon={<ServerIcon iconUrl={null} />}
                label={server.displayName}
                description={pluginServerSummary(server, "add", owner)}
              />
            ))}
          </Card>
        </SettingsSection>
      )}
      <SkillsSection skills={version.skills} />
    </SettingsPage>
  );
}
