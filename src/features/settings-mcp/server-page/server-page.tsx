import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import type { OrgId } from "@/data/api/schemas/ids.ts";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogTitle,
} from "@/primitives/dialog";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { SettingsRow } from "@/primitives/settings-row";
import { Switch } from "@/primitives/switch";
import { mcpKeys, mcpMutation, mcpServersAtom } from "../model/atoms.ts";
import {
  draftFromServer,
  emptyKeyValue,
  type KeyValueRow,
  orgWide,
  parseKeyValues,
  type ServerDraft,
  serverKeyPattern,
  updateRequest,
  validateDraft,
} from "../model/draft.ts";
import { listPath } from "../model/mount.ts";
import { serverStatusParts } from "../model/status.ts";
import { timeAgo } from "../model/time.ts";
import type { McpDiagnosis, McpMount, McpServer } from "../model/types.ts";
import {
  useActiveOrgId,
  useProjects,
  useServerTools,
} from "../model/use-mcp-data.ts";
import {
  AuthenticationSection,
  KeyValueRows,
  ProjectMenu,
  RuntimeSection,
} from "../server-form/fields.tsx";
import { ServerIcon, StatusBadge } from "../ui/plugin-shared.tsx";

export interface ServerPageProps {
  readonly mount: McpMount;
  readonly serverId: string;
}

const stageLabel: Record<string, string> = {
  connect: "Connect",
  auth: "Authenticate",
  permissions: "Permissions",
  protocol: "Negotiate",
  list: "List tools",
};

const collapsibleTrigger =
  "group/collapsible flex w-fit cursor-pointer select-none items-center gap-1.5 rounded text-left text-base font-medium text-foreground outline-none focus-visible:outline-ring-inset";

export function ServerPage({ mount, serverId }: ServerPageProps) {
  const orgId = useActiveOrgId();
  if (orgId === undefined)
    return (
      <SettingsPage title="MCP server">
        <SettingsLoadingCard />
      </SettingsPage>
    );
  return <ServerPageForOrg mount={mount} serverId={serverId} orgId={orgId} />;
}

function ServerPageForOrg({
  mount,
  serverId,
  orgId,
}: ServerPageProps & { readonly orgId: OrgId }) {
  const result = useAtomValue(mcpServersAtom(orgId));
  if (!AsyncResult.isSuccess(result))
    return (
      <SettingsPage title="MCP server">
        <div className="flex items-center justify-center gap-2 p-8 text-sm font-normal text-muted-foreground-2">
          Loading server
        </div>
      </SettingsPage>
    );
  const servers = result.value as ReadonlyArray<McpServer>;
  const server = servers.find((entry) => entry.id === serverId);
  if (server === undefined)
    return (
      <SettingsPage title="MCP server">
        <p className="text-sm font-normal text-muted-foreground-2">
          This server no longer exists
        </p>
      </SettingsPage>
    );
  return (
    <ServerDetail key={server.updatedAt} mount={mount} orgId={orgId} server={server} />
  );
}

