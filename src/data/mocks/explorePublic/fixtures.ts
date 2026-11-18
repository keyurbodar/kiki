import {
  ExploreCard,
  type ExploreContent,
  ExploreListing,
  type ExplorePluginServer,
  ExploreVersion,
  type ListingSetup,
} from "../../api/schemas/explore.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { people } from "../fixtures/world.ts";

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

const warehouseSkillNames = [
  [
    "warehouse-query",
    "Query warehouse tables with the SQL API. Use when asked for numbers from a table, to check a schema, or to trace a failing pipeline",
  ],
  [
    "warehouse-schema",
    "Inspect and change table schemas, including column types and partitioning",
  ],
] as const;

const docsSkillNames = [
  [
    "docs-draft",
    "Draft and restructure documentation pages. Use when asked to write a guide, tighten an explanation, or split a long page",
  ],
  [
    "docs-publish",
    "Publish a documentation page and set its navigation position",
  ],
] as const;

const designSkillNames = [
  [
    "design-frames",
    "List frames and components, read their tokens, and leave comments on a frame",
  ],
  [
    "design-contrast",
    "Check a palette pair for contrast and suggest the nearest passing value",
  ],
] as const;

const billingSkillNames = [
  ["billing-invoices", "Look up invoices and refunds for a customer"],
  [
    "billing-subscriptions",
    "Inspect and change subscription state, including trials and cancellations",
  ],
] as const;

const tasksSkillNames = [
  ["tasks-triage", "Create and triage issues, set labels and priority"],
  ["tasks-standup", "Summarize what moved since yesterday and what is blocked"],
] as const;

