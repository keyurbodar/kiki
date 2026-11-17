import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card, CardListHeader } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  listCountLabel,
  type McpSection,
  memberConnectionFor,
  memberStatus,
  needsAttention,
  pluginCounts,
  pluralize,
  projectRef,
  sectionCopy,
  serverStatusParts,
} from "../model/status.ts";
import type { MarketplacePlugin, McpServer } from "../model/types.ts";
import {
  useActiveOrgId,
  useMarketplace,
  useMcpServers,
  usePluginInstallations,
  useProjects,
} from "../model/use-mcp-data.ts";
import { SearchGlyph } from "../ui/glyphs.tsx";
import { PluginIcon, ServerIcon, StatusBadge } from "../ui/plugin-shared.tsx";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { SettingsPage, SettingsSection as Section } from "@/components/settings-page";
import { AddMenu } from "./add-menu.tsx";
import { GitHubPluginSheet } from "./github-plugin-sheet.tsx";
import { filterRows, type ListRow, listSections } from "./model.ts";

const sectionIds: Record<McpSection, string> = {
  organization: "mcp-organization",
  member: "mcp-member",
  yours: "mcp-yours",
};

export interface McpAndPluginsPageProps {
  readonly github?: string;
}

export function McpAndPluginsPage({ github }: McpAndPluginsPageProps) {
  const navigate = useNavigate();
  const orgId = useActiveOrgId();
  const servers = useMcpServers(orgId);
  const plugins = usePluginInstallations(orgId);
  const marketplace = useMarketplace(orgId);
  const projects = useProjects(orgId);
  const [queries, setQueries] = useState<Record<string, string>>({});

  const sections =
    servers === undefined || plugins === undefined
      ? undefined
      : listSections(plugins, servers);

  return (
    <SettingsPage
      title="MCP & plugins"
      description="Teach Capy to work with the services your team uses"
    >
      {github !== undefined && (
        <GitHubPluginSheet
          open
          initialUrl={github}
          onOpenChange={(open) => {
            if (!open)
              void navigate({
                to: "/settings/mcp",
                search: (previous) => ({ ...previous, github: undefined }),
                replace: true,
              });
          }}
        />
      )}
      <Section>
        <Card rows>
          <SettingsRow
            id="mcp-setup"
            icon={<Icon name="console-sparkle" />}
            label="Set up with Capy"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate({ to: "/new" })}
            >
              Start a thread
            </Button>
          </SettingsRow>
          <SettingsRowLink chevron="wide"
            to="/settings/mcp/marketplace"
            id="mcp-marketplace"
            icon={<Icon name="store-1" />}
            label="Explore the marketplace"
            description="Plugins, skills, and templates, listed by Capy"
          >
            <MarketplaceStack plugins={marketplace ?? []} />
          </SettingsRowLink>
        </Card>
      </Section>
      {sections === undefined ? (
        <Section>
          <Card>
            <div className="flex items-center justify-center gap-2 p-8 text-sm font-normal text-muted-foreground-2">
              Loading plugins and MCP servers
            </div>
          </Card>
        </Section>
      ) : sections.every((entry) => entry.rows.length === 0) ? (
        <Section>
          <Card rows>
            <ListHeader label={listCountLabel(0)} />
          </Card>
        </Section>
      ) : (
        sections.map(({ section, rows }) => {
          if (rows.length === 0) return null;
          const id = sectionIds[section];
          const query = queries[id] ?? "";
          const visible = filterRows(rows, query);
          return (
            <Section
              key={section}
              id={id}
              title={sectionCopy[section].title}
              description={sectionCopy[section].description}
            >
              <Card rows>
                <ListHeader
                  label={listCountLabel(rows.length)}
                  search={
                    rows.length < 2 && query === ""
                      ? undefined
                      : {
                          value: query,
                          onChange: (value) =>
                            setQueries({ ...queries, [id]: value }),
                        }
                  }
                />
                {visible.map((row) => (
                  <ListRowLink
                    key={row.kind === "plugin" ? row.plugin.id : row.server.id}
                    row={row}
                    section={section}
                    servers={servers ?? []}
                    projects={projects}
                  />
                ))}
                {visible.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground-2">
                    Nothing matches
                  </div>
                )}
              </Card>
            </Section>
          );
        })
      )}
    </SettingsPage>
  );
}

