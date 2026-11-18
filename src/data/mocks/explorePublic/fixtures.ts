import {
  ExploreCard,
  ExploreListing,
  ExploreVersion,
  type ListingSetup,
} from "../../api/schemas/explore.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { type ThemeListingFixture, themeListings } from "./themes.ts";

const day = 24 * 60;

/** The commit every captured listing stands on; Explore only displays it. */
const capturePlaceholderCommit = "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a";

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

const themeListing = (fixture: ThemeListingFixture, index: number) =>
  new ExploreListing({
    card: card({
      kind: "theme",
      slug: fixture.slug,
      displayName: fixture.displayName,
      description: fixture.description,
      maker: fixture.maker,
      source: fixture.source,
      theme: fixture.theme,
      version: fixture.version,
      versionId: `thv_captured_${fixture.slug}`,
      adds: fixture.adds,
      featuredRank: fixture.featuredRank,
      firstListedAt: minutesAgo(20 * day),
    }),
    content: { kind: "theme", theme: fixture.theme },
    setup: null,
    versions: [
      new ExploreVersion({
        id: `thv_captured_${fixture.slug}`,
        version: fixture.version,
        notes: "First listing in Explore",
        createdAt: minutesAgo((30 - index) * day),
      }),
    ],
  });

/**
 * Every listing Explore serves, from Capy's own catalogue captures: the plugin
 * rows are the marketplace shelf as Capy showed it (names, descriptions and
 * categories read off that page), and the skill rows are the captured skills
 * list. A captured shelf card carries no detail payload, so a plugin's servers,
 * skills, repository and versions are empty here rather than filled in.
 */
