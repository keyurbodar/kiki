import {
  ExploreCard,
  type ExploreContent,
  ExploreListing,
  type ExplorePluginServer,
  ExploreVersion,
  type ListingSetup,
} from "../../api/schemas/explore.ts";
import { minutesAgo } from "../fixtures/time.ts";

const day = 24 * 60;

const edgeSkillNames = [
  [
    "workers-sdk",
    "Build, debug, or review edge worker applications that use the workers SDK",
  ],
  [
    "analytics-pipelines",
    "Build and troubleshoot analytics pipelines, catalogs, and SQL over stored tables. Use for streaming data into object storage, managing catalogs, or querying those tables; also use for requests that name the older pipeline products",
  ],
  [
    "edge-platform",
    "Discover and choose edge platform products for apps, APIs, agents, storage, networking, and security. Use for architecture and product selection, including when the user describes a need without naming a product; then find the relevant skill or documentation",
  ],
  [
    "edge-email",
    "Implement or troubleshoot email sending and routing integrations and their delivery configuration",
  ],
  [
    "zero-trust",
    "Design, configure, troubleshoot, or review zero trust and secure access deployments. Use zero-trust-migrations for migration planning from other vendors",
  ],
  [
    "zero-trust-migrations",
    "Plan a migration from another secure access vendor",
  ],
  ["dns-records", "Create, update, and audit DNS records for a zone"],
  ["cache-rules", "Tune cache rules and purge content"],
  ["kv-storage", "Read and write key-value storage from workers"],
  ["object-storage", "Manage buckets, objects, and lifecycle rules"],
  ["queues", "Produce and consume queue messages from workers"],
  ["durable-objects", "Design stateful coordination with durable objects"],
  ["images", "Resize, optimize, and serve images at the edge"],
  ["web-analytics", "Read traffic and performance analytics for a site"],
  ["waf-rules", "Write and test firewall rules"],
  ["load-balancing", "Configure pools, monitors, and steering"],
] as const;

const trackerSkillNames = [
  [
    "tracker-create-alert",
    "Create alerts with the workflow engine API. Use when asked to create alerts, set up notifications, configure issue priority alerts, or build workflow automations. Supports email, chat, paging, and other notification actions",
  ],
  [
    "tracker-debug-issue",
    "Debug and fix a tracked issue: find it by link, ID, or search, pull full context (stack trace, breadcrumbs, trace, logs), optionally run the root-cause tool, apply the code fix, and resolve it via a fixing commit or pull request",
  ],
  [
    "tracker-fix-stack-traces",
    "Make stack traces readable: upload source maps for JavaScript and TypeScript, or debug files for native and mobile builds. Use when frames show minified names, bundled paths, or method names with no file or line",
  ],
  [
    "tracker-get-started",
    "Guided entry point for using the tracker through your agent. Orients you to your current setup and, for a new project, sets up the tracker end to end with sane defaults",
  ],
  [
    "tracker-instrument",
    "Instrument an application: detect the platform, install and initialize the SDK if needed, and wire up any signal, from error monitoring and tracing to logging and metrics",
  ],
  ["tracker-releases", "Create releases and associate commits"],
  ["tracker-performance", "Find slow transactions and spans"],
  ["tracker-replays", "Review session replays for an issue"],
] as const;

const oauthServer = (
  displayName: string,
  url: string,
): ExplorePluginServer => ({
  displayName,
  transport: "http",
  placement: "backend",
  url,
  command: null,
  auth: "oauth",
  connection: "organization",
  scopes: [],
  secrets: [],
});

const pluginContent = (
  skills: ReadonlyArray<readonly [string, string]>,
  server: ExplorePluginServer,
  repository: string,
): ExploreContent => ({
  kind: "plugin",
  plugin: {
    servers: [server],
    skills: skills.map(([name, description]) => ({
      name,
      description,
      content: `# ${name}\n\n${description}.`,
    })),
    repository,
    path: ".",
    commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
    license: "MIT",
    warnings: [],
    prerequisites: null,
  },
});

const card = (
  fields: Partial<ExploreCard> &
    Pick<ExploreCard, "kind" | "slug" | "displayName" | "description">,
) =>
  new ExploreCard({
    source: "catalog",
    maker: null,
    accent: null,
    category: null,
    firstListedAt: minutesAgo(40 * day),
    featuredRank: null,
    hasIcon: false,
    repository: null,
    stars: null,
    starsCheckedAt: null,
    adds: null,
    version: null,
    versionId: null,
    theme: null,
    builtIn: null,
    createdAt: minutesAgo(40 * day),
    updatedAt: minutesAgo(30 * day),
    ...fields,
  });

