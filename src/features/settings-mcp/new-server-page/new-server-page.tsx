import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Textarea } from "@/primitives/textarea";
import { mcpKeys, mcpMutation } from "../model/atoms.ts";
import {
  createRequest,
  deriveServerKey,
  emptyDraft,
  type ServerDraft,
  validateDraft,
} from "../model/draft.ts";
import { serverPath } from "../model/mount.ts";
import type { McpMount, McpServer } from "../model/types.ts";
import { useActiveOrgId, useProjects } from "../model/use-mcp-data.ts";
import {
  AuthenticationSection,
  FieldRow,
  fieldCard,
  ProjectMenu,
  RuntimeSection,
  SelectField,
  VariablesSection,
} from "../server-form/fields.tsx";
import { McpPage, McpSection } from "../ui/settings-layout.tsx";

export interface NewServerPageProps {
  readonly mount: McpMount;
  readonly importing?: boolean;
}

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

export function NewServerPage({ mount, importing = false }: NewServerPageProps) {
  const navigate = useNavigate();
  const orgId = useActiveOrgId();
  const projects = useProjects(orgId) ?? [];
  const create = useAtomSet(mcpMutation.createServer, { mode: "promise" });
  const [draft, setDraft] = useState<ServerDraft>(() =>
    emptyDraft(mount.kind === "project" ? mount.projectId : undefined),
  );
  const [keyTouched, setKeyTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pasted, setPasted] = useState("");
  const validation = validateDraft(draft);
  const change = (next: Partial<ServerDraft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const save = () => {
    if (orgId === undefined || !validation.valid) return;
    setSaving(true);
    const request = createRequest(draft, validation);
    create({
      params: { orgId },
      payload: {
        ...request,
        projectId: draft.projectId === "org-wide" ? undefined : draft.projectId,
      },
      reactivityKeys: [mcpKeys.servers(orgId)],
    })
      .then((created) => {
        toast.success("Server added");
        return navigate(serverPath(mount, (created as McpServer).id));
      })
      .catch(() => toast.error("Could not save the server"))
      .finally(() => setSaving(false));
  };

  const parse = () => {
    const value = pasted.trim();
    if (value.startsWith("https://")) {
      change({ placement: "url", url: value });
      return;
    }
    toast.error("Unrecognized configuration shape");
  };

  return (
    <McpPage
      title="Add MCP server"
      description={
        mount.kind === "project"
          ? "Available only to this project's threads"
          : "Connect tools and services Capy can use"
      }
    >
      <McpSection
        title="Server"
        action={
          <Button
            intent="accent"
            size="sm"
            disabled={!validation.valid || saving}
            onClick={save}
          >
            {saving ? "Adding" : "Add server"}
          </Button>
        }
      >
        <Card className={fieldCard}>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <label className={labelClass}>
              Name
              <Input
                placeholder="DeepWiki"
                value={draft.displayName}
                onChange={(event) => {
                  const displayName = event.target.value;
                  change(
                    keyTouched
                      ? { displayName }
                      : { displayName, serverKey: deriveServerKey(displayName) },
                  );
                }}
              />
            </label>
            <label className={labelClass}>
              Key
              <Input
                placeholder="deepwiki"
                aria-invalid={draft.serverKey !== "" && !validation.validKey}
                value={draft.serverKey}
                onChange={(event) => {
                  setKeyTouched(true);
                  change({ serverKey: event.target.value });
                }}
              />
            </label>
          </div>
          {mount.kind !== "project" && (
            <FieldRow
              divided
              label="Owner"
              description={
                draft.owner === "user"
                  ? "Visible only to you; members who message your threads can use it"
                  : "Every member can see and use it"
              }
            >
              <SelectField
                label="Owner"
                value={draft.owner}
                options={[
                  { value: "organization", label: "Organization" },
                  { value: "user", label: "Only you" },
                ]}
                onChange={(owner) => change({ owner })}
              />
            </FieldRow>
          )}
          {mount.kind !== "project" && (
            <FieldRow
              divided
              label="Project"
              description="Available in every project, or only in one"
            >
              <ProjectMenu
                value={draft.projectId}
                projects={projects}
                onChange={(projectId) => change({ projectId })}
              />
            </FieldRow>
          )}
        </Card>
      </McpSection>
      <RuntimeSection draft={draft} onChange={change} />
      <AuthenticationSection draft={draft} onChange={change} />
      <VariablesSection draft={draft} onChange={change} />
      <Collapsible defaultOpen={importing} className="flex flex-col gap-10">
        <CollapsibleTrigger className="group/collapsible flex w-fit cursor-pointer select-none items-center gap-1.5 rounded text-left text-base font-medium text-foreground outline-none focus-visible:outline-ring-inset">
          Advanced
          <span className="text-sm font-normal text-muted-foreground-2">
            Import a configuration
          </span>
          <Icon name="chevron-right" size="sm" />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <McpSection
            title="Import a configuration"
            description="Paste an mcpServers JSON, a Codex TOML, a URL, or a command line, or drop a file"
          >
            <Card className={fieldCard}>
              <Textarea
                aria-label="Configuration"
                placeholder='{ "mcpServers": { ... } } or npx -y @modelcontextprotocol/server-everything'
                value={pasted}
                onChange={(event) => setPasted(event.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                disabled={pasted.trim() === ""}
                onClick={parse}
              >
                Parse
              </Button>
            </Card>
          </McpSection>
        </CollapsiblePanel>
      </Collapsible>
    </McpPage>
  );
}