const releaseSkillNames = [
  [
    "release-changelog",
    "Draft a changelog entry from merged pull requests since the last release",
  ],
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
      kind: "plugin",
      slug: "data-warehouse",
      displayName: "Data Warehouse",
      description: "Query tables, manage schemas, and inspect pipelines",
      repository: "initech/warehouse-plugin",
      version: "2.2.0",
      versionId: "plv_sample_warehouse_220",
      category: "database",
      featuredRank: 1,
      stars: 3_120,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: pluginContent(
      warehouseSkillNames,
      oauthServer("Data Warehouse", "https://mcp.initech.example/mcp"),
      "initech/warehouse-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_warehouse_220", "2.2.0", 12)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "docs-writer",
      displayName: "Docs Writer",
      description: "Draft, restructure, and publish documentation pages",
      repository: "acme/docs-plugin",
      version: "1.1.3",
      versionId: "plv_sample_docs_113",
      category: "docs",
      firstListedAt: minutesAgo(9 * day),
    }),
    content: pluginContent(
      docsSkillNames,
      oauthServer("Docs Writer", "https://mcp.acme.example/docs/mcp"),
      "acme/docs-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_docs_113", "1.1.3", 26)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "design-review",
      displayName: "Design Review",
      description: "Comment on frames, list components, and check contrast",
      repository: "globex/design-plugin",
      version: "0.9.4",
      versionId: "plv_sample_design_094",
      category: "design",
      featuredRank: 2,
    }),
    content: pluginContent(
      designSkillNames,
      oauthServer("Design Review", "https://mcp.globex.example/design/mcp"),
      "globex/design-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_design_094", "0.9.4", 5)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "billing-ops",
      displayName: "Billing Ops",
      description: "Inspect invoices, refunds, and subscription state",
      repository: "northwind/billing-plugin",
      version: "3.0.1",
      versionId: "plv_sample_billing_301",
      category: "payments",
    }),
    content: pluginContent(
      billingSkillNames,
      oauthServer("Billing Ops", "https://mcp.northwind.example/billing/mcp"),
      "northwind/billing-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_billing_301", "3.0.1", 33)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "task-board",
      displayName: "Task Board",
      description: "Create and triage issues, track standups, close loops",
      repository: "initech/tasks-plugin",
      version: "1.6.0",
      versionId: "plv_sample_tasks_160",
      category: "productivity",
    }),
    content: pluginContent(
      tasksSkillNames,
      oauthServer("Task Board", "https://mcp.initech.example/tasks/mcp"),
      "initech/tasks-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_tasks_160", "1.6.0", 18)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "release-notes",
      displayName: "Release Notes",
      description: "Draft and publish changelog entries for a release",
      repository: "acme/release-plugin",
      version: "1.0.0",
      versionId: "plv_sample_release_100",
      category: "other",
    }),
    content: pluginContent(
      releaseSkillNames,
      oauthServer("Release Notes", "https://mcp.acme.example/release/mcp"),
      "acme/release-plugin",
    ),
    setup: null,
    versions: [firstListing("plv_sample_release_100", "1.0.0", 21)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "incident-digest",
      displayName: "Incident Digest",
      description: "Roll a week of incidents into one review note",
      repository: "globex/incident-digest",
      version: "1.2.0",
      versionId: "plv_sample_digest_120",
      category: "monitoring",
      featuredRank: 3,
      stars: 1_940,
      starsCheckedAt: minutesAgo(4 * day),
    }),
    content: pluginContent(
      [
        [
          "incident-digest",
          "Collect the week's incidents, group them by cause, and draft the review note",
        ],
      ],
      oauthServer("Incident Digest", "https://mcp.globex.example/digest/mcp"),
      "globex/incident-digest",
    ),
    setup: null,
    versions: [firstListing("plv_sample_digest_120", "1.2.0", 12)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "preview-deploys",
      displayName: "Preview Deploys",
      description: "Open a preview URL for every pull request",
      repository: "initech/preview-deploys",
      version: "0.9.3",
      versionId: "plv_sample_preview_093",
      category: "deployment",
      stars: 864,
      starsCheckedAt: minutesAgo(6 * day),
    }),
    content: pluginContent(
      [
        [
          "preview-deploys",
          "Create, list, and tear down preview deployments for a pull request",
        ],
      ],
      oauthServer("Preview Deploys", "https://mcp.initech.example/preview/mcp"),
      "initech/preview-deploys",
    ),
    setup: null,
    versions: [firstListing("plv_sample_preview_093", "0.9.3", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "design-tokens",
      displayName: "Design Tokens",
      description: "Sync tokens from the design file into the repository",
      repository: "northwind/design-tokens",
      version: "3.0.0",
      versionId: "plv_sample_tokens_300",
      category: "design",
      stars: 2_310,
      starsCheckedAt: minutesAgo(5 * day),
    }),
    content: pluginContent(
      [
        [
          "design-tokens",
          "Pull token values from the design file and write them as theme variables",
        ],
        [
          "token-audit",
          "Report tokens defined in the design file that no surface uses",
        ],
      ],
      oauthServer("Design Tokens", "https://mcp.northwind.example/tokens/mcp"),
      "northwind/design-tokens",
    ),
    setup: null,
    versions: [firstListing("plv_sample_tokens_300", "3.0.0", 6)],
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
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "diagnosing-bugs",
      displayName: "Diagnosing Bugs",
      description:
        "Debug hard bugs and slow code by first building a tight pass/fail" +
        " feedback loop, then reproducing, minimising, and fixing",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_diagnosing-bugs",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "diagnosing-bugs",
        description:
          "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing",
        files: [],
        starters: [],
        source: {
          repository: "captured/diagnosing-bugs",
          path: "skills/diagnosing-bugs",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_diagnosing-bugs", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "grilling",
      displayName: "Grilling",
      description:
        "Stress-test a plan or design by interviewing you in rounds, with a" +
        "recommended answer to each question, until nothing is left assumed",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_grilling",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "grilling",
        description:
          "Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed",
        files: [],
        starters: [],
        source: {
          repository: "captured/grilling",
          path: "skills/grilling",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_grilling", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "improve-codebase-architecture",
      displayName: "Improve Codebase Architecture",
      description:
        "Find shallow modules worth deepening, present them as an HTML" +
        "report, then talk through the one you pick",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_improve-codebase-architecture",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "improve-codebase-architecture",
        description:
          "Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick",
        files: [],
        starters: [],
        source: {
          repository: "captured/improve-codebase-architecture",
          path: "skills/improve-codebase-architecture",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_improve-codebase-architecture", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-codebase-design",
      displayName: "Codebase Design",
      description:
        "Design deep modules with a shared vocabulary of interfaces, seams," +
        "adapters, and the deletion test",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-codebase-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-codebase-design",
        description:
          "Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test",
        files: [],
        starters: [],
        source: {
          repository: "captured/mattpocock-codebase-design",
          path: "skills/mattpocock-codebase-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mattpocock-codebase-design", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-handoff",
      displayName: "Handoff",
      description:
        "Compact the current session into a handoff document so a fresh agent" +
        "can pick up the work",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-handoff",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-handoff",
        description:
          "Compact the current session into a handoff document so a fresh agent can pick up the work",
        files: [],
        starters: [],
        source: {
          repository: "captured/mattpocock-handoff",
          path: "skills/mattpocock-handoff",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-handoff", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-pr",
      displayName: "PR Body",
      description:
        "Write pull request bodies with a visual summary, before and after" +
        "evidence, and a merge-danger rating",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-pr",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-pr",
        description:
          "Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating",
        files: [],
        starters: [],
        source: {
          repository: "captured/mattpocock-pr",
          path: "skills/mattpocock-pr",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-pr", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "setup-pre-commit",
      displayName: "Set Up Pre-Commit Hooks",
      description:
        "Add Husky pre-commit hooks that run lint-staged formatting, type" +
        "checking, and tests",
      maker: { name: people.MattPocock.firstName },
      stars: 326100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_setup-pre-commit",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "setup-pre-commit",
        description:
          "Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests",
        files: [],
        starters: [],
        source: {
          repository: "captured/setup-pre-commit",
          path: "skills/setup-pre-commit",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_setup-pre-commit", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "docker-patterns",
      displayName: "Docker Patterns",
      description:
        "Write and review Dockerfiles and Compose stacks for local" +
        "development, with multi-stage builds and container security",
      maker: { name: people.AffaanMustafa.firstName },
      stars: 304700,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_docker-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "docker-patterns",
        description:
          "Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security",
        files: [],
        starters: [],
        source: {
          repository: "captured/docker-patterns",
          path: "skills/docker-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_docker-patterns", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kubernetes-patterns",
      displayName: "Kubernetes Patterns",
      description:
        "Write and debug production Kubernetes manifests: probes, resource" +
        "limits, RBAC, autoscaling, and secrets",
      maker: { name: people.AffaanMustafa.firstName },
      stars: 304700,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_kubernetes-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kubernetes-patterns",
        description:
          "Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets",
        files: [],
        starters: [],
        source: {
          repository: "captured/kubernetes-patterns",
          path: "skills/kubernetes-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kubernetes-patterns", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "frontend-design",
      displayName: "Frontend Design",
      description:
        "Give new or reworked UI a deliberate visual direction, with" +
        "typography and layout that don't read as template defaults",
      maker: { name: people.Anthropic.firstName },
      stars: 196300,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_frontend-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "frontend-design",
        description:
          "Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults",
        files: [],
        starters: [],
        source: {
          repository: "captured/frontend-design",
          path: "skills/frontend-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_frontend-design", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "internal-comms",
      displayName: "Internal Comms",
      description:
        "Write status reports, leadership updates, newsletters, FAQs, and" +
        "incident reports in the formats companies use",
      maker: { name: people.Anthropic.firstName },
      stars: 196300,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_internal-comms",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "internal-comms",
        description:
          "Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use",
        files: [],
        starters: [],
        source: {
          repository: "captured/internal-comms",
          path: "skills/internal-comms",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_internal-comms", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mcp-builder",
      displayName: "MCP Builder",
      description:
        "Build MCP servers in Python or TypeScript with well-designed tools," +
        "then write evaluations that test them",
      maker: { name: people.Anthropic.firstName },
      stars: 196300,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mcp-builder",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mcp-builder",
        description:
          "Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them",
        files: [],
        starters: [],
        source: {
          repository: "captured/mcp-builder",
          path: "skills/mcp-builder",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mcp-builder", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "skill-creator",
      displayName: "Skill Creator",
      description:
        "Write, edit, and benchmark agent skills, and tune their descriptions" +
        "so they trigger when they should",
      maker: { name: people.Anthropic.firstName },
      stars: 196300,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_skill-creator",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "skill-creator",
        description:
          "Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should",
        files: [],
        starters: [],
        source: {
          repository: "captured/skill-creator",
          path: "skills/skill-creator",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_skill-creator", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "webapp-testing",
      displayName: "Web App Testing",
      description:
        "Test a local web app with Playwright: drive the UI, capture" +
        "screenshots, and read browser logs",
      maker: { name: people.Anthropic.firstName },
      stars: 196300,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_webapp-testing",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "webapp-testing",
        description:
          "Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs",
        files: [],
        starters: [],
        source: {
          repository: "captured/webapp-testing",
          path: "skills/webapp-testing",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_webapp-testing", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "api-and-interface-design",
      displayName: "API and Interface Design",
      description:
        "Design stable APIs and module boundaries: contract first, consistent" +
        "errors, validation at the edges, additive change",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_api-and-interface-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "api-and-interface-design",
        description:
          "Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change",
        files: [],
        starters: [],
        source: {
          repository: "captured/api-and-interface-design",
          path: "skills/api-and-interface-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_api-and-interface-design", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "ci-cd-and-automation",
      displayName: "CI/CD and Automation",
      description:
        "Set up CI pipelines with quality gates, test runners, and deployment" +
        "strategies, and turn failures into fixes",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_ci-cd-and-automation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "ci-cd-and-automation",
        description:
          "Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes",
        files: [],
        starters: [],
        source: {
          repository: "captured/ci-cd-and-automation",
          path: "skills/ci-cd-and-automation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_ci-cd-and-automation", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "code-simplification",
      displayName: "Code Simplification",
      description:
        "Simplify code for clarity while preserving behavior exactly, scoped" +
        "to what changed",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_code-simplification",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "code-simplification",
        description:
          "Simplify code for clarity while preserving behavior exactly, scoped to what changed",
        files: [],
        starters: [],
        source: {
          repository: "captured/code-simplification",
          path: "skills/code-simplification",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_code-simplification", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deprecation-and-migration",
      displayName: "Deprecation and Migration",
      description:
        "Plan the removal of old code and zero-downtime migrations with" +
        "expand and contract steps and clear sunset paths",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_deprecation-and-migration",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deprecation-and-migration",
        description:
          "Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths",
        files: [],
        starters: [],
        source: {
          repository: "captured/deprecation-and-migration",
          path: "skills/deprecation-and-migration",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_deprecation-and-migration", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "documentation-and-adrs",
      displayName: "Documentation and ADRs",
      description:
        "Record architecture decisions and the reasoning behind them so" +
        "future engineers and agents can follow the code",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_documentation-and-adrs",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "documentation-and-adrs",
        description:
          "Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code",
        files: [],
        starters: [],
        source: {
          repository: "captured/documentation-and-adrs",
          path: "skills/documentation-and-adrs",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_documentation-and-adrs", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-workflow-and-versioning",
      displayName: "Git Workflow and Versioning",
      description:
        "Keep history clean with atomic commits, clear messages, trunk-based" +
        "branching, and sensible version bumps",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_git-workflow-and-versioning",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-workflow-and-versioning",
        description:
          "Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps",
        files: [],
        starters: [],
        source: {
          repository: "captured/git-workflow-and-versioning",
          path: "skills/git-workflow-and-versioning",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_git-workflow-and-versioning", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "spec-driven-development",
      displayName: "Spec-Driven Development",
      description:
        "Write a spec with objectives, scope, and success criteria before" +
        "coding, and split large work into a capability map",
      maker: { name: people.AddyOsmani.firstName },
      stars: 118400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_spec-driven-development",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "spec-driven-development",
        description:
          "Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map",
        files: [],
        starters: [],
        source: {
          repository: "captured/spec-driven-development",
          path: "skills/spec-driven-development",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_spec-driven-development", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "break-ui",
      displayName: "Break UI",
      description:
        "Stress-test a component with worst-case data like long names and" +
        "empty lists, and report each break with a fix",
      maker: { name: people.EmilKowalski.firstName },
      stars: 57500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_break-ui",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "break-ui",
        description:
          "Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix",
        files: [],
        starters: [],
        source: {
          repository: "captured/break-ui",
          path: "skills/break-ui",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_break-ui", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "emil-design-eng",
      displayName: "Design Engineering",
      description:
        "Apply a design engineer's approach to UI polish, component details," +
        "and when and how to animate",
      maker: { name: people.EmilKowalski.firstName },
      stars: 57500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_emil-design-eng",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "emil-design-eng",
        description:
          "Apply a design engineer's approach to UI polish, component details, and when and how to animate",
        files: [],
        starters: [],
        source: {
          repository: "captured/emil-design-eng",
          path: "skills/emil-design-eng",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_emil-design-eng", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "bash-defensive-patterns",
      displayName: "Defensive Bash",
      description:
        "Write robust shell scripts with strict mode, error traps, safe" +
        "quoting, and reliable cleanup",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_bash-defensive-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "bash-defensive-patterns",
        description:
          "Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup",
        files: [],
        starters: [],
        source: {
          repository: "captured/bash-defensive-patterns",
          path: "skills/bash-defensive-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_bash-defensive-patterns", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "changelog-automation",
      displayName: "Changelog Automation",
      description:
        "Generate changelogs and release notes from commits and pull requests" +
        "in Keep a Changelog format",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_changelog-automation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "changelog-automation",
        description:
          "Generate changelogs and release notes from commits and pull requests in Keep a Changelog format",
        files: [],
        starters: [],
        source: {
          repository: "captured/changelog-automation",
          path: "skills/changelog-automation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_changelog-automation", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dependency-upgrade",
      displayName: "Dependency Upgrade",
      description:
        "Plan major dependency upgrades with compatibility analysis, a staged" +
        "rollout, and testing",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dependency-upgrade",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dependency-upgrade",
        description:
          "Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing",
        files: [],
        starters: [],
        source: {
          repository: "captured/dependency-upgrade",
          path: "skills/dependency-upgrade",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dependency-upgrade", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "e2e-testing-patterns",
      displayName: "E2E Testing Patterns",
      description:
        "Build reliable end-to-end suites with Playwright or Cypress and" +
        "track down flaky tests",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_e2e-testing-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "e2e-testing-patterns",
        description:
          "Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests",
        files: [],
        starters: [],
        source: {
          repository: "captured/e2e-testing-patterns",
          path: "skills/e2e-testing-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_e2e-testing-patterns", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-advanced-workflows",
      displayName: "Advanced Git Workflows",
      description:
        "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog" +
        "to clean up history and recover from mistakes",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_git-advanced-workflows",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-advanced-workflows",
        description:
          "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes",
        files: [],
        starters: [],
        source: {
          repository: "captured/git-advanced-workflows",
          path: "skills/git-advanced-workflows",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_git-advanced-workflows", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postgresql-table-design",
      displayName: "PostgreSQL Table Design",
      description:
        "Design and review Postgres schemas: data types, constraints," +
        "indexing, partitioning, and common gotchas",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_postgresql-table-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postgresql-table-design",
        description:
          "Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas",
        files: [],
        starters: [],
        source: {
          repository: "captured/postgresql-table-design",
          path: "skills/postgresql-table-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_postgresql-table-design", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postmortem-writing",
      displayName: "Postmortem Writing",
      description:
        "Write blameless postmortems with timelines, root cause analysis, and" +
        "tracked action items",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_postmortem-writing",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postmortem-writing",
        description:
          "Write blameless postmortems with timelines, root cause analysis, and tracked action items",
        files: [],
        starters: [],
        source: {
          repository: "captured/postmortem-writing",
          path: "skills/postmortem-writing",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_postmortem-writing", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "python-testing-patterns",
      displayName: "Python Testing Patterns",
      description:
        "Build pytest suites with fixtures, parametrization, mocking, and a" +
        "test-driven workflow",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_python-testing-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "python-testing-patterns",
        description:
          "Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow",
        files: [],
        starters: [],
        source: {
          repository: "captured/python-testing-patterns",
          path: "skills/python-testing-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_python-testing-patterns", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sql-optimization-patterns",
      displayName: "SQL Optimization Patterns",
      description:
        "Speed up slow queries with EXPLAIN analysis, indexing strategy, and" +
        "proven rewrite patterns",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_sql-optimization-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sql-optimization-patterns",
        description:
          "Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns",
        files: [],
        starters: [],
        source: {
          repository: "captured/sql-optimization-patterns",
          path: "skills/sql-optimization-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_sql-optimization-patterns", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "typescript-advanced-types",
      displayName: "TypeScript Advanced Types",
      description:
        "Use generics, conditional and mapped types, and template literals to" +
        "build type-safe utilities",
      maker: { name: people.SethHobson.firstName },
      stars: 42600,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_typescript-advanced-types",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "typescript-advanced-types",
        description:
          "Use generics, conditional and mapped types, and template literals to build type-safe utilities",
        files: [],
        starters: [],
        source: {
          repository: "captured/typescript-advanced-types",
          path: "skills/typescript-advanced-types",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_typescript-advanced-types", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-cli-with-tokens",
      displayName: "Vercel CLI with Tokens",
      description:
        "Deploy and manage Vercel projects from the CLI with an access token" +
        "instead of an interactive login",
      maker: { name: people.Vercel.firstName },
      stars: 34200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-cli-with-tokens",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-cli-with-tokens",
        description:
          "Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-cli-with-tokens",
          path: "skills/vercel-cli-with-tokens",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-cli-with-tokens", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-composition-patterns",
      displayName: "React Composition Patterns",
      description:
        "Refactor boolean-prop sprawl into compound components, context" +
        "providers, and flexible component APIs, with React 19 changes",
      maker: { name: people.Vercel.firstName },
      stars: 34200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-composition-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-composition-patterns",
        description:
          "Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-composition-patterns",
          path: "skills/vercel-composition-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-composition-patterns", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-best-practices",
      displayName: "React Best Practices",
      description:
        "React and Next.js performance rules from Vercel Engineering, ranked" +
        "by impact from request waterfalls to micro-optimizations",
      maker: { name: people.Vercel.firstName },
      stars: 34200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-best-practices",
        description:
          "React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-react-best-practices",
          path: "skills/vercel-react-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-best-practices", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-native-skills",
      displayName: "React Native Best Practices",
      description:
        "Build fast React Native and Expo apps: list performance, animations," +
        "native modules, and platform-specific patterns",
      maker: { name: people.Vercel.firstName },
      stars: 34200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-native-skills",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-native-skills",
        description:
          "Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-react-native-skills",
          path: "skills/vercel-react-native-skills",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-native-skills", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-view-transitions",
      displayName: "React View Transitions",
      description:
        "Add page transitions, shared-element animations, and enter and exit" +
        "motion with React's ViewTransition component",
      maker: { name: people.Vercel.firstName },
      stars: 34200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-view-transitions",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-view-transitions",
        description:
          "Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-react-view-transitions",
          path: "skills/vercel-react-view-transitions",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-view-transitions", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "chatgpt-apps",
      displayName: "Apps SDK",
      description:
        "Build and debug OpenAI Apps SDK apps that pair an MCP server with a" +
        "widget UI",
      maker: { name: people.Openai.firstName },
      stars: 28800,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_chatgpt-apps",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "chatgpt-apps",
        description:
          "Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI",
        files: [],
        starters: [],
        source: {
          repository: "captured/chatgpt-apps",
          path: "skills/chatgpt-apps",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_chatgpt-apps", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cli-creator",
      displayName: "CLI Creator",
      description:
        "Build a composable command-line tool from API docs, an OpenAPI spec," +
        "curl examples, an SDK, or a script",
      maker: { name: people.Openai.firstName },
      stars: 28800,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cli-creator",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cli-creator",
        description:
          "Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script",
        files: [],
        starters: [],
        source: {
          repository: "captured/cli-creator",
          path: "skills/cli-creator",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cli-creator", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-best-practices",
      displayName: "Security Best Practices",
      description:
        "Review Python, JavaScript, TypeScript, and Go code against" +
        "framework-specific security practices and suggest fixes",
      maker: { name: people.Openai.firstName },
      stars: 28800,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_security-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-best-practices",
        description:
          "Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes",
        files: [],
        starters: [],
        source: {
          repository: "captured/security-best-practices",
          path: "skills/security-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_security-best-practices", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-ownership-map",
      displayName: "Security Ownership Map",
      description:
        "Map who owns security-sensitive code from git history, find orphaned" +
        "hotspots, and compute bus factor",
      maker: { name: people.Openai.firstName },
      stars: 28800,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_security-ownership-map",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-ownership-map",
        description:
          "Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor",
        files: [],
        starters: [],
        source: {
          repository: "captured/security-ownership-map",
          path: "skills/security-ownership-map",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_security-ownership-map", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-threat-model",
      displayName: "Security Threat Model",
      description:
        "Write a threat model grounded in the code: trust boundaries, assets," +
        "attacker paths, and mitigations",
      maker: { name: people.Openai.firstName },
      stars: 28800,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_security-threat-model",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-threat-model",
        description:
          "Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations",
        files: [],
        starters: [],
        source: {
          repository: "captured/security-threat-model",
          path: "skills/security-threat-model",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_security-threat-model", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloud-logging-query-generation",
      displayName: "Cloud Logging Queries",
      description:
        "Turn plain-language questions into Logging Query Language filters" +
        "for Cloud Logging when debugging on Google Cloud",
      maker: { name: people.GoogleCloud.firstName },
      stars: 24400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloud-logging-query-generation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloud-logging-query-generation",
        description:
          "Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloud-logging-query-generation",
          path: "skills/cloud-logging-query-generation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloud-logging-query-generation", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-iam-troubleshooting",
      displayName: "Google Cloud IAM Troubleshooting",
      description:
        "Diagnose and fix IAM access denials on Google Cloud, from capturing" +
        "the error context to a self-service remediation",
      maker: { name: people.GoogleCloud.firstName },
      stars: 24400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-iam-troubleshooting",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-iam-troubleshooting",
        description:
          "Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation",
        files: [],
        starters: [],
        source: {
          repository: "captured/google-cloud-iam-troubleshooting",
          path: "skills/google-cloud-iam-troubleshooting",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_google-cloud-iam-troubleshooting",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-run-basics",
      displayName: "Cloud Run",
      description:
        "Deploy and manage Cloud Run services, jobs, and worker pools for" +
        "HTTP apps, scheduled tasks, and background processing",
      maker: { name: people.GoogleCloud.firstName },
      stars: 24400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-run-basics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-run-basics",
        description:
          "Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing",
        files: [],
        starters: [],
        source: {
          repository: "captured/google-cloud-run-basics",
          path: "skills/google-cloud-run-basics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_google-cloud-run-basics", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agent-tool-design",
      displayName: "Agent Tool Design",
      description:
        "Write tool descriptions, schemas, and error messages that agents can" +
        "route on and recover from",
      maker: { name: people.MuratCanKoylan.firstName },
      stars: 18400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_agent-tool-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agent-tool-design",
        description:
          "Write tool descriptions, schemas, and error messages that agents can route on and recover from",
        files: [],
        starters: [],
        source: {
          repository: "captured/agent-tool-design",
          path: "skills/agent-tool-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_agent-tool-design", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "context-compression",
      displayName: "Context Compression",
      description:
        "Compress long agent sessions into structured summaries that keep" +
        "files, decisions, and next steps",
      maker: { name: people.MuratCanKoylan.firstName },
      stars: 18400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_context-compression",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "context-compression",
        description:
          "Compress long agent sessions into structured summaries that keep files, decisions, and next steps",
        files: [],
        starters: [],
        source: {
          repository: "captured/context-compression",
          path: "skills/context-compression",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_context-compression", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agentic-actions-auditor",
      displayName: "Agentic Actions Auditor",
      description:
        "Audit GitHub Actions workflows for attacks that reach AI agents" +
        "running in CI, such as expression injection",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_agentic-actions-auditor",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agentic-actions-auditor",
        description:
          "Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection",
        files: [],
        starters: [],
        source: {
          repository: "captured/agentic-actions-auditor",
          path: "skills/agentic-actions-auditor",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_agentic-actions-auditor", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "audit-context-building",
      displayName: "Audit Context Building",
      description:
        "Build a deep understanding of unfamiliar code, what each function" +
        "assumes and guarantees, before hunting for bugs",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_audit-context-building",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "audit-context-building",
        description:
          "Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs",
        files: [],
        starters: [],
        source: {
          repository: "captured/audit-context-building",
          path: "skills/audit-context-building",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_audit-context-building", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "differential-review",
      displayName: "Differential Security Review",
      description:
        "Review a PR or diff for security bugs, using git history, blast" +
        "radius, and test coverage to set the depth",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_differential-review",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "differential-review",
        description:
          "Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth",
        files: [],
        starters: [],
        source: {
          repository: "captured/differential-review",
          path: "skills/differential-review",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_differential-review", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "fp-check",
      displayName: "False Positive Check",
      description:
        "Verify a suspected vulnerability with documented evidence and return" +
        "a true or false positive verdict",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_fp-check",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "fp-check",
        description:
          "Verify a suspected vulnerability with documented evidence and return a true or false positive verdict",
        files: [],
        starters: [],
        source: {
          repository: "captured/fp-check",
          path: "skills/fp-check",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_fp-check", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "modern-python",
      displayName: "Modern Python Tooling",
      description:
        "Set up Python projects with uv, ruff, and ty, and migrate from pip," +
        "Poetry, mypy, and black",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_modern-python",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "modern-python",
        description:
          "Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black",
        files: [],
        starters: [],
        source: {
          repository: "captured/modern-python",
          path: "skills/modern-python",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_modern-python", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mutation-testing",
      displayName: "Mutation Testing",
      description:
        "Run mutation campaigns, analyze surviving mutants, and find bugs" +
        "hiding behind weak tests",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mutation-testing",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mutation-testing",
        description:
          "Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests",
        files: [],
        starters: [],
        source: {
          repository: "captured/mutation-testing",
          path: "skills/mutation-testing",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mutation-testing", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "property-based-testing",
      displayName: "Property-Based Testing",
      description:
        "Write and debug property-based tests with Hypothesis, fast-check," +
        "proptest, and similar tools to cover whole input domains",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_property-based-testing",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "property-based-testing",
        description:
          "Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains",
        files: [],
        starters: [],
        source: {
          repository: "captured/property-based-testing",
          path: "skills/property-based-testing",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_property-based-testing", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sharp-edges",
      displayName: "Sharp Edges",
      description:
        "Find error-prone APIs, risky defaults, and footgun designs that lead" +
        "to security mistakes",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_sharp-edges",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sharp-edges",
        description:
          "Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes",
        files: [],
        starters: [],
        source: {
          repository: "captured/sharp-edges",
          path: "skills/sharp-edges",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sharp-edges", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supply-chain-risk-auditor",
      displayName: "Supply Chain Risk Auditor",
      description:
        "Audit dependencies for known advisories, abandoned upstreams," +
        "publisher concentration, and install-time scripts",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_supply-chain-risk-auditor",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supply-chain-risk-auditor",
        description:
          "Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts",
        files: [],
        starters: [],
        source: {
          repository: "captured/supply-chain-risk-auditor",
          path: "skills/supply-chain-risk-auditor",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_supply-chain-risk-auditor", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-codeql",
      displayName: "CodeQL Scan",
      description:
        "Build a CodeQL database and run data flow and taint analysis to find" +
        "vulnerabilities across many languages",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-codeql",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-codeql",
        description:
          "Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages",
        files: [],
        starters: [],
        source: {
          repository: "captured/trailofbits-codeql",
          path: "skills/trailofbits-codeql",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-codeql", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-semgrep",
      displayName: "Semgrep Scan",
      description:
        "Run a Semgrep security scan with the rulesets that fit the project" +
        "and merge the results into SARIF",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-semgrep",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-semgrep",
        description:
          "Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF",
        files: [],
        starters: [],
        source: {
          repository: "captured/trailofbits-semgrep",
          path: "skills/trailofbits-semgrep",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-semgrep", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "variant-analysis",
      displayName: "Variant Analysis",
      description:
        "After a bug turns up, hunt the other instances of the same root" +
        "cause across the codebase and turn it into a query",
      maker: { name: people.TrailOfBits.firstName },
      stars: 8200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_variant-analysis",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "variant-analysis",
        description:
          "After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query",
        files: [],
        starters: [],
        source: {
          repository: "captured/variant-analysis",
          path: "skills/variant-analysis",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_variant-analysis", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "analyzing-dotnet-performance",
      displayName: ".NET Performance Anti-Patterns",
      description:
        "Scan .NET code for about 50 performance anti-patterns across async," +
        "memory, strings, LINQ, regex, and I/O, ranked by severity",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_analyzing-dotnet-performance",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "analyzing-dotnet-performance",
        description:
          "Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity",
        files: [],
        starters: [],
        source: {
          repository: "captured/analyzing-dotnet-performance",
          path: "skills/analyzing-dotnet-performance",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_analyzing-dotnet-performance", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-coverage-analysis",
      displayName: ".NET Coverage Analysis",
      description:
        "Read .NET coverage reports to find partial branches, plateaus, and" +
        "high-risk CRAP scores, then plan the tests that close them",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dotnet-coverage-analysis",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-coverage-analysis",
        description:
          "Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them",
        files: [],
        starters: [],
        source: {
          repository: "captured/dotnet-coverage-analysis",
          path: "skills/dotnet-coverage-analysis",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-coverage-analysis", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-microbenchmarking",
      displayName: "BenchmarkDotNet",
      description:
        "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the" +
        "setup mistakes that produce misleading numbers",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dotnet-microbenchmarking",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-microbenchmarking",
        description:
          "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers",
        files: [],
        starters: [],
        source: {
          repository: "captured/dotnet-microbenchmarking",
          path: "skills/dotnet-microbenchmarking",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-microbenchmarking", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-migrate-nullable-references",
      displayName: "Nullable Reference Migration",
      description:
        "Enable nullable reference types in a C# project and work through the" +
        "warnings project by project or file by file",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dotnet-migrate-nullable-references",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-migrate-nullable-references",
        description:
          "Enable nullable reference types in a C# project and work through the warnings project by project or file by file",
        files: [],
        starters: [],
        source: {
          repository: "captured/dotnet-migrate-nullable-references",
          path: "skills/dotnet-migrate-nullable-references",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_dotnet-migrate-nullable-references",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-test-anti-patterns",
      displayName: ".NET Test Anti-Patterns",
      description:
        "Audit a .NET test file or suite for anti-patterns and get a" +
        "severity-ranked report of what makes tests flaky or worthless",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dotnet-test-anti-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-test-anti-patterns",
        description:
          "Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless",
        files: [],
        starters: [],
        source: {
          repository: "captured/dotnet-test-anti-patterns",
          path: "skills/dotnet-test-anti-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-test-anti-patterns", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "migrate-xunit-to-xunit-v3",
      displayName: "xUnit v3 Migration",
      description:
        "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the" +
        "breaking changes",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_migrate-xunit-to-xunit-v3",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "migrate-xunit-to-xunit-v3",
        description:
          "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes",
        files: [],
        starters: [],
        source: {
          repository: "captured/migrate-xunit-to-xunit-v3",
          path: "skills/migrate-xunit-to-xunit-v3",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_migrate-xunit-to-xunit-v3", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "msbuild-antipatterns",
      displayName: "MSBuild Antipatterns",
      description:
        "Review MSBuild project, props, and targets files against a catalog" +
        "of antipatterns and get a prioritized list of fixes",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_msbuild-antipatterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "msbuild-antipatterns",
        description:
          "Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes",
        files: [],
        starters: [],
        source: {
          repository: "captured/msbuild-antipatterns",
          path: "skills/msbuild-antipatterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_msbuild-antipatterns", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "optimizing-ef-core-queries",
      displayName: "EF Core Query Optimization",
      description:
        "Make slow Entity Framework Core queries generate less SQL, use fewer" +
        "round-trips, and return results faster",
      maker: { name: people.Net.firstName },
      stars: 6200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_optimizing-ef-core-queries",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "optimizing-ef-core-queries",
        description:
          "Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster",
        files: [],
        starters: [],
        source: {
          repository: "captured/optimizing-ef-core-queries",
          path: "skills/optimizing-ef-core-queries",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_optimizing-ef-core-queries", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "gemini-api-dev",
      displayName: "Gemini API",
      description:
        "Write code that calls the Gemini API for text, chat, multimodal" +
        "input, image and speech generation, and function calling",
      maker: { name: people.Google.firstName },
      stars: 4500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_gemini-api-dev",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "gemini-api-dev",
        description:
          "Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling",
        files: [],
        starters: [],
        source: {
          repository: "captured/gemini-api-dev",
          path: "skills/gemini-api-dev",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_gemini-api-dev", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-update",
      displayName: "EAS Update",
      description:
        "Configure over-the-air JavaScript updates with EAS Update, channels," +
        "branches, and runtime versions",
      maker: { name: people.Expo.firstName },
      stars: 4200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_eas-update",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-update",
        description:
          "Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions",
        files: [],
        starters: [],
        source: {
          repository: "captured/eas-update",
          path: "skills/eas-update",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-update", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-workflows",
      displayName: "EAS Workflows",
      description:
        "Write EAS workflow YAML for Expo builds, tests, submissions, and" +
        "deployment pipelines",
      maker: { name: people.Expo.firstName },
      stars: 4200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_eas-workflows",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-workflows",
        description:
          "Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines",
        files: [],
        starters: [],
        source: {
          repository: "captured/eas-workflows",
          path: "skills/eas-workflows",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-workflows", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-native-ui",
      displayName: "Expo Native UI",
      description:
        "Make Expo screens feel native with platform styling, semantic" +
        "colors, SF Symbols, native controls, and responsive layout",
      maker: { name: people.Expo.firstName },
      stars: 4200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_expo-native-ui",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-native-ui",
        description:
          "Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout",
        files: [],
        starters: [],
        source: {
          repository: "captured/expo-native-ui",
          path: "skills/expo-native-ui",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-native-ui", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-router",
      displayName: "Expo Router",
      description:
        "Build navigation in Expo apps with file-based routes, native stacks" +
        "and tabs, modals, headers, and link previews",
      maker: { name: people.Expo.firstName },
      stars: 4200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_expo-router",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-router",
        description:
          "Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews",
        files: [],
        starters: [],
        source: {
          repository: "captured/expo-router",
          path: "skills/expo-router",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-router", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "amazon-dynamodb",
      displayName: "Amazon DynamoDB",
      description:
        "Design, review, and debug DynamoDB data layers by listing access" +
        "patterns first, then modeling keys and indexes to fit",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_amazon-dynamodb",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "amazon-dynamodb",
        description:
          "Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit",
        files: [],
        starters: [],
        source: {
          repository: "captured/amazon-dynamodb",
          path: "skills/amazon-dynamodb",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_amazon-dynamodb", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cdk",
      displayName: "AWS CDK",
      description:
        "Author, deploy, and troubleshoot AWS infrastructure with CDK in" +
        "TypeScript or Python: stack layout, constructs, and bootstrapping",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_aws-cdk",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cdk",
        description:
          "Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping",
        files: [],
        starters: [],
        source: {
          repository: "captured/aws-cdk",
          path: "skills/aws-cdk",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cdk", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cloudformation",
      displayName: "AWS CloudFormation",
      description:
        "Author, validate, and troubleshoot CloudFormation templates, from" +
        "resource definitions to failed stack updates",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_aws-cloudformation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cloudformation",
        description:
          "Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates",
        files: [],
        starters: [],
        source: {
          repository: "captured/aws-cloudformation",
          path: "skills/aws-cloudformation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cloudformation", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-iam",
      displayName: "AWS IAM",
      description:
        "Get IAM right: policy evaluation, trust policies, STS limits, and" +
        "workflows for role management and least-privilege policies",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_aws-iam",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-iam",
        description:
          "Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies",
        files: [],
        starters: [],
        source: {
          repository: "captured/aws-iam",
          path: "skills/aws-iam",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-iam", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "debugging-lambda-timeouts",
      displayName: "Debugging Lambda Timeouts",
      description:
        "Find why an AWS Lambda function times out by checking configuration," +
        "logs, metrics, networking, cold starts, and dependencies",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_debugging-lambda-timeouts",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "debugging-lambda-timeouts",
        description:
          "Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies",
        files: [],
        starters: [],
        source: {
          repository: "captured/debugging-lambda-timeouts",
          path: "skills/debugging-lambda-timeouts",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_debugging-lambda-timeouts", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "securing-s3-buckets",
      displayName: "Securing S3 Buckets",
      description:
        "Create and secure S3 buckets: access control, encryption, logging," +
        "and fixes for common misconfigurations",
      maker: { name: people.Aws.firstName },
      stars: 3500,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_securing-s3-buckets",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "securing-s3-buckets",
        description:
          "Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations",
        files: [],
        starters: [],
        source: {
          repository: "captured/securing-s3-buckets",
          path: "skills/securing-s3-buckets",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_securing-s3-buckets", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-agents-sdk",
      displayName: "Cloudflare Agents SDK",
      description:
        "Build, debug, and review applications on the Cloudflare Agents SDK:" +
        "stateful agents, tools, scheduling, and chat",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-agents-sdk",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-agents-sdk",
        description:
          "Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloudflare-agents-sdk",
          path: "skills/cloudflare-agents-sdk",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-agents-sdk", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-durable-objects",
      displayName: "Durable Objects",
      description:
        "Build, debug, and review Cloudflare Durable Objects for persistent" +
        "state, coordination, and real-time workloads",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-durable-objects",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-durable-objects",
        description:
          "Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloudflare-durable-objects",
          path: "skills/cloudflare-durable-objects",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-durable-objects", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-email-service",
      displayName: "Cloudflare Email Service",
      description:
        "Implement and troubleshoot Cloudflare Email Sending and Email" +
        "Routing, including delivery configuration",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-email-service",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-email-service",
        description:
          "Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloudflare-email-service",
          path: "skills/cloudflare-email-service",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-email-service", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-web-perf",
      displayName: "Web Performance Audit",
      description:
        "Audit and fix website loading and interaction performance, Core Web" +
        "Vitals, and Lighthouse scores",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-web-perf",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-web-perf",
        description:
          "Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloudflare-web-perf",
          path: "skills/cloudflare-web-perf",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-web-perf", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-workers-best-practices",
      displayName: "Workers Best Practices",
      description:
        "Write and review production Cloudflare Workers: compatibility dates," +
        "bindings, observability, streaming, and runtime patterns",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-workers-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-workers-best-practices",
        description:
          "Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns",
        files: [],
        starters: [],
        source: {
          repository: "captured/cloudflare-workers-best-practices",
          path: "skills/cloudflare-workers-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_cloudflare-workers-best-practices",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "wrangler",
      displayName: "Wrangler",
      description:
        "Run and troubleshoot Wrangler commands and configure Worker projects" +
        "for local development, previews, and deployment",
      maker: { name: people.Cloudflare.firstName },
      stars: 3400,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_wrangler",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "wrangler",
        description:
          "Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment",
        files: [],
        starters: [],
        source: {
          repository: "captured/wrangler",
          path: "skills/wrangler",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_wrangler", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-cost-optimization",
      displayName: "Azure Cost Optimization",
      description:
        "Find idle and orphaned Azure resources, rightsize workloads, and" +
        "review Reservation and Savings Plan coverage",
      maker: { name: people.Microsoft.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_azure-cost-optimization",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-cost-optimization",
        description:
          "Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage",
        files: [],
        starters: [],
        source: {
          repository: "captured/azure-cost-optimization",
          path: "skills/azure-cost-optimization",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_azure-cost-optimization", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-diagnostics",
      displayName: "Azure Diagnostics",
      description:
        "Debug Azure production issues in App Service, Container Apps, and" +
        "Functions with Azure Monitor, AppLens, and resource health",
      maker: { name: people.Microsoft.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_azure-diagnostics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-diagnostics",
        description:
          "Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health",
        files: [],
        starters: [],
        source: {
          repository: "captured/azure-diagnostics",
          path: "skills/azure-diagnostics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_azure-diagnostics", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deep-wiki-onboarding",
      displayName: "Codebase Onboarding Guides",
      description:
        "Generate onboarding guides for a codebase tailored to contributors," +
        "staff engineers, executives, and product managers",
      maker: { name: people.Microsoft.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_deep-wiki-onboarding",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deep-wiki-onboarding",
        description:
          "Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers",
        files: [],
        starters: [],
        source: {
          repository: "captured/deep-wiki-onboarding",
          path: "skills/deep-wiki-onboarding",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_deep-wiki-onboarding", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "entra-app-registration",
      displayName: "Entra App Registration",
      description:
        "Register Microsoft Entra ID apps, configure OAuth 2.0 and API" +
        "permissions, and wire up MSAL sign-in",
      maker: { name: people.Microsoft.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_entra-app-registration",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "entra-app-registration",
        description:
          "Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in",
        files: [],
        starters: [],
        source: {
          repository: "captured/entra-app-registration",
          path: "skills/entra-app-registration",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_entra-app-registration", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kql",
      displayName: "Kusto Query Language",
      description:
        "Write correct, efficient KQL queries and avoid the syntax gotchas in" +
        "joins, dynamic types, datetimes, regex, and result sizes",
      maker: { name: people.Microsoft.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_kql",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kql",
        description:
          "Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes",
        files: [],
        starters: [],
        source: {
          repository: "captured/kql",
          path: "skills/kql",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kql", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-add-unit-test",
      displayName: "Dart Unit Tests",
      description:
        "Write and organize Dart unit tests for functions, methods, and" +
        "classes with package:test",
      maker: { name: people.Flutter.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dart-add-unit-test",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-add-unit-test",
        description:
          "Write and organize Dart unit tests for functions, methods, and classes with package:test",
        files: [],
        starters: [],
        source: {
          repository: "captured/dart-add-unit-test",
          path: "skills/dart-add-unit-test",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dart-add-unit-test", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-use-pattern-matching",
      displayName: "Dart Pattern Matching",
      description:
        "Apply Dart 3 pattern matching, switch expressions, and destructuring" +
        "to replace verbose type checks and casts",
      maker: { name: people.Flutter.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dart-use-pattern-matching",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-use-pattern-matching",
        description:
          "Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts",
        files: [],
        starters: [],
        source: {
          repository: "captured/dart-use-pattern-matching",
          path: "skills/dart-use-pattern-matching",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dart-use-pattern-matching", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-add-widget-test",
      displayName: "Flutter Widget Tests",
      description:
        "Write component-level Flutter tests with WidgetTester to check" +
        "rendering, taps, scrolling, and text entry",
      maker: { name: people.Flutter.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_flutter-add-widget-test",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-add-widget-test",
        description:
          "Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry",
        files: [],
        starters: [],
        source: {
          repository: "captured/flutter-add-widget-test",
          path: "skills/flutter-add-widget-test",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-add-widget-test", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-apply-architecture-best-practices",
      displayName: "Flutter App Architecture",
      description:
        "Structure a Flutter app in UI, logic, and data layers, for a new" +
        "project or a refactor toward scale",
      maker: { name: people.Flutter.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_flutter-apply-architecture-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-apply-architecture-best-practices",
        description:
          "Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale",
        files: [],
        starters: [],
        source: {
          repository: "captured/flutter-apply-architecture-best-practices",
          path: "skills/flutter-apply-architecture-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_flutter-apply-architecture-best-practices",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-fix-layout-issues",
      displayName: "Flutter Layout Fixes",
      description:
        "Fix Flutter layout errors such as RenderFlex overflows and unbounded" +
        "constraints by finding the cause in the widget tree",
      maker: { name: people.Flutter.firstName },
      stars: 3200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_flutter-fix-layout-issues",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-fix-layout-issues",
        description:
          "Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree",
        files: [],
        starters: [],
        source: {
          repository: "captured/flutter-fix-layout-issues",
          path: "skills/flutter-fix-layout-issues",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-fix-layout-issues", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase",
      displayName: "Supabase",
      description:
        "Build on Supabase with the right client setup for auth, database," +
        "storage, edge functions, and realtime",
      maker: { name: people.Supabase.firstName },
      stars: 3100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_supabase",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase",
        description:
          "Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime",
        files: [],
        starters: [],
        source: {
          repository: "captured/supabase",
          path: "skills/supabase",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_supabase", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase-postgres-best-practices",
      displayName: "Supabase Postgres Best Practices",
      description:
        "Design Postgres schemas, migrations, RLS policies, and queries that" +
        "follow Supabase's maintained best practices",
      maker: { name: people.Supabase.firstName },
      stars: 3100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_supabase-postgres-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase-postgres-best-practices",
        description:
          "Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices",
        files: [],
        starters: [],
        source: {
          repository: "captured/supabase-postgres-best-practices",
          path: "skills/supabase-postgres-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_supabase-postgres-best-practices",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "stripe-best-practices",
      displayName: "Stripe Best Practices",
      description:
        "Choose the right Stripe APIs for payments, billing, and Connect, and" +
        "avoid common integration mistakes",
      maker: { name: people.Stripe.firstName },
      stars: 2100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_stripe-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "stripe-best-practices",
        description:
          "Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes",
        files: [],
        starters: [],
        source: {
          repository: "captured/stripe-best-practices",
          path: "skills/stripe-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_stripe-best-practices", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrade-stripe",
      displayName: "Upgrade Stripe",
      description:
        "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs," +
        "and webhook endpoints without breaking payments",
      maker: { name: people.Stripe.firstName },
      stars: 2100,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_upgrade-stripe",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrade-stripe",
        description:
          "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments",
        files: [],
        starters: [],
        source: {
          repository: "captured/upgrade-stripe",
          path: "skills/upgrade-stripe",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upgrade-stripe", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-navigation",
      displayName: "React Navigation",
      description:
        "Build navigation UIs with React Navigation: stacks, tabs, drawers," +
        "headers, bottom sheets, and safe area handling",
      maker: { name: people.Callstack.firstName },
      stars: 1700,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_react-navigation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-navigation",
        description:
          "Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling",
        files: [],
        starters: [],
        source: {
          repository: "captured/react-navigation",
          path: "skills/react-navigation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-navigation", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrading-react-native",
      displayName: "Upgrading React Native",
      description:
        "Upgrade a React Native app across versions with template diffs," +
        "dependency bumps, native config changes, and fixes for breaking APIs",
      maker: { name: people.Callstack.firstName },
      stars: 1700,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_upgrading-react-native",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrading-react-native",
        description:
          "Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs",
        files: [],
        starters: [],
        source: {
          repository: "captured/upgrading-react-native",
          path: "skills/upgrading-react-native",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_upgrading-react-native", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-iterate-pr",
      displayName: "Iterate on Pull Requests",
      description:
        "Work a pull request until its actionable CI failures pass and the" +
        "high and medium review feedback is addressed",
      maker: { name: people.Sentry.firstName },
      stars: 1200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_sentry-iterate-pr",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-iterate-pr",
        description:
          "Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed",
        files: [],
        starters: [],
        source: {
          repository: "captured/sentry-iterate-pr",
          path: "skills/sentry-iterate-pr",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-iterate-pr", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-stacks",
      displayName: "Terraform Stacks",
      description:
        "Build and validate HashiCorp Terraform Stacks, including components," +
        "deployments, and orchestration rules",
      maker: { name: people.Hashicorp.firstName },
      stars: 931,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_terraform-stacks",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-stacks",
        description:
          "Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules",
        files: [],
        starters: [],
        source: {
          repository: "captured/terraform-stacks",
          path: "skills/terraform-stacks",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-stacks", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-style-guide",
      displayName: "Terraform Style Guide",
      description:
        "Write Terraform HCL that follows HashiCorp's style conventions for" +
        "layout, naming, variables, and resources",
      maker: { name: people.Hashicorp.firstName },
      stars: 931,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_terraform-style-guide",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-style-guide",
        description:
          "Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources",
        files: [],
        starters: [],
        source: {
          repository: "captured/terraform-style-guide",
          path: "skills/terraform-style-guide",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-style-guide", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-test",
      displayName: "Terraform Test",
      description:
        "Write and run Terraform tests with .tftest.hcl files, mocks, and" +
        "assertions for modules and configurations",
      maker: { name: people.Hashicorp.firstName },
      stars: 931,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_terraform-test",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-test",
        description:
          "Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations",
        files: [],
        starters: [],
        source: {
          repository: "captured/terraform-test",
          path: "skills/terraform-test",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-test", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-developer",
      displayName: "Angular Developer",
      description:
        "Write modern Angular: signals, forms, dependency injection, routing," +
        "SSR, accessibility, animations, and testing",
      maker: { name: people.Angular.firstName },
      stars: 728,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_angular-developer",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-developer",
        description:
          "Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing",
        files: [],
        starters: [],
        source: {
          repository: "captured/angular-developer",
          path: "skills/angular-developer",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-developer", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-new-app",
      displayName: "Angular New App",
      description:
        "Create a new Angular app with the Angular CLI and modern defaults" +
        "for structure, tooling, and styling",
      maker: { name: people.Angular.firstName },
      stars: 728,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_angular-new-app",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-new-app",
        description:
          "Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling",
        files: [],
        starters: [],
        source: {
          repository: "captured/angular-new-app",
          path: "skills/angular-new-app",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-new-app", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-esql",
      displayName: "Elasticsearch ES|QL",
      description:
        "Write and run ES|QL queries against Elasticsearch for exploration," +
        "aggregation, and joins",
      maker: { name: people.Elastic.firstName },
      stars: 608,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-esql",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-esql",
        description:
          "Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins",
        files: [],
        starters: [],
        source: {
          repository: "captured/elasticsearch-esql",
          path: "skills/elasticsearch-esql",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_elasticsearch-esql", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-index-design",
      displayName: "Elasticsearch Index Design",
      description:
        "Design Elasticsearch mappings for your access patterns: field types," +
        "multi-fields, doc values, and shard settings",
      maker: { name: people.Elastic.firstName },
      stars: 608,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-index-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-index-design",
        description:
          "Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings",
        files: [],
        starters: [],
        source: {
          repository: "captured/elasticsearch-index-design",
          path: "skills/elasticsearch-index-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_elasticsearch-index-design", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-architecture-advisor",
      displayName: "ClickHouse Architecture Advisor",
      description:
        "Choose ingestion and data modeling patterns for ClickHouse and turn" +
        "best practices into a design for your workload",
      maker: { name: people.Clickhouse.firstName },
      stars: 570,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-architecture-advisor",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-architecture-advisor",
        description:
          "Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload",
        files: [],
        starters: [],
        source: {
          repository: "captured/clickhouse-architecture-advisor",
          path: "skills/clickhouse-architecture-advisor",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-architecture-advisor", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-best-practices",
      displayName: "ClickHouse Best Practices",
      description:
        "Review ClickHouse schemas, queries, and settings against 31 rules" +
        "covering keys, types, partitioning, and inserts",
      maker: { name: people.Clickhouse.firstName },
      stars: 570,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-best-practices",
        description:
          "Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts",
        files: [],
        starters: [],
        source: {
          repository: "captured/clickhouse-best-practices",
          path: "skills/clickhouse-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-best-practices", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-auth-basics",
      displayName: "Firebase Authentication",
      description:
        "Set up Firebase Authentication for sign-in, user management, and" +
        "secure data access with auth rules",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-auth-basics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-auth-basics",
        description:
          "Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-auth-basics",
          path: "skills/firebase-auth-basics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-auth-basics", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-basics",
      displayName: "Firebase Basics",
      description:
        "Set up the Firebase CLI, sign in, create or select a project, and" +
        "download app config files",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-basics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-basics",
        description:
          "Set up the Firebase CLI, sign in, create or select a project, and download app config files",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-basics",
          path: "skills/firebase-basics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-basics", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-crashlytics",
      displayName: "Firebase Crashlytics",
      description:
        "Set up Firebase Crashlytics, add the SDK to mobile apps, and read" +
        "crash reports to find and fix their causes",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-crashlytics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-crashlytics",
        description:
          "Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-crashlytics",
          path: "skills/firebase-crashlytics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-crashlytics", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-firestore",
      displayName: "Cloud Firestore",
      description:
        "Set up and manage Cloud Firestore: data modeling, indexes, security" +
        "rules, queries, and SDK integration",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-firestore",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-firestore",
        description:
          "Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-firestore",
          path: "skills/firebase-firestore",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-firestore", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-hosting-basics",
      displayName: "Firebase Hosting",
      description:
        "Deploy static sites and single-page apps to Firebase Hosting with" +
        "redirects, rewrites, headers, and preview channels",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-hosting-basics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-hosting-basics",
        description:
          "Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-hosting-basics",
          path: "skills/firebase-hosting-basics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-hosting-basics", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-security-rules-auditor",
      displayName: "Firebase Security Rules Auditor",
      description:
        "Audit Firestore and Cloud Storage security rules for privilege" +
        "escalation, role bypasses, and unchecked writes",
      maker: { name: people.Firebase.firstName },
      stars: 517,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firebase-security-rules-auditor",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-security-rules-auditor",
        description:
          "Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes",
        files: [],
        starters: [],
        source: {
          repository: "captured/firebase-security-rules-auditor",
          path: "skills/firebase-security-rules-auditor",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-security-rules-auditor", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "tavily-best-practices",
      displayName: "Tavily Best Practices",
      description:
        "Add web search, content extraction, crawling, and research to apps" +
        "and agents with production-ready Tavily integrations",
      maker: { name: people.Tavily.firstName },
      stars: 492,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_tavily-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "tavily-best-practices",
        description:
          "Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations",
        files: [],
        starters: [],
        source: {
          repository: "captured/tavily-best-practices",
          path: "skills/tavily-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_tavily-best-practices", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-code-writer",
      displayName: "Svelte Docs and Code Analysis",
      description:
        "Look up Svelte 5 docs and analyze Svelte components and modules from" +
        "the command line while you write them",
      maker: { name: people.Svelte.firstName },
      stars: 342,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_svelte-code-writer",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-code-writer",
        description:
          "Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them",
        files: [],
        starters: [],
        source: {
          repository: "captured/svelte-code-writer",
          path: "skills/svelte-code-writer",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_svelte-code-writer", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-core-bestpractices",
      displayName: "Svelte Best Practices",
      description:
        "Write fast, robust, modern Svelte 5: runes, reactivity, events," +
        "styling, and library integration",
      maker: { name: people.Svelte.firstName },
      stars: 342,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_svelte-core-bestpractices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-core-bestpractices",
        description:
          "Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration",
        files: [],
        starters: [],
        source: {
          repository: "captured/svelte-core-bestpractices",
          path: "skills/svelte-core-bestpractices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_svelte-core-bestpractices", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "use-railway",
      displayName: "Railway",
      description:
        "Deploy and operate apps on Railway: projects, services, databases," +
        "environments, domains, and troubleshooting",
      maker: { name: people.Railway.firstName },
      stars: 342,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_use-railway",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "use-railway",
        description:
          "Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting",
        files: [],
        starters: [],
        source: {
          repository: "captured/use-railway",
          path: "skills/use-railway",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_use-railway", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "k6",
      displayName: "k6 Load Testing",
      description:
        "Generate, validate, and review k6 load, stress, and spike test" +
        "scripts, and run them against your service",
      maker: { name: people.GrafanaLabs.firstName },
      stars: 313,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_k6",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "k6",
        description:
          "Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service",
        files: [],
        starters: [],
        source: {
          repository: "captured/k6",
          path: "skills/k6",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_k6", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "promql",
      displayName: "PromQL",
      description:
        "Write, validate, and optimize PromQL for Prometheus and Grafana" +
        "Mimir dashboards and alerts",
      maker: { name: people.GrafanaLabs.firstName },
      stars: 313,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_promql",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "promql",
        description:
          "Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts",
        files: [],
        starters: [],
        source: {
          repository: "captured/promql",
          path: "skills/promql",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_promql", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-instrument",
      displayName: "Sentry Instrument",
      description:
        "Add Sentry to an app and wire up errors, tracing, logs, metrics," +
        "replay, and AI monitoring for its platform",
      maker: { name: people.Sentry.firstName },
      stars: 278,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_sentry-instrument",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-instrument",
        description:
          "Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform",
        files: [],
        starters: [],
        source: {
          repository: "captured/sentry-instrument",
          path: "skills/sentry-instrument",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-instrument", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-setup-releases",
      displayName: "Sentry Releases",
      description:
        "Set up Sentry releases and deploy tracking so each issue links to" +
        "the release and commit that introduced it",
      maker: { name: people.Sentry.firstName },
      stars: 278,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_sentry-setup-releases",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-setup-releases",
        description:
          "Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it",
        files: [],
        starters: [],
        source: {
          repository: "captured/sentry-setup-releases",
          path: "skills/sentry-setup-releases",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-setup-releases", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-email",
      displayName: "React Email",
      description:
        "Build HTML email templates with React Email components and render or" +
        "send them with Resend",
      maker: { name: people.Resend.firstName },
      stars: 211,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_react-email",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-email",
        description:
          "Build HTML email templates with React Email components and render or send them with Resend",
        files: [],
        starters: [],
        source: {
          repository: "captured/react-email",
          path: "skills/react-email",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-email", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "resend",
      displayName: "Resend",
      description:
        "Send, receive, and track email with the Resend API: templates," +
        "domains, webhooks, contacts, and broadcasts",
      maker: { name: people.Resend.firstName },
      stars: 211,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_resend",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "resend",
        description:
          "Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts",
        files: [],
        starters: [],
        source: {
          repository: "captured/resend",
          path: "skills/resend",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_resend", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-connection",
      displayName: "MongoDB Connection Tuning",
      description:
        "Configure MongoDB client pools, timeouts, and connection patterns" +
        "for any driver and diagnose connection errors",
      maker: { name: people.Mongodb.firstName },
      stars: 200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mongodb-connection",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-connection",
        description:
          "Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors",
        files: [],
        starters: [],
        source: {
          repository: "captured/mongodb-connection",
          path: "skills/mongodb-connection",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-connection", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-query-optimizer",
      displayName: "MongoDB Query Optimizer",
      description:
        "Find why a MongoDB query is slow and fix it with the right indexes" +
        "and query shape",
      maker: { name: people.Mongodb.firstName },
      stars: 200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mongodb-query-optimizer",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-query-optimizer",
        description:
          "Find why a MongoDB query is slow and fix it with the right indexes and query shape",
        files: [],
        starters: [],
        source: {
          repository: "captured/mongodb-query-optimizer",
          path: "skills/mongodb-query-optimizer",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mongodb-query-optimizer", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-schema-design",
      displayName: "MongoDB Schema Design",
      description:
        "Design MongoDB data models and review existing ones for unbounded" +
        "arrays, bad embeds, and other schema anti-patterns",
      maker: { name: people.Mongodb.firstName },
      stars: 200,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_mongodb-schema-design",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-schema-design",
        description:
          "Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns",
        files: [],
        starters: [],
        source: {
          repository: "captured/mongodb-schema-design",
          path: "skills/mongodb-schema-design",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-schema-design", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dt-dql-essentials",
      displayName: "Dynatrace DQL Essentials",
      description:
        "Write correct Dynatrace Query Language: core syntax, common" +
        "pitfalls, and query patterns for logs, spans, and metrics",
      maker: { name: people.Dynatrace.firstName },
      stars: 181,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_dt-dql-essentials",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dt-dql-essentials",
        description:
          "Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics",
        files: [],
        starters: [],
        source: {
          repository: "captured/dt-dql-essentials",
          path: "skills/dt-dql-essentials",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dt-dql-essentials", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firecrawl-build",
      displayName: "Firecrawl Build",
      description:
        "Integrate Firecrawl scraping, search, and browser actions into" +
        "product code and agent workflows",
      maker: { name: people.Firecrawl.firstName },
      stars: 160,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_firecrawl-build",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firecrawl-build",
        description:
          "Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows",
        files: [],
        starters: [],
        source: {
          repository: "captured/firecrawl-build",
          path: "skills/firecrawl-build",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firecrawl-build", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-client",
      displayName: "Apollo Client",
      description:
        "Build React apps with Apollo Client 4: queries, mutations, cache" +
        "policies, local state, and error handling",
      maker: { name: people.ApolloGraphql.firstName },
      stars: 131,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_apollo-client",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-client",
        description:
          "Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling",
        files: [],
        starters: [],
        source: {
          repository: "captured/apollo-client",
          path: "skills/apollo-client",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-client", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-federation",
      displayName: "Apollo Federation",
      description:
        "Author Apollo Federation subgraph schemas with entities, keys," +
        "shared fields, and the right directives",
      maker: { name: people.ApolloGraphql.firstName },
      stars: 131,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_apollo-federation",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-federation",
        description:
          "Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives",
        files: [],
        starters: [],
        source: {
          repository: "captured/apollo-federation",
          path: "skills/apollo-federation",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-federation", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-server",
      displayName: "Apollo Server",
      description:
        "Build GraphQL servers with Apollo Server 5: schemas, resolvers," +
        "auth, plugins, and data sources",
      maker: { name: people.ApolloGraphql.firstName },
      stars: 131,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_apollo-server",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-server",
        description:
          "Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources",
        files: [],
        starters: [],
        source: {
          repository: "captured/apollo-server",
          path: "skills/apollo-server",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-server", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres",
      displayName: "Neon Postgres",
      description:
        "Work with Neon Postgres: pooled and direct connections, branching," +
        "migrations, autoscaling, and read replicas",
      maker: { name: people.Neon.firstName },
      stars: 116,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres",
        description:
          "Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas",
        files: [],
        starters: [],
        source: {
          repository: "captured/neon-postgres",
          path: "skills/neon-postgres",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_neon-postgres", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres-egress-optimizer",
      displayName: "Neon Egress Optimizer",
      description:
        "Find and fix queries that overfetch and drive up Postgres network" +
        "egress and database bills",
      maker: { name: people.Neon.firstName },
      stars: 116,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres-egress-optimizer",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres-egress-optimizer",
        description:
          "Find and fix queries that overfetch and drive up Postgres network egress and database bills",
        files: [],
        starters: [],
        source: {
          repository: "captured/neon-postgres-egress-optimizer",
          path: "skills/neon-postgres-egress-optimizer",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_neon-postgres-egress-optimizer", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-nextjs-patterns",
      displayName: "Clerk Next.js Patterns",
      description:
        "Apply Clerk in Next.js with middleware, Server Actions, and caching" +
        "patterns that keep auth correct",
      maker: { name: people.Clerk.firstName },
      stars: 94,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_clerk-nextjs-patterns",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-nextjs-patterns",
        description:
          "Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct",
        files: [],
        starters: [],
        source: {
          repository: "captured/clerk-nextjs-patterns",
          path: "skills/clerk-nextjs-patterns",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-nextjs-patterns", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-setup",
      displayName: "Clerk Setup",
      description:
        "Set up Clerk authentication in any project with the Clerk CLI and" +
        "official framework quickstarts",
      maker: { name: people.Clerk.firstName },
      stars: 94,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_clerk-setup",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-setup",
        description:
          "Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts",
        files: [],
        starters: [],
        source: {
          repository: "captured/clerk-setup",
          path: "skills/clerk-setup",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-setup", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "unsafe-rust-review",
      displayName: "Unsafe Rust Review",
      description:
        "Write and review unsafe Rust safety docs and comments as proof" +
        "obligations grounded in the Rust Reference and project invariants",
      maker: { name: people.Google.firstName },
      stars: 84,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_unsafe-rust-review",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "unsafe-rust-review",
        description:
          "Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants",
        files: [],
        starters: [],
        source: {
          repository: "captured/unsafe-rust-review",
          path: "skills/unsafe-rust-review",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_unsafe-rust-review", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-error-tracking",
      displayName: "PostHog Error Tracking",
      description:
        "Capture exceptions in PostHog with stack traces and source maps for" +
        "web, mobile, and server code",
      maker: { name: people.Posthog.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-error-tracking",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-error-tracking",
        description:
          "Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code",
        files: [],
        starters: [],
        source: {
          repository: "captured/posthog-instrument-error-tracking",
          path: "skills/posthog-instrument-error-tracking",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_posthog-instrument-error-tracking",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-integration",
      displayName: "PostHog Integration",
      description:
        "Add the PostHog SDK to an app with the right provider," +
        "initialization, and configuration for its framework",
      maker: { name: people.Posthog.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-integration",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-integration",
        description:
          "Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework",
        files: [],
        starters: [],
        source: {
          repository: "captured/posthog-instrument-integration",
          path: "skills/posthog-instrument-integration",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_posthog-instrument-integration", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-llm-analytics",
      displayName: "PostHog LLM Analytics",
      description:
        "Trace LLM calls in PostHog with token counts, latency, and cost for" +
        "every provider the app uses",
      maker: { name: people.Posthog.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-llm-analytics",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-llm-analytics",
        description:
          "Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses",
        files: [],
        starters: [],
        source: {
          repository: "captured/posthog-instrument-llm-analytics",
          path: "skills/posthog-instrument-llm-analytics",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_posthog-instrument-llm-analytics",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-client-api",
      displayName: "Prisma Client API",
      description:
        "Write Prisma Client queries correctly: model queries, filters," +
        "operators, relations, and transactions",
      maker: { name: people.Prisma.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_prisma-client-api",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-client-api",
        description:
          "Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions",
        files: [],
        starters: [],
        source: {
          repository: "captured/prisma-client-api",
          path: "skills/prisma-client-api",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-client-api", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-upgrade-v7",
      displayName: "Prisma 7 Upgrade",
      description:
        "Move a project from Prisma ORM 6 to 7, covering driver adapters, the" +
        "new generator, and every breaking change",
      maker: { name: people.Prisma.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_prisma-upgrade-v7",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-upgrade-v7",
        description:
          "Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change",
        files: [],
        starters: [],
        source: {
          repository: "captured/prisma-upgrade-v7",
          path: "skills/prisma-upgrade-v7",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-upgrade-v7", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-best-practices",
      displayName: "Pulumi Best Practices",
      description:
        "Write and review Pulumi TypeScript and Python programs that handle" +
        "outputs, secrets, and resource options correctly",
      maker: { name: people.Pulumi.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_pulumi-best-practices",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-best-practices",
        description:
          "Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly",
        files: [],
        starters: [],
        source: {
          repository: "captured/pulumi-best-practices",
          path: "skills/pulumi-best-practices",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-best-practices", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-component",
      displayName: "Pulumi Components",
      description:
        "Author reusable Pulumi ComponentResource classes with clean inputs," +
        "outputs, and multi-language packaging",
      maker: { name: people.Pulumi.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_pulumi-component",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-component",
        description:
          "Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging",
        files: [],
        starters: [],
        source: {
          repository: "captured/pulumi-component",
          path: "skills/pulumi-component",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-component", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-terraform-to-pulumi",
      displayName: "Terraform to Pulumi",
      description:
        "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL" +
        "and importing existing state",
      maker: { name: people.Pulumi.firstName },
      stars: 80,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_pulumi-terraform-to-pulumi",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-terraform-to-pulumi",
        description:
          "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state",
        files: [],
        starters: [],
        source: {
          repository: "captured/pulumi-terraform-to-pulumi",
          path: "skills/pulumi-terraform-to-pulumi",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_pulumi-terraform-to-pulumi", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "integrate-revenuecat",
      displayName: "RevenueCat Integration",
      description:
        "Add RevenueCat subscriptions to an app: dashboard setup plus" +
        "Purchases SDK installation and configuration",
      maker: { name: people.Revenuecat.firstName },
      stars: 79,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_integrate-revenuecat",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "integrate-revenuecat",
        description:
          "Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration",
        files: [],
        starters: [],
        source: {
          repository: "captured/integrate-revenuecat",
          path: "skills/integrate-revenuecat",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_integrate-revenuecat", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "building-livekit-agents",
      displayName: "LiveKit Agents",
      description:
        "Build voice and chat AI agents with LiveKit Agents: workflows," +
        "handoffs, turn handling, and latency fixes",
      maker: { name: people.Livekit.firstName },
      stars: 76,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_building-livekit-agents",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "building-livekit-agents",
        description:
          "Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes",
        files: [],
        starters: [],
        source: {
          repository: "captured/building-livekit-agents",
          path: "skills/building-livekit-agents",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_building-livekit-agents", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex",
      displayName: "Convex",
      description:
        "Build type-safe reactive backends on Convex: schema, queries," +
        "mutations, actions, auth, scheduling, and file storage",
      maker: { name: people.Convex.firstName },
      stars: 69,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_convex",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex",
        description:
          "Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage",
        files: [],
        starters: [],
        source: {
          repository: "captured/convex",
          path: "skills/convex",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex-authz",
      displayName: "Convex Authorization Audit",
      description:
        "Audit and harden Convex apps against impersonation, missing" +
        "ownership checks, and queries that leak data by id",
      maker: { name: people.Convex.firstName },
      stars: 69,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_convex-authz",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex-authz",
        description:
          "Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id",
        files: [],
        starters: [],
        source: {
          repository: "captured/convex-authz",
          path: "skills/convex-authz",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex-authz", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-config",
      displayName: "Netlify Configuration",
      description:
        "Configure Netlify builds and routing with netlify.toml, redirects," +
        "headers, and per-context environment variables",
      maker: { name: people.Netlify.firstName },
      stars: 54,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_netlify-config",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-config",
        description:
          "Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables",
        files: [],
        starters: [],
        source: {
          repository: "captured/netlify-config",
          path: "skills/netlify-config",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-config", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-edge-functions",
      displayName: "Netlify Edge Functions",
      description:
        "Write Netlify Edge Functions for auth middleware, geolocation, A/B" +
        "tests, and request transforms",
      maker: { name: people.Netlify.firstName },
      stars: 54,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_netlify-edge-functions",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-edge-functions",
        description:
          "Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms",
        files: [],
        starters: [],
        source: {
          repository: "captured/netlify-edge-functions",
          path: "skills/netlify-edge-functions",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_netlify-edge-functions", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-functions",
      displayName: "Netlify Functions",
      description:
        "Write and deploy Netlify serverless functions in TypeScript," +
        "JavaScript, or Go, with streaming, cron, and background jobs",
      maker: { name: people.Netlify.firstName },
      stars: 54,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_netlify-functions",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-functions",
        description:
          "Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs",
        files: [],
        starters: [],
        source: {
          repository: "captured/netlify-functions",
          path: "skills/netlify-functions",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-functions", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "workos",
      displayName: "WorkOS",
      description:
        "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and" +
        "debug integrations",
      maker: { name: people.Workos.firstName },
      stars: 46,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_workos",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "workos",
        description:
          "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations",
        files: [],
        starters: [],
        source: {
          repository: "captured/workos",
          path: "skills/workos",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_workos", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "twilio-migrate-messaging-to-verify",
      displayName: "Twilio Verify Migration",
      description:
        "Replace a self-built SMS one-time-passcode flow with the Twilio" +
        "Verify API for delivery, expiry, and fraud protection",
      maker: { name: people.Twilio.firstName },
      stars: 41,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_twilio-migrate-messaging-to-verify",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "twilio-migrate-messaging-to-verify",
        description:
          "Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection",
        files: [],
        starters: [],
        source: {
          repository: "captured/twilio-migrate-messaging-to-verify",
          path: "skills/twilio-migrate-messaging-to-verify",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_twilio-migrate-messaging-to-verify",
        "1.0.0",
        20,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-qstash-js",
      displayName: "Upstash QStash",
      description:
        "Run background jobs, scheduled tasks, and retried HTTP messages on" +
        "serverless apps with the QStash TypeScript SDK",
      maker: { name: people.Upstash.firstName },
      stars: 37,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_upstash-qstash-js",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-qstash-js",
        description:
          "Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK",
        files: [],
        starters: [],
        source: {
          repository: "captured/upstash-qstash-js",
          path: "skills/upstash-qstash-js",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-qstash-js", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-redis-js",
      displayName: "Upstash Redis",
      description:
        "Use the Upstash Redis TypeScript SDK for caching, sessions, rate" +
        "limits, and counters on serverless and edge runtimes",
      maker: { name: people.Upstash.firstName },
      stars: 37,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_upstash-redis-js",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-redis-js",
        description:
          "Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes",
        files: [],
        starters: [],
        source: {
          repository: "captured/upstash-redis-js",
          path: "skills/upstash-redis-js",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-redis-js", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "appwrite-typescript",
      displayName: "Appwrite TypeScript",
      description:
        "Build with the Appwrite TypeScript SDK: auth, databases, storage," +
        "realtime, and server-side admin access",
      maker: { name: people.Appwrite.firstName },
      stars: 29,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_appwrite-typescript",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "appwrite-typescript",
        description:
          "Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access",
        files: [],
        starters: [],
        source: {
          repository: "captured/appwrite-typescript",
          path: "skills/appwrite-typescript",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_appwrite-typescript", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-durable-functions",
      displayName: "Inngest Durable Functions",
      description:
        "Build Inngest functions that survive crashes, retry on failure, run" +
        "on schedules, and resume where they stopped",
      maker: { name: people.Inngest.firstName },
      stars: 29,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_inngest-durable-functions",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-durable-functions",
        description:
          "Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped",
        files: [],
        starters: [],
        source: {
          repository: "captured/inngest-durable-functions",
          path: "skills/inngest-durable-functions",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_inngest-durable-functions", "1.0.0", 20),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-setup",
      displayName: "Inngest Setup",
      description:
        "Add Inngest durable execution to a TypeScript project: SDK install," +
        "client config, and serve endpoints",
      maker: { name: people.Inngest.firstName },
      stars: 29,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_inngest-setup",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-setup",
        description:
          "Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints",
        files: [],
        starters: [],
        source: {
          repository: "captured/inngest-setup",
          path: "skills/inngest-setup",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_inngest-setup", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "temporal-cloud-setup",
      displayName: "Temporal Cloud Setup",
      description:
        "Set up Temporal Cloud end to end and run a sample workflow on it",
      maker: { name: people.Temporal.firstName },
      stars: 27,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_temporal-cloud-setup",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "temporal-cloud-setup",
        description:
          "Set up Temporal Cloud end to end and run a sample workflow on it",
        files: [],
        starters: [],
        source: {
          repository: "captured/temporal-cloud-setup",
          path: "skills/temporal-cloud-setup",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_temporal-cloud-setup", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "buildkite-migration",
      displayName: "Buildkite Migration",
      description:
        "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab" +
        "CI, and Bitbucket to Buildkite",
      maker: { name: people.Buildkite.firstName },
      stars: 19,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_buildkite-migration",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "buildkite-migration",
        description:
          "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite",
        files: [],
        starters: [],
        source: {
          repository: "captured/buildkite-migration",
          path: "skills/buildkite-migration",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_buildkite-migration", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cockroachdb-sql",
      displayName: "CockroachDB SQL",
      description:
        "Write and tune SQL for CockroachDB: schema design, primary keys," +
        "type mappings, and distributed-database patterns",
      maker: { name: people.CockroachLabs.firstName },
      stars: 5,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_cockroachdb-sql",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cockroachdb-sql",
        description:
          "Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns",
        files: [],
        starters: [],
        source: {
          repository: "captured/cockroachdb-sql",
          path: "skills/cockroachdb-sql",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cockroachdb-sql", "1.0.0", 20)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-byoc",
      displayName: "Vercel BYOC",
      description:
        "Deploy an app with Vercel Bring Your Own Cloud so its functions run" +
        "as AWS Lambda in your own account",
      maker: { name: people.Vercel.firstName },
      stars: 1,
      starsCheckedAt: minutesAgo(2 * day),
      version: "1.0.0",
      versionId: "skv_captured_vercel-byoc",
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-byoc",
        description:
          "Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account",
        files: [],
        starters: [],
        source: {
          repository: "captured/vercel-byoc",
          path: "skills/vercel-byoc",
          commit: "captured",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_vercel-byoc", "1.0.0", 20)],
  }),
];

export const findSampleListing = (kind: string, slug: string) =>
  sampleListings.find(
    (listing) => listing.card.kind === kind && listing.card.slug === slug,
  );