function ServerDetail({
  mount,
  orgId,
  server,
}: {
  readonly mount: McpMount;
  readonly orgId: OrgId;
  readonly server: McpServer;
}) {
  const navigate = useNavigate();
  const projects = useProjects(orgId) ?? [];
  const tools = useServerTools(orgId, server.id);
  const keys = [mcpKeys.servers(orgId), mcpKeys.server(orgId, server.id)];
  const params = { orgId, serverId: server.id };
  const update = useAtomSet(mcpMutation.updateServer, { mode: "promise" });
  const enable = useAtomSet(mcpMutation.enableServer, { mode: "promise" });
  const disable = useAtomSet(mcpMutation.disableServer, { mode: "promise" });
  const refresh = useAtomSet(mcpMutation.refreshServer, { mode: "promise" });
  const test = useAtomSet(mcpMutation.testServer, { mode: "promise" });
  const remove = useAtomSet(mcpMutation.deleteServer, { mode: "promise" });

  const [name, setName] = useState(server.displayName);
  const [serverKey, setServerKey] = useState(server.serverKey);
  const [draft, setDraft] = useState<ServerDraft>(() => draftFromServer(server));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastTest, setLastTest] = useState<McpDiagnosis | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toolFilter, setToolFilter] = useState("");
  const [variables, setVariables] = useState<
    ReadonlyArray<KeyValueRow> | undefined
  >(undefined);

  const status = serverStatusParts(server);
  const validation = validateDraft({ ...draft, serverKey });
  const organization = server.owner.kind === "organization";

  const patch = (payload: Record<string, unknown>, success?: string, failure?: string) =>
    update({
      params,
      payload: { ...payload, expectedUpdatedAt: server.updatedAt },
      reactivityKeys: keys,
    })
      .then(() => {
        if (success !== undefined) toast.success(success);
      })
      .catch(() => toast.error(failure ?? "Could not save the server"));

  const saveConfiguration = () => {
    if (!validation.valid) return;
    setSaving(true);
    patch(updateRequest(draft, validation), "Server updated").finally(() => {
      setSaving(false);
      setDirty(false);
    });
  };

  const toggleEnabled = (enabled: boolean) =>
    (enabled ? enable : disable)({ params, reactivityKeys: keys }).catch(() =>
      toast.error(`Could not ${enabled ? "enable" : "disable"} the server`),
    );

  const runTest = () => {
    setTesting(true);
    test({ params, payload: {}, reactivityKeys: keys })
      .then((diagnosis) => setLastTest(diagnosis as McpDiagnosis))
      .catch(() => toast.error("Could not test the server"))
      .finally(() => setTesting(false));
  };

  const toolList = tools?.tools ?? [];
  const disabledTools = new Set(server.disabledTools ?? []);
  const toolsOn = toolList.filter((tool) => !disabledTools.has(tool.name)).length;
  const visibleTools = toolList.filter((tool) =>
    tool.name.toLowerCase().includes(toolFilter.trim().toLowerCase()),
  );
  const checkedAt =
    server.health.state === "ready" ||
    server.health.state === "empty" ||
    server.health.state === "error"
      ? server.health.checkedAt
      : undefined;
  const statusDescription = [
    server.toolCount === null ? undefined : `${server.toolCount} tools`,
    checkedAt === undefined ? "not checked yet" : `checked ${timeAgo(checkedAt)}`,
  ]
    .filter((part) => part !== undefined)
    .join(", ");
  const variableNames = Object.keys(
    server.command === null ? server.requestHeaders : server.env,
  );

  return (
    <SettingsPage
      title={server.displayName}
      icon={<ServerIcon iconUrl={server.iconUrl} />}
      headerFields={
        <>
          <Input
            variant="blank"
            aria-label="Server name"
            maxLength={255}
            className="h-(--h-control-base) px-0 text-xl font-medium"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              if (name.trim() !== "" && name !== server.displayName)
                void patch(
                  { displayName: name.trim() },
                  undefined,
                  "Could not save the server name",
                );
            }}
          />
          <p className="truncate text-sm font-normal text-muted-foreground-1">
            {server.url === null ? server.command : new URL(server.url).host}
          </p>
        </>
      }
    >
      <SettingsSection>
        <Card rows>
          <SettingsRow
            label="Enabled"
            description={
              server.enabled
                ? "Available to the model"
                : "Hidden from the model until you turn it on"
            }
          >
            <Switch
              aria-label={`${server.enabled ? "Disable" : "Enable"} ${server.displayName}`}
              checked={server.enabled}
              onCheckedChange={(checked) => void toggleEnabled(checked)}
            />
          </SettingsRow>
          <SettingsRow
            label="Status"
            description={statusDescription}
            className="max-sm:flex-col max-sm:items-start"
          >
            <StatusBadge status={status.label} />
            <Button variant="ghost" size="sm" disabled={testing} onClick={runTest}>
              <Icon name="heart-beat" />
              {testing ? "Testing" : "Test"}
            </Button>
            <Menu>
              <MenuTrigger
                aria-label="Server actions"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Icon name="bubble-dots" />
              </MenuTrigger>
              <MenuContent align="end">
                <MenuItem
                  onClick={() =>
                    void refresh({ params, reactivityKeys: keys }).catch(() =>
                      toast.error("Could not refresh the server"),
                    )
                  }
                >
                  Refresh
                </MenuItem>
                <MenuItem intent="danger" onClick={() => setConfirmDelete(true)}>
                  Delete server
                </MenuItem>
              </MenuContent>
            </Menu>
          </SettingsRow>
          {lastTest !== undefined && (
            <SettingsRow
              label="Last test"
              description={
                lastTest.failure === null
                  ? `Passed ${lastTest.passed.map((stage) => stageLabel[stage]).join(", ")}`
                  : `Failed at ${stageLabel[lastTest.failure.stage]}: ${lastTest.failure.detail}`
              }
            >
              <span className="text-sm font-normal text-muted-foreground-1">
                {lastTest.version === null
                  ? "No version negotiated"
                  : `MCP ${lastTest.version}${lastTest.toolCount === null ? "" : ` with ${lastTest.toolCount} tools`}`}
              </span>
            </SettingsRow>
          )}
        </Card>
        <Card rows>
          <SettingsRow
            label="Owner"
            description={
              organization
                ? "Every member can see and use it"
                : "Visible only to you; members who message your threads can use it"
            }
          >
            <span className="text-sm font-normal text-muted-foreground-1">
              {organization ? "Organization" : "Only you"}
            </span>
          </SettingsRow>
          {mount.kind !== "project" && (
            <SettingsRow
              label="Project"
              description="Available in every project, or only in one"
            >
              <ProjectMenu
                value={server.projectId ?? orgWide}
                projects={projects}
                onChange={(projectId) =>
                  void patch({ projectId: projectId === orgWide ? null : projectId })
                }
              />
            </SettingsRow>
          )}
          <SettingsRow
            label="Key"
            description="The prefix on every tool name the model sees"
          >
            <Input
              aria-label="Server key"
              aria-invalid={!serverKeyPattern.test(serverKey)}
              className="w-44"
              value={serverKey}
              onChange={(event) => setServerKey(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") setServerKey(server.serverKey);
              }}
              onBlur={() => {
                if (
                  serverKey !== server.serverKey &&
                  serverKeyPattern.test(serverKey)
                )
                  void patch({ serverKey }, "Server key renamed");
              }}
            />
          </SettingsRow>
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Variables"
        description={
          server.command === null
            ? "Sent as request headers on every call to the endpoint; saving replaces the whole set"
            : "Passed to the process as environment variables when it launches"
        }
      >
        <Card rows>
          <CardListHeader className="flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4">
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {variableNames.length === 0
                ? "No variables"
                : variableNames.length === 1
                  ? "1 variable"
                  : `${variableNames.length} variables`}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={variableNames.length === 0 ? "Add variables" : "Replace variables"}
                title={variableNames.length === 0 ? "Add variables" : "Replace variables"}
                onClick={() => setVariables([emptyKeyValue()])}
              >
                <Icon name="square-plus" />
              </Button>
            </div>
          </CardListHeader>
          {variableNames.map((variable) => (
            <SettingsRow key={variable} label={variable} description="Hidden value" />
          ))}
          {variables !== undefined && (
            <div className="flex flex-col gap-3 p-4">
              <KeyValueRows
                noun="Variable"
                rows={variables}
                onChange={setVariables}
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setVariables(undefined)}>
                  Cancel
                </Button>
                <Button
                  intent="accent"
                  disabled={parseKeyValues(variables, false) === undefined}
                  onClick={() => {
                    const parsed = parseKeyValues(variables, false);
                    if (parsed === undefined) return;
                    void patch(
                      server.command === null
                        ? { requestHeaders: parsed }
                        : { env: parsed },
                      undefined,
                      "Could not save the variables",
                    ).then(() => setVariables(undefined));
                  }}
                >
                  {Object.keys(parseKeyValues(variables, false) ?? {}).length === 1
                    ? "Save variable"
                    : `Save ${Object.keys(parseKeyValues(variables, false) ?? {}).length} variables`}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </SettingsSection>
      <Collapsible defaultOpen className="flex flex-col gap-10">
        <CollapsibleTrigger className={collapsibleTrigger}>
          Configuration
          <Icon name="chevron-grabber-vertical" size="sm" />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-10">
            <RuntimeSection
              draft={draft}
              onChange={(change) => {
                setDraft({ ...draft, ...change });
                setDirty(true);
              }}
            />
            <AuthenticationSection
              draft={draft}
              onChange={(change) => {
                setDraft({ ...draft, ...change });
                setDirty(true);
              }}
            />
            {dirty && (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraft(draftFromServer(server));
                    setDirty(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  intent="accent"
                  disabled={!validation.valid || saving}
                  onClick={saveConfiguration}
                >
                  {saving ? "Saving" : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CollapsiblePanel>
      </Collapsible>
      <Collapsible className="flex flex-col gap-3">
        <div className="flex min-h-7 flex-wrap items-center justify-between gap-3">
          <CollapsibleTrigger className={collapsibleTrigger}>
            Tools
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-normal text-muted-foreground-2">
              {tools === undefined || tools === null
                ? "Not listed yet, refresh to load them"
                : toolList.length === 0
                  ? "This server reports no tools"
                  : `${toolList.length} tools, ${toolsOn} on`}
            </span>
            <Icon name="chevron-grabber-vertical" size="sm" />
          </CollapsibleTrigger>
          <div className="flex items-center gap-2 max-sm:w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                void refresh({ params, reactivityKeys: keys }).catch(() =>
                  toast.error("Could not refresh the server"),
                )
              }
            >
              <Icon name="rotate" />
              Refresh
            </Button>
          </div>
        </div>
        <CollapsiblePanel>
          <div className="-mx-4 flex flex-col gap-3">
            {toolList.length > 1 && (
              <Input
                size="sm"
                placeholder="Filter tools"
                aria-label="Filter tools"
                className="w-48 max-sm:w-full"
                value={toolFilter}
                onChange={(event) => setToolFilter(event.target.value)}
              />
            )}
            <Card rows>
              {visibleTools.map((tool) => (
                <SettingsRow
                  key={tool.name}
                  label={tool.name}
                  description={tool.description ?? undefined}
                >
                  <Switch
                    aria-label={`${disabledTools.has(tool.name) ? "Enable" : "Disable"} ${tool.name}`}
                    checked={!disabledTools.has(tool.name)}
                    onCheckedChange={(checked) => {
                      const next = new Set(disabledTools);
                      if (checked) next.delete(tool.name);
                      else next.add(tool.name);
                      void patch({ disabledTools: [...next] });
                    }}
                  />
                </SettingsRow>
              ))}
              {visibleTools.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground-2">
                  {toolFilter.trim() === ""
                    ? "No tools"
                    : `No tools match ${toolFilter.trim()}`}
                </div>
              )}
            </Card>
          </div>
        </CollapsiblePanel>
      </Collapsible>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Delete {server.displayName}?</DialogTitle>
          <DialogDescription>This cannot be undone</DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              intent="danger"
              onClick={() =>
                void remove({ params, reactivityKeys: keys })
                  .then(() => {
                    toast.success(`${server.displayName} deleted`);
                    return navigate(listPath(mount));
                  })
                  .catch(() => toast.error("Could not delete the server"))
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsPage>
  );
}
