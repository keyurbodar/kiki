import {
  isMemberConnection,
  type McpSection,
  mcpSections,
  pluginSection,
  serverSection,
} from "../model/status.ts";
import type { InstalledPlugin, McpServer } from "../model/types.ts";

export type ListRow =
  | {
      readonly kind: "plugin";
      readonly name: string;
      readonly plugin: InstalledPlugin;
    }
  | {
      readonly kind: "server";
      readonly name: string;
      readonly server: McpServer;
    };

const byName = (a: ListRow, b: ListRow) => a.name.localeCompare(b.name);

export const sectionRows = (
  section: McpSection,
  plugins: ReadonlyArray<InstalledPlugin>,
  servers: ReadonlyArray<McpServer>,
): ReadonlyArray<ListRow> => [
  ...plugins
    .filter((plugin) => pluginSection(plugin, servers) === section)
    .map(
      (plugin): ListRow => ({
        kind: "plugin",
        name: plugin.displayName,
        plugin,
      }),
    )
    .toSorted(byName),
  ...servers
    .filter(
      (server) =>
        server.pluginInstallationId === null &&
        !isMemberConnection(server) &&
        serverSection(server) === section,
    )
    .map(
      (server): ListRow => ({
        kind: "server",
        name: server.displayName,
        server,
      }),
    )
    .toSorted(byName),
];

export const listSections = (
  plugins: ReadonlyArray<InstalledPlugin>,
  servers: ReadonlyArray<McpServer>,
) =>
  mcpSections.map((section) => ({
    section,
    rows: sectionRows(section, plugins, servers),
  }));

export const filterRows = (rows: ReadonlyArray<ListRow>, query: string) => {
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => row.name.toLowerCase().includes(needle));
};