function ListHeader({
  label,
  search,
}: {
  readonly label: string;
  readonly search?: {
    readonly value: string;
    readonly onChange: (value: string) => void;
  };
}) {
  const [searching, setSearching] = useState(false);
  return (
    <CardListHeader className="flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4">
      {searching && search !== undefined ? (
        <Input
          autoFocus
          size="sm"
          value={search.value}
          placeholder="Search plugins and MCP servers"
          aria-label="Search plugins and MCP servers"
          className="min-w-0 flex-1"
          onChange={(event) => search.onChange(event.target.value)}
          onBlur={() => {
            if (search.value === "") setSearching(false);
          }}
        />
      ) : (
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {label}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {search !== undefined && !searching && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Search plugins and MCP servers"
            title="Search plugins and MCP servers"
            onClick={() => setSearching(true)}
          >
            <SearchGlyph />
          </Button>
        )}
        <AddMenu />
      </div>
    </CardListHeader>
  );
}

function ListRowLink({
  row,
  section,
  servers,
  projects,
}: {
  readonly row: ListRow;
  readonly section: McpSection;
  readonly servers: ReadonlyArray<McpServer>;
  readonly projects:
    | ReadonlyArray<{ readonly id: string; readonly name: string }>
    | undefined;
}) {
  const rawStatus =
    row.kind === "plugin"
      ? row.plugin.updateNeedsYou
        ? "Update needs you"
        : row.plugin.status
      : serverStatusParts(
          memberConnectionFor(row.server, servers) ?? row.server,
        ).label;
  const status =
    section === "member" && rawStatus !== null
      ? memberStatus(rawStatus)
      : rawStatus;
  const project = projectRef(
    row.kind === "plugin" ? row.plugin.projectId : row.server.projectId,
    projects,
    undefined,
  );
  const counts =
    row.kind === "plugin"
      ? pluginCounts(row.plugin)
      : row.server.toolCount === null
        ? ""
        : pluralize(row.server.toolCount, "tool");
  const description = [
    row.kind === "plugin" ? "Plugin" : "MCP server",
    counts,
    project?.state === "live" ? project.name : "",
  ]
    .filter((part) => part !== "")
    .join(" · ");
  const label = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      {row.name}
      {row.kind === "plugin" && (
        <Badge size="sm" className="max-sm:hidden">
          {row.plugin.version}
        </Badge>
      )}
      {row.kind === "plugin" && row.plugin.source === "github" && (
        <Badge size="sm" className="max-sm:hidden">
          GitHub
        </Badge>
      )}
    </span>
  );
  const trailing =
    project?.state === "deleted" ? (
      <Badge color="danger">Project deleted</Badge>
    ) : status === null ? null : (
      <StatusBadge
        status={status}
        className={needsAttention(status) ? undefined : "max-sm:hidden"}
      />
    );
  return row.kind === "plugin" ? (
    <SettingsRowLink chevron="wide"
      to="/settings/mcp/plugins/$installationId"
      params={{ installationId: row.plugin.id }}
      icon={<PluginIcon name={row.plugin.displayName} />}
      label={label}
      description={description}
    >
      {trailing}
    </SettingsRowLink>
  ) : (
    <SettingsRowLink chevron="wide"
      to="/settings/mcp/$serverId"
      params={{ serverId: row.server.id }}
      icon={<ServerIcon iconUrl={row.server.iconUrl} />}
      label={label}
      description={description}
    >
      {trailing}
    </SettingsRowLink>
  );
}

function MarketplaceStack({
  plugins,
}: {
  readonly plugins: ReadonlyArray<MarketplacePlugin>;
}) {
  const shown = plugins
    .filter((plugin) => plugin.version.hasIcon)
    .toSorted((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4);
  if (shown.length === 0) return null;
  return (
    <span className="flex items-center max-sm:hidden">
      {shown.map((plugin) => (
        <span
          key={plugin.pluginId}
          className="grid size-6 place-items-center rounded-md bg-card ring-2 ring-card not-first:-ml-1.5"
        >
          <PluginIcon name={plugin.version.displayName} size="xs" />
        </span>
      ))}
    </span>
  );
}