const firstListing = (id: string, version: string, daysAgo: number) =>
  new ExploreVersion({
    id,
    version,
    notes: "First listing in Explore",
    createdAt: minutesAgo(daysAgo * day),
  });

const skillMarkdown = [
  "---",
  "name: debugging-playbook",
  "description: Debug hard bugs with a tight feedback loop",
  "---",
  "",
  "# Debugging playbook",
  "",
  ...Array.from(
    { length: 132 },
    (_, line) => `Step ${line + 1}: narrow the failing case.`,
  ),
].join("\n");

const reproLoop = [
  "#!/usr/bin/env bash",
  "set -euo pipefail",
  ...Array.from({ length: 43 }, (_, line) => `echo "attempt ${line + 1}"`),
].join("\n");

const debuggingSetup: ListingSetup = {
  prompt:
    "Help the person reproduce and fix one bug with the debugging playbook.",
  automations: [],
};

const auroraTheme = {
  light: {
    background: "#f7f8fa",
    foreground: "#1b1f24",
    surface: "#ffffff",
    border: "#e3e6ea",
    accent: "#4f7cff",
    "accent-foreground": "#ffffff",
    muted: "#6b7280",
  },
  dark: {
    background: "#0c1015",
    foreground: "#e8edf3",
    surface: "#141a21",
    border: "#232b35",
    accent: "#7c9bff",
    "accent-foreground": "#0c1015",
    muted: "#93a1b3",
  },
  wallpaper: { name: "Dunes" },
  appearance: { effect: "dither" },
};

export const sampleListings: ReadonlyArray<ExploreListing> = [
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "edge-platform",
      displayName: "Edge Platform",
      description: "Manage workers, zones, and edge configuration",
      repository: "northwind/skills",
      version: "1.0.1",
      versionId: "plv_sample_edge_101",
      category: "deployment",
    }),
    content: pluginContent(
      edgeSkillNames,
      oauthServer("Edge Platform", "https://mcp.northwind.example/mcp"),
      "northwind/skills",
    ),
    setup: null,
    versions: [firstListing("plv_sample_edge_101", "1.0.1", 41)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "error-tracker",
      displayName: "Error Tracker",
      description: "Investigate errors, traces, and affected releases",
      repository: "globex/tracker-plugin",
      version: "1.4.0",
      versionId: "plv_sample_tracker_140",
      category: "monitoring",
    }),
    content: pluginContent(
      trackerSkillNames,
      oauthServer("Error Tracker", "https://mcp.globex.example/mcp"),
      "globex/tracker-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_tracker_140", "1.4.0", 41)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "debugging-playbook",
      displayName: "Debugging Playbook",
      description:
        "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, narrowing, and fixing.",
      maker: { name: "Alex Morgan" },
      repository: "acme/skills",
      stars: 12_480,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_sample_debugging_100",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "debugging-playbook",
        description: "Debug hard bugs with a tight feedback loop",
        files: [
          {
            path: "agents/openai.yaml",
            content:
              "name: debugging-playbook\nmodel: default\ntools: []\nversion: 1",
          },
          { path: "scripts/repro-loop.template.sh", content: reproLoop },
          { path: "SKILL.md", content: skillMarkdown },
        ],
        starters: [
          "Find why the checkout test fails only on CI",
          "Track down the 3x slowdown on the reports page",
        ],
        source: {
          repository: "acme/skills",
          path: "skills/debugging-playbook",
          commit: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
        },
      },
    },
    setup: debuggingSetup,
    versions: [firstListing("skv_sample_debugging_100", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "theme",
      slug: "aurora",
      displayName: "Aurora",
      description:
        "A quiet, high-contrast theme for long review sessions, with a soft accent and a dither that stays out of the way.",
      maker: { name: "Priya Shah" },
      source: "user",
      theme: {
        light: auroraTheme.light,
        dark: auroraTheme.dark,
        wallpaper: auroraTheme.wallpaper,
      },
      version: "1.2.0",
      versionId: "thv_sample_aurora_120",
      hasIcon: true,
      featuredRank: null,
    }),
    content: { kind: "theme", theme: auroraTheme },
    setup: {
      prompt: "Apply the Aurora theme and keep its wallpaper in both modes.",
      automations: [],
    },
    versions: [
      firstListing("thv_sample_aurora_100", "1.0.0", 30),
      new ExploreVersion({
        id: "thv_sample_aurora_120",
        version: "1.2.0",
        notes: "Deeper dark palette and a softer border",
        createdAt: minutesAgo(6 * day),
      }),
    ],
  }),
];

export const findSampleListing = (kind: string, slug: string) =>
  sampleListings.find(
    (listing) => listing.card.kind === kind && listing.card.slug === slug,
  );