export const sampleListings: ReadonlyArray<ExploreListing> = [
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "keiki",
      displayName: "Keiki",
      description:
        "Build, test, and run customer-facing agents on iMessage, WhatsApp, and Slack",
      category: "productivity",
      firstListedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "godaddy",
      displayName: "GoDaddy",
      description: "Brainstorm domain names and check availability",
      category: "other",
      firstListedAt: minutesAgo(2 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "paypal",
      displayName: "PayPal",
      description:
        "Manage orders, invoices, subscriptions, and disputes in PayPal",
      category: "payments",
      firstListedAt: minutesAgo(4 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "twilio-developer-kit",
      displayName: "Twilio Developer Kit",
      description:
        "Twilio skills for setup, planning, products, and guardrails across SMS, Voice, WhatsApp, AI agents, and 30+ more products",
      category: "productivity",
      firstListedAt: minutesAgo(5 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "excalidraw",
      displayName: "Excalidraw",
      description: "Draw and export hand-drawn diagrams from chat",
      category: "design",
      firstListedAt: minutesAgo(1 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "webull",
      displayName: "Webull",
      description:
        "View accounts, positions, orders, watchlists, and market data",
      category: "payments",
      firstListedAt: minutesAgo(6 * day),
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "elastic",
      displayName: "Elastic",
      description:
        "Elastic skills and documentation \u2014 Elasticsearch, Kibana, Observability, Security, Cloud, ES|QL, OpenTelemetry, and MCP docs access",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "thousandeyes",
      displayName: "ThousandEyes",
      description:
        "Connect Claude Code to ThousandEyes MCP endpoints and shared ThousandEyes skills for network intelligence workflows",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "raygun",
      displayName: "Raygun",
      description: "Investigate crashes, real user monitoring, and deployments",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "profound",
      displayName: "Profound",
      description: "Track AI visibility, sentiment, and citations",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "omni-analytics",
      displayName: "Omni Analytics",
      description:
        "Explore, query, model, embed, and manage Omni Analytics through the REST API and embed SDK. Includes 9 skills, 3 specialized agents, and 4 context rules for model exploration, querying, model building, content browsing, content building, embedding, AI optimization, AI eval, and administration",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "openai-ads-conversions",
      displayName: "OpenAI Ads Conversions",
      description:
        "Set up OpenAI Ads Pixel and Conversions API tracking on your site",
      category: "monitoring",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "val-town",
      displayName: "Val Town",
      description:
        "Write, deploy, and debug vals: HTTP endpoints, crons, and email",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "statsig",
      displayName: "Statsig",
      description:
        "Manage feature gates and experiments and read their results",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sagemaker-ai",
      displayName: "SageMaker AI",
      description:
        "Build, train, and deploy AI models with deep AWS AI/ML expertise brought directly into your coding assistants, covering the surface area of Amazon SageMaker AI",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pulumi",
      displayName: "Pulumi",
      description:
        "Search cloud resources across stacks and delegate tasks to Pulumi Neo",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "launchdarkly",
      displayName: "LaunchDarkly",
      description: "Create, target, roll out, and clean up feature flags",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "heroku",
      displayName: "Heroku",
      description: "Deploy and manage Heroku apps, add-ons, dynos, and logs",
      category: "deployment",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "turbopuffer",
      displayName: "Turbopuffer",
      description:
        "Work with turbopuffer, a serverless vector and full-text search database. Includes guidance for querying (vector ANN, BM25, hybrid), writing, schema management, native embeddings, sharding, pinning, branching, bulk ingestion, and troubleshooting",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "turso",
      displayName: "Turso",
      description: "Manage Turso databases, branches, and groups, and run SQL",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "redis",
      displayName: "Redis",
      description:
        "Apply Redis best practices for data structures, search, and caching",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "qdrant",
      displayName: "Qdrant",
      description:
        "Tune Qdrant collections, search quality, scaling, and migrations",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pg-aiguide",
      displayName: "Tiger Data pg-aiguide",
      description:
        "Search Postgres docs and apply Postgres best practices to schemas",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "pinecone",
      displayName: "Pinecone",
      description: "Search docs and manage indexes and records in Pinecone",
      category: "database",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "zapier",
      displayName: "Zapier",
      description:
        "Run actions in thousands of apps through your Zapier account",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "test-android-apps",
      displayName: "Test Android Apps",
      description:
        "Reproduce bugs, inspect UI, and profile Android apps on an emulator",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "temporal",
      displayName: "Temporal",
      description:
        "Build, debug, and operate Temporal workflows across SDKs and Temporal Cloud",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "superpowers",
      displayName: "Superpowers",
      description:
        "Plan, test-drive, debug, and review code with a disciplined workflow",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "svelte",
      displayName: "Svelte",
      description:
        "Look up Svelte docs and check components with the Svelte autofixer",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "spottercode",
      displayName: "Spottercode",
      description:
        "ThoughtSpot developer documentation \u2014 search Visual Embed SDK, REST API v2, and developer guides",
      category: "docs",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "webflow",
      displayName: "Webflow",
      description:
        "Manage Webflow sites, CMS collections, pages, and publishing",
      category: "design",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "remotion",
      displayName: "Remotion",
      description:
        "Make videos in React with animation, captions, audio, and rendering",
      category: "design",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "product-design",
      displayName: "Product Design",
      description:
        "Explore product ideas, audit flows, and turn mockups into working prototypes",
      category: "design",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "mermaid-chart",
      displayName: "Mermaid Chart",
      description: "Create, validate, render, and save Mermaid diagrams",
      category: "design",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "magicpath",
      displayName: "MagicPath",
      description:
        "Find, install, and create UI components from MagicPath canvases",
      category: "design",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "circle",
      displayName: "Circle",
      description:
        "Skills for USDC payments, cross-chain transfers, wallets, and smart contracts, plus Circle's MCP server for SDK and docs guidance",
      category: "payments",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "xero",
      displayName: "Xero",
      description: "Read and write invoices, contacts, reports, and payroll",
      category: "payments",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sp-global",
      displayName: "S&P Global",
      description: "Query S&P Capital IQ financials, prices, and transcripts",
      category: "payments",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "robinhood",
      displayName: "Robinhood",
      description:
        "View portfolios, positions, orders, watchlists, and market data, and trade in a Robinhood Agentic account",
      category: "payments",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "typeform",
      displayName: "Typeform",
      description: "Build forms, analyze responses, and manage contacts",
      category: "productivity",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "trello",
      displayName: "Trello",
      description:
        "Manage your Trello workspace from chat: browse and create boards, view and move lists, create, update, move, archive, and complete cards with labels and due dates, manage checklists, capture Inbox cards, schedule Planner focus time, and search across boards",
      category: "productivity",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "todoist",
      displayName: "Todoist",
      description: "Create, find, and complete tasks and projects",
      category: "productivity",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "readwise",
      displayName: "Readwise",
      description: "Search highlights and Reader documents, save articles",
      category: "productivity",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "workable",
      displayName: "Workable",
      description: "Search candidates, move pipelines, and manage HR records",
      category: "other",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "upwork",
      displayName: "Upwork",
      description: "Search talent, post jobs, and manage contracts",
      category: "other",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "tinyfish",
      displayName: "TinyFish",
      description:
        "Browse and automate the web with TinyFish: run multi-step web automations, search the web, extract clean page content, and drive remote stealth browser sessions",
      category: "other",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "greenhouse",
      displayName: "Greenhouse",
      description:
        "Search candidates, jobs, and applications, and review scorecards in Greenhouse Recruiting",
      category: "other",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "forge",
      displayName: "Forge",
      description:
        "Forge \u2014 Work orders, journey progress, artifacts, ForgeScore, dev activity, and project context for AI-assisted development workflows",
      category: "other",
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "cloudflare",
      displayName: "Cloudflare",
      description: "Manage Workers, zones, and edge configuration",
      category: "other",
      featuredRank: 1,
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "sentry",
      displayName: "Sentry",
      description: "Investigate errors, traces, and affected releases",
      category: "other",
      featuredRank: 3,
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "firecrawl",
      displayName: "Firecrawl",
      description: "Search, scrape, crawl, and interact with the live web",
      category: "other",
      featuredRank: 2,
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
  }),
  new ExploreListing({
    card: card({
      kind: "plugin",
      slug: "vercel",
      displayName: "Vercel",
      description: "Inspect projects, deployments, and build failures",
      category: "other",
      featuredRank: 4,
    }),
    content: {
      kind: "plugin",
      plugin: {
        servers: [],
        skills: [],
        repository: null,
        path: ".",
        commit: capturePlaceholderCommit,
        license: null,
        warnings: [],
        prerequisites: null,
      },
    },
    setup: null,
    versions: [],
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
  ...themeListings.map(themeListing),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "diagnosing-bugs",
      displayName: "Diagnosing Bugs",
      description:
        "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_diagnosing-bugs",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "diagnosing-bugs",
        description:
          "Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: diagnosing-bugs\ndescription: Debug hard bugs and slow code by first building a tight pass/fail feedback loop, then reproducing, minimising, and fixing\n---\n\n# Diagnosing Bugs",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/diagnosing-bugs",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_diagnosing-bugs", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "grilling",
      displayName: "Grilling",
      description:
        "Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_grilling",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "grilling",
        description:
          "Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: grilling\ndescription: Stress-test a plan or design by interviewing you in rounds, with a recommended answer to each question, until nothing is left assumed\n---\n\n# Grilling",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/grilling",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_grilling", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "improve-codebase-architecture",
      displayName: "Improve Codebase Architecture",
      description:
        "Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_improve-codebase-architecture",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "improve-codebase-architecture",
        description:
          "Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: improve-codebase-architecture\ndescription: Find shallow modules worth deepening, present them as an HTML report, then talk through the one you pick\n---\n\n# Improve Codebase Architecture",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/improve-codebase-architecture",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_improve-codebase-architecture", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-codebase-design",
      displayName: "Codebase Design",
      description:
        "Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-codebase-design",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-codebase-design",
        description:
          "Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-codebase-design\ndescription: Design deep modules with a shared vocabulary of interfaces, seams, adapters, and the deletion test\n---\n\n# Codebase Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-codebase-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mattpocock-codebase-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-handoff",
      displayName: "Handoff",
      description:
        "Compact the current session into a handoff document so a fresh agent can pick up the work",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-handoff",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-handoff",
        description:
          "Compact the current session into a handoff document so a fresh agent can pick up the work",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-handoff\ndescription: Compact the current session into a handoff document so a fresh agent can pick up the work\n---\n\n# Handoff",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-handoff",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-handoff", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mattpocock-pr",
      displayName: "PR Body",
      description:
        "Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_mattpocock-pr",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mattpocock-pr",
        description:
          "Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mattpocock-pr\ndescription: Write pull request bodies with a visual summary, before and after evidence, and a merge-danger rating\n---\n\n# PR Body",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mattpocock-pr",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mattpocock-pr", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "setup-pre-commit",
      displayName: "Set Up Pre-Commit Hooks",
      description:
        "Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests",
      maker: { name: "Matt Pocock" },
      version: "1.0.0",
      versionId: "skv_captured_setup-pre-commit",
      stars: 326100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "setup-pre-commit",
        description:
          "Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: setup-pre-commit\ndescription: Add Husky pre-commit hooks that run lint-staged formatting, type checking, and tests\n---\n\n# Set Up Pre-Commit Hooks",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/setup-pre-commit",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_setup-pre-commit", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "docker-patterns",
      displayName: "Docker Patterns",
      description:
        "Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security",
      maker: { name: "Affaan Mustafa" },
      version: "1.0.0",
      versionId: "skv_captured_docker-patterns",
      stars: 304700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "docker-patterns",
        description:
          "Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: docker-patterns\ndescription: Write and review Dockerfiles and Compose stacks for local development, with multi-stage builds and container security\n---\n\n# Docker Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/docker-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_docker-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kubernetes-patterns",
      displayName: "Kubernetes Patterns",
      description:
        "Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets",
      maker: { name: "Affaan Mustafa" },
      version: "1.0.0",
      versionId: "skv_captured_kubernetes-patterns",
      stars: 304700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kubernetes-patterns",
        description:
          "Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: kubernetes-patterns\ndescription: Write and debug production Kubernetes manifests: probes, resource limits, RBAC, autoscaling, and secrets\n---\n\n# Kubernetes Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/kubernetes-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kubernetes-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "frontend-design",
      displayName: "Frontend Design",
      description:
        "Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_frontend-design",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "frontend-design",
        description:
          "Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: frontend-design\ndescription: Give new or reworked UI a deliberate visual direction, with typography and layout that don't read as template defaults\n---\n\n# Frontend Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/frontend-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_frontend-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "internal-comms",
      displayName: "Internal Comms",
      description:
        "Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_internal-comms",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "internal-comms",
        description:
          "Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: internal-comms\ndescription: Write status reports, leadership updates, newsletters, FAQs, and incident reports in the formats companies use\n---\n\n# Internal Comms",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/internal-comms",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_internal-comms", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mcp-builder",
      displayName: "MCP Builder",
      description:
        "Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_mcp-builder",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mcp-builder",
        description:
          "Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mcp-builder\ndescription: Build MCP servers in Python or TypeScript with well-designed tools, then write evaluations that test them\n---\n\n# MCP Builder",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mcp-builder",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mcp-builder", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "skill-creator",
      displayName: "Skill Creator",
      description:
        "Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_skill-creator",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "skill-creator",
        description:
          "Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: skill-creator\ndescription: Write, edit, and benchmark agent skills, and tune their descriptions so they trigger when they should\n---\n\n# Skill Creator",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/skill-creator",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_skill-creator", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "webapp-testing",
      displayName: "Web App Testing",
      description:
        "Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs",
      maker: { name: "Anthropic" },
      version: "1.0.0",
      versionId: "skv_captured_webapp-testing",
      stars: 196300,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "webapp-testing",
        description:
          "Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: webapp-testing\ndescription: Test a local web app with Playwright: drive the UI, capture screenshots, and read browser logs\n---\n\n# Web App Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/webapp-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_webapp-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "api-and-interface-design",
      displayName: "API and Interface Design",
      description:
        "Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_api-and-interface-design",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "api-and-interface-design",
        description:
          "Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: api-and-interface-design\ndescription: Design stable APIs and module boundaries: contract first, consistent errors, validation at the edges, additive change\n---\n\n# API and Interface Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/api-and-interface-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_api-and-interface-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "ci-cd-and-automation",
      displayName: "CI/CD and Automation",
      description:
        "Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_ci-cd-and-automation",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "ci-cd-and-automation",
        description:
          "Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: ci-cd-and-automation\ndescription: Set up CI pipelines with quality gates, test runners, and deployment strategies, and turn failures into fixes\n---\n\n# CI/CD and Automation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/ci-cd-and-automation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_ci-cd-and-automation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "code-simplification",
      displayName: "Code Simplification",
      description:
        "Simplify code for clarity while preserving behavior exactly, scoped to what changed",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_code-simplification",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "code-simplification",
        description:
          "Simplify code for clarity while preserving behavior exactly, scoped to what changed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: code-simplification\ndescription: Simplify code for clarity while preserving behavior exactly, scoped to what changed\n---\n\n# Code Simplification",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/code-simplification",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_code-simplification", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deprecation-and-migration",
      displayName: "Deprecation and Migration",
      description:
        "Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_deprecation-and-migration",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deprecation-and-migration",
        description:
          "Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: deprecation-and-migration\ndescription: Plan the removal of old code and zero-downtime migrations with expand and contract steps and clear sunset paths\n---\n\n# Deprecation and Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/deprecation-and-migration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_deprecation-and-migration", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "documentation-and-adrs",
      displayName: "Documentation and ADRs",
      description:
        "Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_documentation-and-adrs",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "documentation-and-adrs",
        description:
          "Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: documentation-and-adrs\ndescription: Record architecture decisions and the reasoning behind them so future engineers and agents can follow the code\n---\n\n# Documentation and ADRs",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/documentation-and-adrs",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_documentation-and-adrs", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-workflow-and-versioning",
      displayName: "Git Workflow and Versioning",
      description:
        "Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_git-workflow-and-versioning",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-workflow-and-versioning",
        description:
          "Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: git-workflow-and-versioning\ndescription: Keep history clean with atomic commits, clear messages, trunk-based branching, and sensible version bumps\n---\n\n# Git Workflow and Versioning",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/git-workflow-and-versioning",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_git-workflow-and-versioning", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "spec-driven-development",
      displayName: "Spec-Driven Development",
      description:
        "Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map",
      maker: { name: "Addy Osmani" },
      version: "1.0.0",
      versionId: "skv_captured_spec-driven-development",
      stars: 118400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "spec-driven-development",
        description:
          "Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: spec-driven-development\ndescription: Write a spec with objectives, scope, and success criteria before coding, and split large work into a capability map\n---\n\n# Spec-Driven Development",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/spec-driven-development",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_spec-driven-development", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "break-ui",
      displayName: "Break UI",
      description:
        "Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix",
      maker: { name: "Emil Kowalski" },
      version: "1.0.0",
      versionId: "skv_captured_break-ui",
      stars: 57500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "break-ui",
        description:
          "Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: break-ui\ndescription: Stress-test a component with worst-case data like long names and empty lists, and report each break with a fix\n---\n\n# Break UI",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/break-ui",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_break-ui", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "emil-design-eng",
      displayName: "Design Engineering",
      description:
        "Apply a design engineer's approach to UI polish, component details, and when and how to animate",
      maker: { name: "Emil Kowalski" },
      version: "1.0.0",
      versionId: "skv_captured_emil-design-eng",
      stars: 57500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "emil-design-eng",
        description:
          "Apply a design engineer's approach to UI polish, component details, and when and how to animate",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: emil-design-eng\ndescription: Apply a design engineer's approach to UI polish, component details, and when and how to animate\n---\n\n# Design Engineering",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/emil-design-eng",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_emil-design-eng", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "bash-defensive-patterns",
      displayName: "Defensive Bash",
      description:
        "Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_bash-defensive-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "bash-defensive-patterns",
        description:
          "Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: bash-defensive-patterns\ndescription: Write robust shell scripts with strict mode, error traps, safe quoting, and reliable cleanup\n---\n\n# Defensive Bash",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/bash-defensive-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_bash-defensive-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "changelog-automation",
      displayName: "Changelog Automation",
      description:
        "Generate changelogs and release notes from commits and pull requests in Keep a Changelog format",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_changelog-automation",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "changelog-automation",
        description:
          "Generate changelogs and release notes from commits and pull requests in Keep a Changelog format",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: changelog-automation\ndescription: Generate changelogs and release notes from commits and pull requests in Keep a Changelog format\n---\n\n# Changelog Automation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/changelog-automation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_changelog-automation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dependency-upgrade",
      displayName: "Dependency Upgrade",
      description:
        "Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_dependency-upgrade",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dependency-upgrade",
        description:
          "Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dependency-upgrade\ndescription: Plan major dependency upgrades with compatibility analysis, a staged rollout, and testing\n---\n\n# Dependency Upgrade",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dependency-upgrade",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dependency-upgrade", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "e2e-testing-patterns",
      displayName: "E2E Testing Patterns",
      description:
        "Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_e2e-testing-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "e2e-testing-patterns",
        description:
          "Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: e2e-testing-patterns\ndescription: Build reliable end-to-end suites with Playwright or Cypress and track down flaky tests\n---\n\n# E2E Testing Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/e2e-testing-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_e2e-testing-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "git-advanced-workflows",
      displayName: "Advanced Git Workflows",
      description:
        "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_git-advanced-workflows",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "git-advanced-workflows",
        description:
          "Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: git-advanced-workflows\ndescription: Use interactive rebase, cherry-pick, bisect, worktrees, and reflog to clean up history and recover from mistakes\n---\n\n# Advanced Git Workflows",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/git-advanced-workflows",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_git-advanced-workflows", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postgresql-table-design",
      displayName: "PostgreSQL Table Design",
      description:
        "Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_postgresql-table-design",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postgresql-table-design",
        description:
          "Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: postgresql-table-design\ndescription: Design and review Postgres schemas: data types, constraints, indexing, partitioning, and common gotchas\n---\n\n# PostgreSQL Table Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/postgresql-table-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_postgresql-table-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "postmortem-writing",
      displayName: "Postmortem Writing",
      description:
        "Write blameless postmortems with timelines, root cause analysis, and tracked action items",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_postmortem-writing",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "postmortem-writing",
        description:
          "Write blameless postmortems with timelines, root cause analysis, and tracked action items",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: postmortem-writing\ndescription: Write blameless postmortems with timelines, root cause analysis, and tracked action items\n---\n\n# Postmortem Writing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/postmortem-writing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_postmortem-writing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "python-testing-patterns",
      displayName: "Python Testing Patterns",
      description:
        "Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_python-testing-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "python-testing-patterns",
        description:
          "Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: python-testing-patterns\ndescription: Build pytest suites with fixtures, parametrization, mocking, and a test-driven workflow\n---\n\n# Python Testing Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/python-testing-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_python-testing-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sql-optimization-patterns",
      displayName: "SQL Optimization Patterns",
      description:
        "Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_sql-optimization-patterns",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sql-optimization-patterns",
        description:
          "Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sql-optimization-patterns\ndescription: Speed up slow queries with EXPLAIN analysis, indexing strategy, and proven rewrite patterns\n---\n\n# SQL Optimization Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sql-optimization-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_sql-optimization-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "typescript-advanced-types",
      displayName: "TypeScript Advanced Types",
      description:
        "Use generics, conditional and mapped types, and template literals to build type-safe utilities",
      maker: { name: "Seth Hobson" },
      version: "1.0.0",
      versionId: "skv_captured_typescript-advanced-types",
      stars: 42600,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "typescript-advanced-types",
        description:
          "Use generics, conditional and mapped types, and template literals to build type-safe utilities",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: typescript-advanced-types\ndescription: Use generics, conditional and mapped types, and template literals to build type-safe utilities\n---\n\n# TypeScript Advanced Types",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/typescript-advanced-types",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_typescript-advanced-types", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-cli-with-tokens",
      displayName: "Vercel CLI with Tokens",
      description:
        "Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-cli-with-tokens",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-cli-with-tokens",
        description:
          "Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-cli-with-tokens\ndescription: Deploy and manage Vercel projects from the CLI with an access token instead of an interactive login\n---\n\n# Vercel CLI with Tokens",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-cli-with-tokens",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_vercel-cli-with-tokens", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-composition-patterns",
      displayName: "React Composition Patterns",
      description:
        "Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-composition-patterns",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-composition-patterns",
        description:
          "Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-composition-patterns\ndescription: Refactor boolean-prop sprawl into compound components, context providers, and flexible component APIs, with React 19 changes\n---\n\n# React Composition Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-composition-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-composition-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-best-practices",
      displayName: "React Best Practices",
      description:
        "React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-best-practices",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-best-practices",
        description:
          "React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-best-practices\ndescription: React and Next.js performance rules from Vercel Engineering, ranked by impact from request waterfalls to micro-optimizations\n---\n\n# React Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-native-skills",
      displayName: "React Native Best Practices",
      description:
        "Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-native-skills",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-native-skills",
        description:
          "Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-native-skills\ndescription: Build fast React Native and Expo apps: list performance, animations, native modules, and platform-specific patterns\n---\n\n# React Native Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-native-skills",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-native-skills", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-react-view-transitions",
      displayName: "React View Transitions",
      description:
        "Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-react-view-transitions",
      stars: 34200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-react-view-transitions",
        description:
          "Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-react-view-transitions\ndescription: Add page transitions, shared-element animations, and enter and exit motion with React's ViewTransition component\n---\n\n# React View Transitions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-react-view-transitions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_vercel-react-view-transitions", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "chatgpt-apps",
      displayName: "Apps SDK",
      description:
        "Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_chatgpt-apps",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "chatgpt-apps",
        description:
          "Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: chatgpt-apps\ndescription: Build and debug OpenAI Apps SDK apps that pair an MCP server with a widget UI\n---\n\n# Apps SDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/chatgpt-apps",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_chatgpt-apps", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cli-creator",
      displayName: "CLI Creator",
      description:
        "Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_cli-creator",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cli-creator",
        description:
          "Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cli-creator\ndescription: Build a composable command-line tool from API docs, an OpenAPI spec, curl examples, an SDK, or a script\n---\n\n# CLI Creator",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cli-creator",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cli-creator", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-best-practices",
      displayName: "Security Best Practices",
      description:
        "Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-best-practices",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-best-practices",
        description:
          "Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-best-practices\ndescription: Review Python, JavaScript, TypeScript, and Go code against framework-specific security practices and suggest fixes\n---\n\n# Security Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_security-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-ownership-map",
      displayName: "Security Ownership Map",
      description:
        "Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-ownership-map",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-ownership-map",
        description:
          "Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-ownership-map\ndescription: Map who owns security-sensitive code from git history, find orphaned hotspots, and compute bus factor\n---\n\n# Security Ownership Map",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-ownership-map",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_security-ownership-map", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "security-threat-model",
      displayName: "Security Threat Model",
      description:
        "Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations",
      maker: { name: "OpenAI" },
      version: "1.0.0",
      versionId: "skv_captured_security-threat-model",
      stars: 28800,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "security-threat-model",
        description:
          "Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: security-threat-model\ndescription: Write a threat model grounded in the code: trust boundaries, assets, attacker paths, and mitigations\n---\n\n# Security Threat Model",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/security-threat-model",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_security-threat-model", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloud-logging-query-generation",
      displayName: "Cloud Logging Queries",
      description:
        "Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_cloud-logging-query-generation",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloud-logging-query-generation",
        description:
          "Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloud-logging-query-generation\ndescription: Turn plain-language questions into Logging Query Language filters for Cloud Logging when debugging on Google Cloud\n---\n\n# Cloud Logging Queries",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloud-logging-query-generation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloud-logging-query-generation", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-iam-troubleshooting",
      displayName: "Google Cloud IAM Troubleshooting",
      description:
        "Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-iam-troubleshooting",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-iam-troubleshooting",
        description:
          "Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: google-cloud-iam-troubleshooting\ndescription: Diagnose and fix IAM access denials on Google Cloud, from capturing the error context to a self-service remediation\n---\n\n# Google Cloud IAM Troubleshooting",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/google-cloud-iam-troubleshooting",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_google-cloud-iam-troubleshooting", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "google-cloud-run-basics",
      displayName: "Cloud Run",
      description:
        "Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing",
      maker: { name: "Google Cloud" },
      version: "1.0.0",
      versionId: "skv_captured_google-cloud-run-basics",
      stars: 24400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "google-cloud-run-basics",
        description:
          "Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: google-cloud-run-basics\ndescription: Deploy and manage Cloud Run services, jobs, and worker pools for HTTP apps, scheduled tasks, and background processing\n---\n\n# Cloud Run",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/google-cloud-run-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_google-cloud-run-basics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agent-tool-design",
      displayName: "Agent Tool Design",
      description:
        "Write tool descriptions, schemas, and error messages that agents can route on and recover from",
      maker: { name: "Murat Can Koylan" },
      version: "1.0.0",
      versionId: "skv_captured_agent-tool-design",
      stars: 18400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agent-tool-design",
        description:
          "Write tool descriptions, schemas, and error messages that agents can route on and recover from",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: agent-tool-design\ndescription: Write tool descriptions, schemas, and error messages that agents can route on and recover from\n---\n\n# Agent Tool Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/agent-tool-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_agent-tool-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "context-compression",
      displayName: "Context Compression",
      description:
        "Compress long agent sessions into structured summaries that keep files, decisions, and next steps",
      maker: { name: "Murat Can Koylan" },
      version: "1.0.0",
      versionId: "skv_captured_context-compression",
      stars: 18400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "context-compression",
        description:
          "Compress long agent sessions into structured summaries that keep files, decisions, and next steps",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: context-compression\ndescription: Compress long agent sessions into structured summaries that keep files, decisions, and next steps\n---\n\n# Context Compression",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/context-compression",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_context-compression", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "agentic-actions-auditor",
      displayName: "Agentic Actions Auditor",
      description:
        "Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_agentic-actions-auditor",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "agentic-actions-auditor",
        description:
          "Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: agentic-actions-auditor\ndescription: Audit GitHub Actions workflows for attacks that reach AI agents running in CI, such as expression injection\n---\n\n# Agentic Actions Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/agentic-actions-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_agentic-actions-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "audit-context-building",
      displayName: "Audit Context Building",
      description:
        "Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_audit-context-building",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "audit-context-building",
        description:
          "Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: audit-context-building\ndescription: Build a deep understanding of unfamiliar code, what each function assumes and guarantees, before hunting for bugs\n---\n\n# Audit Context Building",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/audit-context-building",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_audit-context-building", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "differential-review",
      displayName: "Differential Security Review",
      description:
        "Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_differential-review",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "differential-review",
        description:
          "Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: differential-review\ndescription: Review a PR or diff for security bugs, using git history, blast radius, and test coverage to set the depth\n---\n\n# Differential Security Review",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/differential-review",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_differential-review", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "fp-check",
      displayName: "False Positive Check",
      description:
        "Verify a suspected vulnerability with documented evidence and return a true or false positive verdict",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_fp-check",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "fp-check",
        description:
          "Verify a suspected vulnerability with documented evidence and return a true or false positive verdict",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: fp-check\ndescription: Verify a suspected vulnerability with documented evidence and return a true or false positive verdict\n---\n\n# False Positive Check",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/fp-check",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_fp-check", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "modern-python",
      displayName: "Modern Python Tooling",
      description:
        "Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_modern-python",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "modern-python",
        description:
          "Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: modern-python\ndescription: Set up Python projects with uv, ruff, and ty, and migrate from pip, Poetry, mypy, and black\n---\n\n# Modern Python Tooling",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/modern-python",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_modern-python", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mutation-testing",
      displayName: "Mutation Testing",
      description:
        "Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_mutation-testing",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mutation-testing",
        description:
          "Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mutation-testing\ndescription: Run mutation campaigns, analyze surviving mutants, and find bugs hiding behind weak tests\n---\n\n# Mutation Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mutation-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mutation-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "property-based-testing",
      displayName: "Property-Based Testing",
      description:
        "Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_property-based-testing",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "property-based-testing",
        description:
          "Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: property-based-testing\ndescription: Write and debug property-based tests with Hypothesis, fast-check, proptest, and similar tools to cover whole input domains\n---\n\n# Property-Based Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/property-based-testing",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_property-based-testing", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sharp-edges",
      displayName: "Sharp Edges",
      description:
        "Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_sharp-edges",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sharp-edges",
        description:
          "Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sharp-edges\ndescription: Find error-prone APIs, risky defaults, and footgun designs that lead to security mistakes\n---\n\n# Sharp Edges",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sharp-edges",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sharp-edges", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supply-chain-risk-auditor",
      displayName: "Supply Chain Risk Auditor",
      description:
        "Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_supply-chain-risk-auditor",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supply-chain-risk-auditor",
        description:
          "Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supply-chain-risk-auditor\ndescription: Audit dependencies for known advisories, abandoned upstreams, publisher concentration, and install-time scripts\n---\n\n# Supply Chain Risk Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supply-chain-risk-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_supply-chain-risk-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-codeql",
      displayName: "CodeQL Scan",
      description:
        "Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-codeql",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-codeql",
        description:
          "Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: trailofbits-codeql\ndescription: Build a CodeQL database and run data flow and taint analysis to find vulnerabilities across many languages\n---\n\n# CodeQL Scan",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/trailofbits-codeql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-codeql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "trailofbits-semgrep",
      displayName: "Semgrep Scan",
      description:
        "Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_trailofbits-semgrep",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "trailofbits-semgrep",
        description:
          "Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: trailofbits-semgrep\ndescription: Run a Semgrep security scan with the rulesets that fit the project and merge the results into SARIF\n---\n\n# Semgrep Scan",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/trailofbits-semgrep",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_trailofbits-semgrep", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "variant-analysis",
      displayName: "Variant Analysis",
      description:
        "After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query",
      maker: { name: "Trail of Bits" },
      version: "1.0.0",
      versionId: "skv_captured_variant-analysis",
      stars: 8200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "variant-analysis",
        description:
          "After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: variant-analysis\ndescription: After a bug turns up, hunt the other instances of the same root cause across the codebase and turn it into a query\n---\n\n# Variant Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/variant-analysis",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_variant-analysis", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "analyzing-dotnet-performance",
      displayName: ".NET Performance Anti-Patterns",
      description:
        "Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_analyzing-dotnet-performance",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "analyzing-dotnet-performance",
        description:
          "Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: analyzing-dotnet-performance\ndescription: Scan .NET code for about 50 performance anti-patterns across async, memory, strings, LINQ, regex, and I/O, ranked by severity\n---\n\n# .NET Performance Anti-Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/analyzing-dotnet-performance",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_analyzing-dotnet-performance", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-coverage-analysis",
      displayName: ".NET Coverage Analysis",
      description:
        "Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-coverage-analysis",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-coverage-analysis",
        description:
          "Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-coverage-analysis\ndescription: Read .NET coverage reports to find partial branches, plateaus, and high-risk CRAP scores, then plan the tests that close them\n---\n\n# .NET Coverage Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-coverage-analysis",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-coverage-analysis", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-microbenchmarking",
      displayName: "BenchmarkDotNet",
      description:
        "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-microbenchmarking",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-microbenchmarking",
        description:
          "Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-microbenchmarking\ndescription: Create, run, and interpret BenchmarkDotNet benchmarks, and avoid the setup mistakes that produce misleading numbers\n---\n\n# BenchmarkDotNet",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-microbenchmarking",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-microbenchmarking", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-migrate-nullable-references",
      displayName: "Nullable Reference Migration",
      description:
        "Enable nullable reference types in a C# project and work through the warnings project by project or file by file",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-migrate-nullable-references",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-migrate-nullable-references",
        description:
          "Enable nullable reference types in a C# project and work through the warnings project by project or file by file",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-migrate-nullable-references\ndescription: Enable nullable reference types in a C# project and work through the warnings project by project or file by file\n---\n\n# Nullable Reference Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-migrate-nullable-references",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_dotnet-migrate-nullable-references",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dotnet-test-anti-patterns",
      displayName: ".NET Test Anti-Patterns",
      description:
        "Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_dotnet-test-anti-patterns",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dotnet-test-anti-patterns",
        description:
          "Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dotnet-test-anti-patterns\ndescription: Audit a .NET test file or suite for anti-patterns and get a severity-ranked report of what makes tests flaky or worthless\n---\n\n# .NET Test Anti-Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dotnet-test-anti-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dotnet-test-anti-patterns", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "migrate-xunit-to-xunit-v3",
      displayName: "xUnit v3 Migration",
      description:
        "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_migrate-xunit-to-xunit-v3",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "migrate-xunit-to-xunit-v3",
        description:
          "Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: migrate-xunit-to-xunit-v3\ndescription: Migrate .NET test projects from xUnit.net v2 to xunit.v3 and fix the breaking changes\n---\n\n# xUnit v3 Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/migrate-xunit-to-xunit-v3",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_migrate-xunit-to-xunit-v3", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "msbuild-antipatterns",
      displayName: "MSBuild Antipatterns",
      description:
        "Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_msbuild-antipatterns",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "msbuild-antipatterns",
        description:
          "Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: msbuild-antipatterns\ndescription: Review MSBuild project, props, and targets files against a catalog of antipatterns and get a prioritized list of fixes\n---\n\n# MSBuild Antipatterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/msbuild-antipatterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_msbuild-antipatterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "optimizing-ef-core-queries",
      displayName: "EF Core Query Optimization",
      description:
        "Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster",
      maker: { name: ".NET" },
      version: "1.0.0",
      versionId: "skv_captured_optimizing-ef-core-queries",
      stars: 6200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "optimizing-ef-core-queries",
        description:
          "Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: optimizing-ef-core-queries\ndescription: Make slow Entity Framework Core queries generate less SQL, use fewer round-trips, and return results faster\n---\n\n# EF Core Query Optimization",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/optimizing-ef-core-queries",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_optimizing-ef-core-queries", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "gemini-api-dev",
      displayName: "Gemini API",
      description:
        "Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling",
      maker: { name: "Google" },
      version: "1.0.0",
      versionId: "skv_captured_gemini-api-dev",
      stars: 4500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "gemini-api-dev",
        description:
          "Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: gemini-api-dev\ndescription: Write code that calls the Gemini API for text, chat, multimodal input, image and speech generation, and function calling\n---\n\n# Gemini API",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/gemini-api-dev",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_gemini-api-dev", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-update",
      displayName: "EAS Update",
      description:
        "Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_eas-update",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-update",
        description:
          "Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: eas-update\ndescription: Configure over-the-air JavaScript updates with EAS Update, channels, branches, and runtime versions\n---\n\n# EAS Update",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/eas-update",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-update", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "eas-workflows",
      displayName: "EAS Workflows",
      description:
        "Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_eas-workflows",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "eas-workflows",
        description:
          "Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: eas-workflows\ndescription: Write EAS workflow YAML for Expo builds, tests, submissions, and deployment pipelines\n---\n\n# EAS Workflows",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/eas-workflows",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_eas-workflows", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-native-ui",
      displayName: "Expo Native UI",
      description:
        "Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_expo-native-ui",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-native-ui",
        description:
          "Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: expo-native-ui\ndescription: Make Expo screens feel native with platform styling, semantic colors, SF Symbols, native controls, and responsive layout\n---\n\n# Expo Native UI",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/expo-native-ui",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-native-ui", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "expo-router",
      displayName: "Expo Router",
      description:
        "Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews",
      maker: { name: "Expo" },
      version: "1.0.0",
      versionId: "skv_captured_expo-router",
      stars: 4200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "expo-router",
        description:
          "Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: expo-router\ndescription: Build navigation in Expo apps with file-based routes, native stacks and tabs, modals, headers, and link previews\n---\n\n# Expo Router",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/expo-router",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_expo-router", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "amazon-dynamodb",
      displayName: "Amazon DynamoDB",
      description:
        "Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_amazon-dynamodb",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "amazon-dynamodb",
        description:
          "Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: amazon-dynamodb\ndescription: Design, review, and debug DynamoDB data layers by listing access patterns first, then modeling keys and indexes to fit\n---\n\n# Amazon DynamoDB",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/amazon-dynamodb",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_amazon-dynamodb", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cdk",
      displayName: "AWS CDK",
      description:
        "Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-cdk",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cdk",
        description:
          "Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-cdk\ndescription: Author, deploy, and troubleshoot AWS infrastructure with CDK in TypeScript or Python: stack layout, constructs, and bootstrapping\n---\n\n# AWS CDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-cdk",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cdk", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-cloudformation",
      displayName: "AWS CloudFormation",
      description:
        "Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-cloudformation",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-cloudformation",
        description:
          "Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-cloudformation\ndescription: Author, validate, and troubleshoot CloudFormation templates, from resource definitions to failed stack updates\n---\n\n# AWS CloudFormation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-cloudformation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-cloudformation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "aws-iam",
      displayName: "AWS IAM",
      description:
        "Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_aws-iam",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "aws-iam",
        description:
          "Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: aws-iam\ndescription: Get IAM right: policy evaluation, trust policies, STS limits, and workflows for role management and least-privilege policies\n---\n\n# AWS IAM",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/aws-iam",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_aws-iam", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "debugging-lambda-timeouts",
      displayName: "Debugging Lambda Timeouts",
      description:
        "Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_debugging-lambda-timeouts",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "debugging-lambda-timeouts",
        description:
          "Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: debugging-lambda-timeouts\ndescription: Find why an AWS Lambda function times out by checking configuration, logs, metrics, networking, cold starts, and dependencies\n---\n\n# Debugging Lambda Timeouts",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/debugging-lambda-timeouts",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_debugging-lambda-timeouts", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "securing-s3-buckets",
      displayName: "Securing S3 Buckets",
      description:
        "Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations",
      maker: { name: "AWS" },
      version: "1.0.0",
      versionId: "skv_captured_securing-s3-buckets",
      stars: 3500,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "securing-s3-buckets",
        description:
          "Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: securing-s3-buckets\ndescription: Create and secure S3 buckets: access control, encryption, logging, and fixes for common misconfigurations\n---\n\n# Securing S3 Buckets",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/securing-s3-buckets",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_securing-s3-buckets", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-agents-sdk",
      displayName: "Cloudflare Agents SDK",
      description:
        "Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-agents-sdk",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-agents-sdk",
        description:
          "Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-agents-sdk\ndescription: Build, debug, and review applications on the Cloudflare Agents SDK: stateful agents, tools, scheduling, and chat\n---\n\n# Cloudflare Agents SDK",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-agents-sdk",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-agents-sdk", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-durable-objects",
      displayName: "Durable Objects",
      description:
        "Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-durable-objects",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-durable-objects",
        description:
          "Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-durable-objects\ndescription: Build, debug, and review Cloudflare Durable Objects for persistent state, coordination, and real-time workloads\n---\n\n# Durable Objects",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-durable-objects",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-durable-objects", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-email-service",
      displayName: "Cloudflare Email Service",
      description:
        "Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-email-service",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-email-service",
        description:
          "Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-email-service\ndescription: Implement and troubleshoot Cloudflare Email Sending and Email Routing, including delivery configuration\n---\n\n# Cloudflare Email Service",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-email-service",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_cloudflare-email-service", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-web-perf",
      displayName: "Web Performance Audit",
      description:
        "Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-web-perf",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-web-perf",
        description:
          "Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-web-perf\ndescription: Audit and fix website loading and interaction performance, Core Web Vitals, and Lighthouse scores\n---\n\n# Web Performance Audit",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-web-perf",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cloudflare-web-perf", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cloudflare-workers-best-practices",
      displayName: "Workers Best Practices",
      description:
        "Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_cloudflare-workers-best-practices",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cloudflare-workers-best-practices",
        description:
          "Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cloudflare-workers-best-practices\ndescription: Write and review production Cloudflare Workers: compatibility dates, bindings, observability, streaming, and runtime patterns\n---\n\n# Workers Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cloudflare-workers-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_cloudflare-workers-best-practices",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "wrangler",
      displayName: "Wrangler",
      description:
        "Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment",
      maker: { name: "Cloudflare" },
      version: "1.0.0",
      versionId: "skv_captured_wrangler",
      stars: 3400,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "wrangler",
        description:
          "Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: wrangler\ndescription: Run and troubleshoot Wrangler commands and configure Worker projects for local development, previews, and deployment\n---\n\n# Wrangler",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/wrangler",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_wrangler", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-cost-optimization",
      displayName: "Azure Cost Optimization",
      description:
        "Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_azure-cost-optimization",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-cost-optimization",
        description:
          "Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: azure-cost-optimization\ndescription: Find idle and orphaned Azure resources, rightsize workloads, and review Reservation and Savings Plan coverage\n---\n\n# Azure Cost Optimization",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/azure-cost-optimization",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_azure-cost-optimization", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "azure-diagnostics",
      displayName: "Azure Diagnostics",
      description:
        "Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_azure-diagnostics",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "azure-diagnostics",
        description:
          "Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: azure-diagnostics\ndescription: Debug Azure production issues in App Service, Container Apps, and Functions with Azure Monitor, AppLens, and resource health\n---\n\n# Azure Diagnostics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/azure-diagnostics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_azure-diagnostics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "deep-wiki-onboarding",
      displayName: "Codebase Onboarding Guides",
      description:
        "Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_deep-wiki-onboarding",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "deep-wiki-onboarding",
        description:
          "Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: deep-wiki-onboarding\ndescription: Generate onboarding guides for a codebase tailored to contributors, staff engineers, executives, and product managers\n---\n\n# Codebase Onboarding Guides",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/deep-wiki-onboarding",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_deep-wiki-onboarding", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "entra-app-registration",
      displayName: "Entra App Registration",
      description:
        "Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_entra-app-registration",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "entra-app-registration",
        description:
          "Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: entra-app-registration\ndescription: Register Microsoft Entra ID apps, configure OAuth 2.0 and API permissions, and wire up MSAL sign-in\n---\n\n# Entra App Registration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/entra-app-registration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_entra-app-registration", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "kql",
      displayName: "Kusto Query Language",
      description:
        "Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes",
      maker: { name: "Microsoft" },
      version: "1.0.0",
      versionId: "skv_captured_kql",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "kql",
        description:
          "Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: kql\ndescription: Write correct, efficient KQL queries and avoid the syntax gotchas in joins, dynamic types, datetimes, regex, and result sizes\n---\n\n# Kusto Query Language",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/kql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_kql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-add-unit-test",
      displayName: "Dart Unit Tests",
      description:
        "Write and organize Dart unit tests for functions, methods, and classes with package:test",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_dart-add-unit-test",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-add-unit-test",
        description:
          "Write and organize Dart unit tests for functions, methods, and classes with package:test",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dart-add-unit-test\ndescription: Write and organize Dart unit tests for functions, methods, and classes with package:test\n---\n\n# Dart Unit Tests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dart-add-unit-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dart-add-unit-test", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dart-use-pattern-matching",
      displayName: "Dart Pattern Matching",
      description:
        "Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_dart-use-pattern-matching",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dart-use-pattern-matching",
        description:
          "Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dart-use-pattern-matching\ndescription: Apply Dart 3 pattern matching, switch expressions, and destructuring to replace verbose type checks and casts\n---\n\n# Dart Pattern Matching",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dart-use-pattern-matching",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_dart-use-pattern-matching", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-add-widget-test",
      displayName: "Flutter Widget Tests",
      description:
        "Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-add-widget-test",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-add-widget-test",
        description:
          "Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-add-widget-test\ndescription: Write component-level Flutter tests with WidgetTester to check rendering, taps, scrolling, and text entry\n---\n\n# Flutter Widget Tests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-add-widget-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-add-widget-test", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-apply-architecture-best-practices",
      displayName: "Flutter App Architecture",
      description:
        "Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-apply-architecture-best-practices",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-apply-architecture-best-practices",
        description:
          "Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-apply-architecture-best-practices\ndescription: Structure a Flutter app in UI, logic, and data layers, for a new project or a refactor toward scale\n---\n\n# Flutter App Architecture",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-apply-architecture-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_flutter-apply-architecture-best-practices",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "flutter-fix-layout-issues",
      displayName: "Flutter Layout Fixes",
      description:
        "Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree",
      maker: { name: "Flutter" },
      version: "1.0.0",
      versionId: "skv_captured_flutter-fix-layout-issues",
      stars: 3200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "flutter-fix-layout-issues",
        description:
          "Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: flutter-fix-layout-issues\ndescription: Fix Flutter layout errors such as RenderFlex overflows and unbounded constraints by finding the cause in the widget tree\n---\n\n# Flutter Layout Fixes",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/flutter-fix-layout-issues",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_flutter-fix-layout-issues", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase",
      displayName: "Supabase",
      description:
        "Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime",
      maker: { name: "Supabase" },
      version: "1.0.0",
      versionId: "skv_captured_supabase",
      stars: 3100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase",
        description:
          "Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supabase\ndescription: Build on Supabase with the right client setup for auth, database, storage, edge functions, and realtime\n---\n\n# Supabase",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supabase",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_supabase", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "supabase-postgres-best-practices",
      displayName: "Supabase Postgres Best Practices",
      description:
        "Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices",
      maker: { name: "Supabase" },
      version: "1.0.0",
      versionId: "skv_captured_supabase-postgres-best-practices",
      stars: 3100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "supabase-postgres-best-practices",
        description:
          "Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: supabase-postgres-best-practices\ndescription: Design Postgres schemas, migrations, RLS policies, and queries that follow Supabase's maintained best practices\n---\n\n# Supabase Postgres Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/supabase-postgres-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_supabase-postgres-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "stripe-best-practices",
      displayName: "Stripe Best Practices",
      description:
        "Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes",
      maker: { name: "Stripe" },
      version: "1.0.0",
      versionId: "skv_captured_stripe-best-practices",
      stars: 2100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "stripe-best-practices",
        description:
          "Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: stripe-best-practices\ndescription: Choose the right Stripe APIs for payments, billing, and Connect, and avoid common integration mistakes\n---\n\n# Stripe Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/stripe-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_stripe-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrade-stripe",
      displayName: "Upgrade Stripe",
      description:
        "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments",
      maker: { name: "Stripe" },
      version: "1.0.0",
      versionId: "skv_captured_upgrade-stripe",
      stars: 2100,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrade-stripe",
        description:
          "Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upgrade-stripe\ndescription: Upgrade Stripe API versions, server SDKs, Stripe.js, mobile SDKs, and webhook endpoints without breaking payments\n---\n\n# Upgrade Stripe",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upgrade-stripe",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upgrade-stripe", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-navigation",
      displayName: "React Navigation",
      description:
        "Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling",
      maker: { name: "Callstack" },
      version: "1.0.0",
      versionId: "skv_captured_react-navigation",
      stars: 1700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-navigation",
        description:
          "Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: react-navigation\ndescription: Build navigation UIs with React Navigation: stacks, tabs, drawers, headers, bottom sheets, and safe area handling\n---\n\n# React Navigation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/react-navigation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-navigation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upgrading-react-native",
      displayName: "Upgrading React Native",
      description:
        "Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs",
      maker: { name: "Callstack" },
      version: "1.0.0",
      versionId: "skv_captured_upgrading-react-native",
      stars: 1700,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upgrading-react-native",
        description:
          "Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upgrading-react-native\ndescription: Upgrade a React Native app across versions with template diffs, dependency bumps, native config changes, and fixes for breaking APIs\n---\n\n# Upgrading React Native",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upgrading-react-native",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upgrading-react-native", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-iterate-pr",
      displayName: "Iterate on Pull Requests",
      description:
        "Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-iterate-pr",
      stars: 1200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-iterate-pr",
        description:
          "Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-iterate-pr\ndescription: Work a pull request until its actionable CI failures pass and the high and medium review feedback is addressed\n---\n\n# Iterate on Pull Requests",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-iterate-pr",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-iterate-pr", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-stacks",
      displayName: "Terraform Stacks",
      description:
        "Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-stacks",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-stacks",
        description:
          "Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-stacks\ndescription: Build and validate HashiCorp Terraform Stacks, including components, deployments, and orchestration rules\n---\n\n# Terraform Stacks",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-stacks",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-stacks", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-style-guide",
      displayName: "Terraform Style Guide",
      description:
        "Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-style-guide",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-style-guide",
        description:
          "Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-style-guide\ndescription: Write Terraform HCL that follows HashiCorp's style conventions for layout, naming, variables, and resources\n---\n\n# Terraform Style Guide",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-style-guide",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-style-guide", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "terraform-test",
      displayName: "Terraform Test",
      description:
        "Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations",
      maker: { name: "HashiCorp" },
      version: "1.0.0",
      versionId: "skv_captured_terraform-test",
      stars: 931,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "terraform-test",
        description:
          "Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: terraform-test\ndescription: Write and run Terraform tests with .tftest.hcl files, mocks, and assertions for modules and configurations\n---\n\n# Terraform Test",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/terraform-test",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_terraform-test", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-developer",
      displayName: "Angular Developer",
      description:
        "Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing",
      maker: { name: "Angular" },
      version: "1.0.0",
      versionId: "skv_captured_angular-developer",
      stars: 728,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-developer",
        description:
          "Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: angular-developer\ndescription: Write modern Angular: signals, forms, dependency injection, routing, SSR, accessibility, animations, and testing\n---\n\n# Angular Developer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/angular-developer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-developer", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "angular-new-app",
      displayName: "Angular New App",
      description:
        "Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling",
      maker: { name: "Angular" },
      version: "1.0.0",
      versionId: "skv_captured_angular-new-app",
      stars: 728,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "angular-new-app",
        description:
          "Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: angular-new-app\ndescription: Create a new Angular app with the Angular CLI and modern defaults for structure, tooling, and styling\n---\n\n# Angular New App",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/angular-new-app",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_angular-new-app", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-esql",
      displayName: "Elasticsearch ES|QL",
      description:
        "Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins",
      maker: { name: "Elastic" },
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-esql",
      stars: 608,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-esql",
        description:
          "Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: elasticsearch-esql\ndescription: Write and run ES|QL queries against Elasticsearch for exploration, aggregation, and joins\n---\n\n# Elasticsearch ES|QL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/elasticsearch-esql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_elasticsearch-esql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "elasticsearch-index-design",
      displayName: "Elasticsearch Index Design",
      description:
        "Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings",
      maker: { name: "Elastic" },
      version: "1.0.0",
      versionId: "skv_captured_elasticsearch-index-design",
      stars: 608,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "elasticsearch-index-design",
        description:
          "Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: elasticsearch-index-design\ndescription: Design Elasticsearch mappings for your access patterns: field types, multi-fields, doc values, and shard settings\n---\n\n# Elasticsearch Index Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/elasticsearch-index-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_elasticsearch-index-design", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-architecture-advisor",
      displayName: "ClickHouse Architecture Advisor",
      description:
        "Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload",
      maker: { name: "ClickHouse" },
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-architecture-advisor",
      stars: 570,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-architecture-advisor",
        description:
          "Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clickhouse-architecture-advisor\ndescription: Choose ingestion and data modeling patterns for ClickHouse and turn best practices into a design for your workload\n---\n\n# ClickHouse Architecture Advisor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clickhouse-architecture-advisor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-architecture-advisor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clickhouse-best-practices",
      displayName: "ClickHouse Best Practices",
      description:
        "Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts",
      maker: { name: "ClickHouse" },
      version: "1.0.0",
      versionId: "skv_captured_clickhouse-best-practices",
      stars: 570,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clickhouse-best-practices",
        description:
          "Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clickhouse-best-practices\ndescription: Review ClickHouse schemas, queries, and settings against 31 rules covering keys, types, partitioning, and inserts\n---\n\n# ClickHouse Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clickhouse-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_clickhouse-best-practices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-auth-basics",
      displayName: "Firebase Authentication",
      description:
        "Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-auth-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-auth-basics",
        description:
          "Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-auth-basics\ndescription: Set up Firebase Authentication for sign-in, user management, and secure data access with auth rules\n---\n\n# Firebase Authentication",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-auth-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-auth-basics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-basics",
      displayName: "Firebase Basics",
      description:
        "Set up the Firebase CLI, sign in, create or select a project, and download app config files",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-basics",
        description:
          "Set up the Firebase CLI, sign in, create or select a project, and download app config files",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-basics\ndescription: Set up the Firebase CLI, sign in, create or select a project, and download app config files\n---\n\n# Firebase Basics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-basics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-crashlytics",
      displayName: "Firebase Crashlytics",
      description:
        "Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-crashlytics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-crashlytics",
        description:
          "Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-crashlytics\ndescription: Set up Firebase Crashlytics, add the SDK to mobile apps, and read crash reports to find and fix their causes\n---\n\n# Firebase Crashlytics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-crashlytics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-crashlytics", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-firestore",
      displayName: "Cloud Firestore",
      description:
        "Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-firestore",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-firestore",
        description:
          "Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-firestore\ndescription: Set up and manage Cloud Firestore: data modeling, indexes, security rules, queries, and SDK integration\n---\n\n# Cloud Firestore",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-firestore",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firebase-firestore", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-hosting-basics",
      displayName: "Firebase Hosting",
      description:
        "Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-hosting-basics",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-hosting-basics",
        description:
          "Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-hosting-basics\ndescription: Deploy static sites and single-page apps to Firebase Hosting with redirects, rewrites, headers, and preview channels\n---\n\n# Firebase Hosting",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-hosting-basics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-hosting-basics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firebase-security-rules-auditor",
      displayName: "Firebase Security Rules Auditor",
      description:
        "Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes",
      maker: { name: "Firebase" },
      version: "1.0.0",
      versionId: "skv_captured_firebase-security-rules-auditor",
      stars: 517,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firebase-security-rules-auditor",
        description:
          "Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firebase-security-rules-auditor\ndescription: Audit Firestore and Cloud Storage security rules for privilege escalation, role bypasses, and unchecked writes\n---\n\n# Firebase Security Rules Auditor",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firebase-security-rules-auditor",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_firebase-security-rules-auditor", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "tavily-best-practices",
      displayName: "Tavily Best Practices",
      description:
        "Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations",
      maker: { name: "Tavily" },
      version: "1.0.0",
      versionId: "skv_captured_tavily-best-practices",
      stars: 492,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "tavily-best-practices",
        description:
          "Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: tavily-best-practices\ndescription: Add web search, content extraction, crawling, and research to apps and agents with production-ready Tavily integrations\n---\n\n# Tavily Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/tavily-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_tavily-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-code-writer",
      displayName: "Svelte Docs and Code Analysis",
      description:
        "Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them",
      maker: { name: "Svelte" },
      version: "1.0.0",
      versionId: "skv_captured_svelte-code-writer",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-code-writer",
        description:
          "Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: svelte-code-writer\ndescription: Look up Svelte 5 docs and analyze Svelte components and modules from the command line while you write them\n---\n\n# Svelte Docs and Code Analysis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/svelte-code-writer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_svelte-code-writer", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "svelte-core-bestpractices",
      displayName: "Svelte Best Practices",
      description:
        "Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration",
      maker: { name: "Svelte" },
      version: "1.0.0",
      versionId: "skv_captured_svelte-core-bestpractices",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "svelte-core-bestpractices",
        description:
          "Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: svelte-core-bestpractices\ndescription: Write fast, robust, modern Svelte 5: runes, reactivity, events, styling, and library integration\n---\n\n# Svelte Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/svelte-core-bestpractices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_svelte-core-bestpractices", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "use-railway",
      displayName: "Railway",
      description:
        "Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting",
      maker: { name: "Railway" },
      version: "1.0.0",
      versionId: "skv_captured_use-railway",
      stars: 342,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "use-railway",
        description:
          "Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: use-railway\ndescription: Deploy and operate apps on Railway: projects, services, databases, environments, domains, and troubleshooting\n---\n\n# Railway",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/use-railway",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_use-railway", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "k6",
      displayName: "k6 Load Testing",
      description:
        "Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service",
      maker: { name: "Grafana Labs" },
      version: "1.0.0",
      versionId: "skv_captured_k6",
      stars: 313,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "k6",
        description:
          "Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: k6\ndescription: Generate, validate, and review k6 load, stress, and spike test scripts, and run them against your service\n---\n\n# k6 Load Testing",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/k6",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_k6", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "promql",
      displayName: "PromQL",
      description:
        "Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts",
      maker: { name: "Grafana Labs" },
      version: "1.0.0",
      versionId: "skv_captured_promql",
      stars: 313,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "promql",
        description:
          "Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: promql\ndescription: Write, validate, and optimize PromQL for Prometheus and Grafana Mimir dashboards and alerts\n---\n\n# PromQL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/promql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_promql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-instrument",
      displayName: "Sentry Instrument",
      description:
        "Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-instrument",
      stars: 278,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-instrument",
        description:
          "Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-instrument\ndescription: Add Sentry to an app and wire up errors, tracing, logs, metrics, replay, and AI monitoring for its platform\n---\n\n# Sentry Instrument",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-instrument",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-instrument", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "sentry-setup-releases",
      displayName: "Sentry Releases",
      description:
        "Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it",
      maker: { name: "Sentry" },
      version: "1.0.0",
      versionId: "skv_captured_sentry-setup-releases",
      stars: 278,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "sentry-setup-releases",
        description:
          "Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: sentry-setup-releases\ndescription: Set up Sentry releases and deploy tracking so each issue links to the release and commit that introduced it\n---\n\n# Sentry Releases",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/sentry-setup-releases",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_sentry-setup-releases", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "react-email",
      displayName: "React Email",
      description:
        "Build HTML email templates with React Email components and render or send them with Resend",
      maker: { name: "Resend" },
      version: "1.0.0",
      versionId: "skv_captured_react-email",
      stars: 211,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "react-email",
        description:
          "Build HTML email templates with React Email components and render or send them with Resend",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: react-email\ndescription: Build HTML email templates with React Email components and render or send them with Resend\n---\n\n# React Email",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/react-email",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_react-email", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "resend",
      displayName: "Resend",
      description:
        "Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts",
      maker: { name: "Resend" },
      version: "1.0.0",
      versionId: "skv_captured_resend",
      stars: 211,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "resend",
        description:
          "Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: resend\ndescription: Send, receive, and track email with the Resend API: templates, domains, webhooks, contacts, and broadcasts\n---\n\n# Resend",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/resend",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_resend", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-connection",
      displayName: "MongoDB Connection Tuning",
      description:
        "Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-connection",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-connection",
        description:
          "Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-connection\ndescription: Configure MongoDB client pools, timeouts, and connection patterns for any driver and diagnose connection errors\n---\n\n# MongoDB Connection Tuning",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-connection",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-connection", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-query-optimizer",
      displayName: "MongoDB Query Optimizer",
      description:
        "Find why a MongoDB query is slow and fix it with the right indexes and query shape",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-query-optimizer",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-query-optimizer",
        description:
          "Find why a MongoDB query is slow and fix it with the right indexes and query shape",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-query-optimizer\ndescription: Find why a MongoDB query is slow and fix it with the right indexes and query shape\n---\n\n# MongoDB Query Optimizer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-query-optimizer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_mongodb-query-optimizer", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "mongodb-schema-design",
      displayName: "MongoDB Schema Design",
      description:
        "Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns",
      maker: { name: "MongoDB" },
      version: "1.0.0",
      versionId: "skv_captured_mongodb-schema-design",
      stars: 200,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "mongodb-schema-design",
        description:
          "Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: mongodb-schema-design\ndescription: Design MongoDB data models and review existing ones for unbounded arrays, bad embeds, and other schema anti-patterns\n---\n\n# MongoDB Schema Design",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/mongodb-schema-design",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_mongodb-schema-design", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "dt-dql-essentials",
      displayName: "Dynatrace DQL Essentials",
      description:
        "Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics",
      maker: { name: "Dynatrace" },
      version: "1.0.0",
      versionId: "skv_captured_dt-dql-essentials",
      stars: 181,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "dt-dql-essentials",
        description:
          "Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: dt-dql-essentials\ndescription: Write correct Dynatrace Query Language: core syntax, common pitfalls, and query patterns for logs, spans, and metrics\n---\n\n# Dynatrace DQL Essentials",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/dt-dql-essentials",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_dt-dql-essentials", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "firecrawl-build",
      displayName: "Firecrawl Build",
      description:
        "Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows",
      maker: { name: "Firecrawl" },
      version: "1.0.0",
      versionId: "skv_captured_firecrawl-build",
      stars: 160,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "firecrawl-build",
        description:
          "Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: firecrawl-build\ndescription: Integrate Firecrawl scraping, search, and browser actions into product code and agent workflows\n---\n\n# Firecrawl Build",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/firecrawl-build",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_firecrawl-build", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-client",
      displayName: "Apollo Client",
      description:
        "Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-client",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-client",
        description:
          "Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-client\ndescription: Build React apps with Apollo Client 4: queries, mutations, cache policies, local state, and error handling\n---\n\n# Apollo Client",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-client",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-client", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-federation",
      displayName: "Apollo Federation",
      description:
        "Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-federation",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-federation",
        description:
          "Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-federation\ndescription: Author Apollo Federation subgraph schemas with entities, keys, shared fields, and the right directives\n---\n\n# Apollo Federation",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-federation",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-federation", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "apollo-server",
      displayName: "Apollo Server",
      description:
        "Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources",
      maker: { name: "Apollo GraphQL" },
      version: "1.0.0",
      versionId: "skv_captured_apollo-server",
      stars: 131,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "apollo-server",
        description:
          "Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: apollo-server\ndescription: Build GraphQL servers with Apollo Server 5: schemas, resolvers, auth, plugins, and data sources\n---\n\n# Apollo Server",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/apollo-server",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_apollo-server", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres",
      displayName: "Neon Postgres",
      description:
        "Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas",
      maker: { name: "Neon" },
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres",
      stars: 116,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres",
        description:
          "Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: neon-postgres\ndescription: Work with Neon Postgres: pooled and direct connections, branching, migrations, autoscaling, and read replicas\n---\n\n# Neon Postgres",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/neon-postgres",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_neon-postgres", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "neon-postgres-egress-optimizer",
      displayName: "Neon Egress Optimizer",
      description:
        "Find and fix queries that overfetch and drive up Postgres network egress and database bills",
      maker: { name: "Neon" },
      version: "1.0.0",
      versionId: "skv_captured_neon-postgres-egress-optimizer",
      stars: 116,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "neon-postgres-egress-optimizer",
        description:
          "Find and fix queries that overfetch and drive up Postgres network egress and database bills",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: neon-postgres-egress-optimizer\ndescription: Find and fix queries that overfetch and drive up Postgres network egress and database bills\n---\n\n# Neon Egress Optimizer",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/neon-postgres-egress-optimizer",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_neon-postgres-egress-optimizer", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-nextjs-patterns",
      displayName: "Clerk Next.js Patterns",
      description:
        "Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct",
      maker: { name: "Clerk" },
      version: "1.0.0",
      versionId: "skv_captured_clerk-nextjs-patterns",
      stars: 94,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-nextjs-patterns",
        description:
          "Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clerk-nextjs-patterns\ndescription: Apply Clerk in Next.js with middleware, Server Actions, and caching patterns that keep auth correct\n---\n\n# Clerk Next.js Patterns",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clerk-nextjs-patterns",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-nextjs-patterns", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "clerk-setup",
      displayName: "Clerk Setup",
      description:
        "Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts",
      maker: { name: "Clerk" },
      version: "1.0.0",
      versionId: "skv_captured_clerk-setup",
      stars: 94,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "clerk-setup",
        description:
          "Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: clerk-setup\ndescription: Set up Clerk authentication in any project with the Clerk CLI and official framework quickstarts\n---\n\n# Clerk Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/clerk-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_clerk-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "unsafe-rust-review",
      displayName: "Unsafe Rust Review",
      description:
        "Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants",
      maker: { name: "Google" },
      version: "1.0.0",
      versionId: "skv_captured_unsafe-rust-review",
      stars: 84,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "unsafe-rust-review",
        description:
          "Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: unsafe-rust-review\ndescription: Write and review unsafe Rust safety docs and comments as proof obligations grounded in the Rust Reference and project invariants\n---\n\n# Unsafe Rust Review",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/unsafe-rust-review",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_unsafe-rust-review", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-error-tracking",
      displayName: "PostHog Error Tracking",
      description:
        "Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-error-tracking",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-error-tracking",
        description:
          "Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-error-tracking\ndescription: Capture exceptions in PostHog with stack traces and source maps for web, mobile, and server code\n---\n\n# PostHog Error Tracking",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-error-tracking",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_posthog-instrument-error-tracking",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-integration",
      displayName: "PostHog Integration",
      description:
        "Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-integration",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-integration",
        description:
          "Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-integration\ndescription: Add the PostHog SDK to an app with the right provider, initialization, and configuration for its framework\n---\n\n# PostHog Integration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-integration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_posthog-instrument-integration", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "posthog-instrument-llm-analytics",
      displayName: "PostHog LLM Analytics",
      description:
        "Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses",
      maker: { name: "PostHog" },
      version: "1.0.0",
      versionId: "skv_captured_posthog-instrument-llm-analytics",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "posthog-instrument-llm-analytics",
        description:
          "Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: posthog-instrument-llm-analytics\ndescription: Trace LLM calls in PostHog with token counts, latency, and cost for every provider the app uses\n---\n\n# PostHog LLM Analytics",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/posthog-instrument-llm-analytics",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_posthog-instrument-llm-analytics", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-client-api",
      displayName: "Prisma Client API",
      description:
        "Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions",
      maker: { name: "Prisma" },
      version: "1.0.0",
      versionId: "skv_captured_prisma-client-api",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-client-api",
        description:
          "Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: prisma-client-api\ndescription: Write Prisma Client queries correctly: model queries, filters, operators, relations, and transactions\n---\n\n# Prisma Client API",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/prisma-client-api",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-client-api", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "prisma-upgrade-v7",
      displayName: "Prisma 7 Upgrade",
      description:
        "Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change",
      maker: { name: "Prisma" },
      version: "1.0.0",
      versionId: "skv_captured_prisma-upgrade-v7",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "prisma-upgrade-v7",
        description:
          "Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: prisma-upgrade-v7\ndescription: Move a project from Prisma ORM 6 to 7, covering driver adapters, the new generator, and every breaking change\n---\n\n# Prisma 7 Upgrade",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/prisma-upgrade-v7",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_prisma-upgrade-v7", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-best-practices",
      displayName: "Pulumi Best Practices",
      description:
        "Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-best-practices",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-best-practices",
        description:
          "Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-best-practices\ndescription: Write and review Pulumi TypeScript and Python programs that handle outputs, secrets, and resource options correctly\n---\n\n# Pulumi Best Practices",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-best-practices",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-best-practices", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-component",
      displayName: "Pulumi Components",
      description:
        "Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-component",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-component",
        description:
          "Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-component\ndescription: Author reusable Pulumi ComponentResource classes with clean inputs, outputs, and multi-language packaging\n---\n\n# Pulumi Components",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-component",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_pulumi-component", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "pulumi-terraform-to-pulumi",
      displayName: "Terraform to Pulumi",
      description:
        "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state",
      maker: { name: "Pulumi" },
      version: "1.0.0",
      versionId: "skv_captured_pulumi-terraform-to-pulumi",
      stars: 80,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "pulumi-terraform-to-pulumi",
        description:
          "Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: pulumi-terraform-to-pulumi\ndescription: Migrate Terraform and OpenTofu projects to Pulumi by translating HCL and importing existing state\n---\n\n# Terraform to Pulumi",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/pulumi-terraform-to-pulumi",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_pulumi-terraform-to-pulumi", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "integrate-revenuecat",
      displayName: "RevenueCat Integration",
      description:
        "Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration",
      maker: { name: "RevenueCat" },
      version: "1.0.0",
      versionId: "skv_captured_integrate-revenuecat",
      stars: 79,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "integrate-revenuecat",
        description:
          "Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: integrate-revenuecat\ndescription: Add RevenueCat subscriptions to an app: dashboard setup plus Purchases SDK installation and configuration\n---\n\n# RevenueCat Integration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/integrate-revenuecat",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_integrate-revenuecat", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "building-livekit-agents",
      displayName: "LiveKit Agents",
      description:
        "Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes",
      maker: { name: "LiveKit" },
      version: "1.0.0",
      versionId: "skv_captured_building-livekit-agents",
      stars: 76,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "building-livekit-agents",
        description:
          "Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: building-livekit-agents\ndescription: Build voice and chat AI agents with LiveKit Agents: workflows, handoffs, turn handling, and latency fixes\n---\n\n# LiveKit Agents",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/building-livekit-agents",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_building-livekit-agents", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex",
      displayName: "Convex",
      description:
        "Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage",
      maker: { name: "Convex" },
      version: "1.0.0",
      versionId: "skv_captured_convex",
      stars: 69,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex",
        description:
          "Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: convex\ndescription: Build type-safe reactive backends on Convex: schema, queries, mutations, actions, auth, scheduling, and file storage\n---\n\n# Convex",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/convex",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "convex-authz",
      displayName: "Convex Authorization Audit",
      description:
        "Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id",
      maker: { name: "Convex" },
      version: "1.0.0",
      versionId: "skv_captured_convex-authz",
      stars: 69,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "convex-authz",
        description:
          "Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: convex-authz\ndescription: Audit and harden Convex apps against impersonation, missing ownership checks, and queries that leak data by id\n---\n\n# Convex Authorization Audit",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/convex-authz",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_convex-authz", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-config",
      displayName: "Netlify Configuration",
      description:
        "Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-config",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-config",
        description:
          "Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-config\ndescription: Configure Netlify builds and routing with netlify.toml, redirects, headers, and per-context environment variables\n---\n\n# Netlify Configuration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-config",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-config", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-edge-functions",
      displayName: "Netlify Edge Functions",
      description:
        "Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-edge-functions",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-edge-functions",
        description:
          "Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-edge-functions\ndescription: Write Netlify Edge Functions for auth middleware, geolocation, A/B tests, and request transforms\n---\n\n# Netlify Edge Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-edge-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-edge-functions", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "netlify-functions",
      displayName: "Netlify Functions",
      description:
        "Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs",
      maker: { name: "Netlify" },
      version: "1.0.0",
      versionId: "skv_captured_netlify-functions",
      stars: 54,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "netlify-functions",
        description:
          "Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: netlify-functions\ndescription: Write and deploy Netlify serverless functions in TypeScript, JavaScript, or Go, with streaming, cron, and background jobs\n---\n\n# Netlify Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/netlify-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_netlify-functions", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "workos",
      displayName: "WorkOS",
      description:
        "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations",
      maker: { name: "WorkOS" },
      version: "1.0.0",
      versionId: "skv_captured_workos",
      stars: 46,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "workos",
        description:
          "Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: workos\ndescription: Add WorkOS AuthKit, SSO, Directory Sync, and RBAC to an app and debug integrations\n---\n\n# WorkOS",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/workos",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_workos", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "twilio-migrate-messaging-to-verify",
      displayName: "Twilio Verify Migration",
      description:
        "Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection",
      maker: { name: "Twilio" },
      version: "1.0.0",
      versionId: "skv_captured_twilio-migrate-messaging-to-verify",
      stars: 41,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "twilio-migrate-messaging-to-verify",
        description:
          "Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: twilio-migrate-messaging-to-verify\ndescription: Replace a self-built SMS one-time-passcode flow with the Twilio Verify API for delivery, expiry, and fraud protection\n---\n\n# Twilio Verify Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/twilio-migrate-messaging-to-verify",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing(
        "skv_captured_twilio-migrate-messaging-to-verify",
        "1.0.0",
        9,
      ),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-qstash-js",
      displayName: "Upstash QStash",
      description:
        "Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK",
      maker: { name: "Upstash" },
      version: "1.0.0",
      versionId: "skv_captured_upstash-qstash-js",
      stars: 37,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-qstash-js",
        description:
          "Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upstash-qstash-js\ndescription: Run background jobs, scheduled tasks, and retried HTTP messages on serverless apps with the QStash TypeScript SDK\n---\n\n# Upstash QStash",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upstash-qstash-js",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-qstash-js", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "upstash-redis-js",
      displayName: "Upstash Redis",
      description:
        "Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes",
      maker: { name: "Upstash" },
      version: "1.0.0",
      versionId: "skv_captured_upstash-redis-js",
      stars: 37,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "upstash-redis-js",
        description:
          "Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: upstash-redis-js\ndescription: Use the Upstash Redis TypeScript SDK for caching, sessions, rate limits, and counters on serverless and edge runtimes\n---\n\n# Upstash Redis",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/upstash-redis-js",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_upstash-redis-js", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "appwrite-typescript",
      displayName: "Appwrite TypeScript",
      description:
        "Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access",
      maker: { name: "Appwrite" },
      version: "1.0.0",
      versionId: "skv_captured_appwrite-typescript",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "appwrite-typescript",
        description:
          "Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: appwrite-typescript\ndescription: Build with the Appwrite TypeScript SDK: auth, databases, storage, realtime, and server-side admin access\n---\n\n# Appwrite TypeScript",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/appwrite-typescript",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_appwrite-typescript", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-durable-functions",
      displayName: "Inngest Durable Functions",
      description:
        "Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped",
      maker: { name: "Inngest" },
      version: "1.0.0",
      versionId: "skv_captured_inngest-durable-functions",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-durable-functions",
        description:
          "Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: inngest-durable-functions\ndescription: Build Inngest functions that survive crashes, retry on failure, run on schedules, and resume where they stopped\n---\n\n# Inngest Durable Functions",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/inngest-durable-functions",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [
      firstListing("skv_captured_inngest-durable-functions", "1.0.0", 9),
    ],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "inngest-setup",
      displayName: "Inngest Setup",
      description:
        "Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints",
      maker: { name: "Inngest" },
      version: "1.0.0",
      versionId: "skv_captured_inngest-setup",
      stars: 29,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "inngest-setup",
        description:
          "Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: inngest-setup\ndescription: Add Inngest durable execution to a TypeScript project: SDK install, client config, and serve endpoints\n---\n\n# Inngest Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/inngest-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_inngest-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "temporal-cloud-setup",
      displayName: "Temporal Cloud Setup",
      description:
        "Set up Temporal Cloud end to end and run a sample workflow on it",
      maker: { name: "Temporal" },
      version: "1.0.0",
      versionId: "skv_captured_temporal-cloud-setup",
      stars: 27,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "temporal-cloud-setup",
        description:
          "Set up Temporal Cloud end to end and run a sample workflow on it",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: temporal-cloud-setup\ndescription: Set up Temporal Cloud end to end and run a sample workflow on it\n---\n\n# Temporal Cloud Setup",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/temporal-cloud-setup",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_temporal-cloud-setup", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "buildkite-migration",
      displayName: "Buildkite Migration",
      description:
        "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite",
      maker: { name: "Buildkite" },
      version: "1.0.0",
      versionId: "skv_captured_buildkite-migration",
      stars: 19,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "buildkite-migration",
        description:
          "Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: buildkite-migration\ndescription: Convert CI pipelines from Jenkins, GitHub Actions, CircleCI, GitLab CI, and Bitbucket to Buildkite\n---\n\n# Buildkite Migration",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/buildkite-migration",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_buildkite-migration", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "cockroachdb-sql",
      displayName: "CockroachDB SQL",
      description:
        "Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns",
      maker: { name: "Cockroach Labs" },
      version: "1.0.0",
      versionId: "skv_captured_cockroachdb-sql",
      stars: 5,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "cockroachdb-sql",
        description:
          "Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: cockroachdb-sql\ndescription: Write and tune SQL for CockroachDB: schema design, primary keys, type mappings, and distributed-database patterns\n---\n\n# CockroachDB SQL",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/cockroachdb-sql",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_cockroachdb-sql", "1.0.0", 9)],
  }),
  new ExploreListing({
    card: card({
      kind: "skill",
      slug: "vercel-byoc",
      displayName: "Vercel BYOC",
      description:
        "Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account",
      maker: { name: "Vercel" },
      version: "1.0.0",
      versionId: "skv_captured_vercel-byoc",
      stars: 1,
      starsCheckedAt: minutesAgo(3 * day),
    }),
    content: {
      kind: "skill",
      skill: {
        name: "vercel-byoc",
        description:
          "Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account",
        files: [
          {
            path: "SKILL.md",
            content:
              "---\nname: vercel-byoc\ndescription: Deploy an app with Vercel Bring Your Own Cloud so its functions run as AWS Lambda in your own account\n---\n\n# Vercel BYOC",
          },
        ],
        starters: [],
        source: {
          repository: "acme/skills",
          path: "skills/vercel-byoc",
          commit: "4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a",
        },
      },
    },
    setup: null,
    versions: [firstListing("skv_captured_vercel-byoc", "1.0.0", 9)],
  }),
];

export const findSampleListing = (kind: string, slug: string) =>
  sampleListings.find(
    (listing) => listing.card.kind === kind && listing.card.slug === slug,
  );
