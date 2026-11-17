import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";

const iso = (minutes: number) => DateTime.formatIso(minutesAgo(minutes));

const version = (options: {
  readonly id: string;
  readonly pluginId: string;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly serverKey: string;
  readonly url: string;
  readonly auth: "none" | "oauth" | "headers";
  readonly skills: ReadonlyArray<{ name: string; description: string }>;
  readonly warnings?: ReadonlyArray<string>;
}) => ({
  id: options.id,
  source: "marketplace",
  pluginId: options.pluginId,
  name: options.name,
  version: options.version,
  displayName: options.displayName,
  description: options.description,
  hasIcon: false,
  servers: [
    {
      entry: options.serverKey,
      serverKey: options.serverKey,
      displayName: options.displayName,
      transport: "http",
      placement: "backend",
      url: options.url,
      auth: options.auth,
      connection: "organization",
      secrets: {},
    },
  ],
  skills: options.skills,
  warnings: options.warnings ?? [],
  repository: `example/${options.name}`,
  path: "",
  notes: null,
  maker: { name: "Example Labs", url: "https://example.com" },
  createdAt: iso(60 * 24 * 3),
});

export const sampleSearchVersion = version({
  id: "plugin_ver_sample_search_132",
  pluginId: "plugin_sample_search",
  name: "acme-search",
  displayName: "Acme Search",
  description: "Search, read, and summarise pages from the web.",
  version: "1.3.2",
  serverKey: "acme-search",
  url: "https://search.example.com/mcp",
  auth: "oauth",
  skills: [
    { name: "search-web", description: "Search the web and cite sources" },
    { name: "read-page", description: "Read one page and pull out its text" },
  ],
  warnings: [
    "skills/search-cli/SKILL.md: skipped, the name search differs from its directory",
  ],
});

export const sampleTrackerVersion = version({
  id: "plugin_ver_sample_tracker_210",
  pluginId: "plugin_sample_tracker",
  name: "tracker",
  displayName: "Tracker",
  description: "Read and triage errors from your error tracker.",
  version: "2.1.0",
  serverKey: "tracker",
  url: "https://tracker.example.com/mcp",
  auth: "oauth",
  skills: [{ name: "triage", description: "Triage a new error" }],
});

export const sampleDeployVersion = version({
  id: "plugin_ver_sample_deploy_040",
  pluginId: "plugin_sample_deploy",
  name: "deploy",
  displayName: "Deploy",
  description: "Ship previews and production deploys.",
  version: "0.4.0",
  serverKey: "deploy",
  url: "https://deploy.example.com/mcp",
  auth: "headers",
  skills: [],
});

export const samplePluginVersions = [
  sampleSearchVersion,
  sampleTrackerVersion,
  sampleDeployVersion,
];

export const sampleInstallations = [
  {
    id: "plugin_inst_sample_search",
    pluginId: "plugin_sample_search",
    pluginName: "acme-search",
    displayName: "Acme Search",
    description: sampleSearchVersion.description,
    versionId: sampleSearchVersion.id,
    version: "1.3.2",
    hasIcon: false,
    source: "marketplace",
    repository: sampleSearchVersion.repository,
    owner: "organization" as "organization" | "me",
    projectId: null as string | null,
    enabled: true,
    toolCount: 12,
    skillCount: 2,
    status: "Connected · 12 tools",
    updateNeedsYou: false,
    createdAt: iso(60 * 24),
    updatedAt: iso(60 * 24),
  },
];

export const sampleMarketplace = [
  {
    pluginId: "plugin_sample_search",
    name: "acme-search",
    category: "productivity",
    featured: true,
    verified: true,
    maker: { name: "Example Labs", url: "https://example.com" },
    stars: 1200,
    setup: null,
    version: sampleSearchVersion,
    installationId: "plugin_inst_sample_search",
  },
  {
    pluginId: "plugin_sample_tracker",
    name: "tracker",
    category: "monitoring",
    featured: true,
    verified: true,
    maker: { name: "Example Labs", url: "https://example.com" },
    stars: 640,
    setup: null,
    version: sampleTrackerVersion,
    installationId: null,
  },
  {
    pluginId: "plugin_sample_deploy",
    name: "deploy",
    category: "deployment",
    featured: false,
    verified: true,
    maker: { name: "Example Labs", url: "https://example.com" },
    stars: null,
    setup: null,
    version: sampleDeployVersion,
    installationId: null,
  },
];
