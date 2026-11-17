import { isoMinutesAgo, people, projects, threads } from "../fixtures/world.ts";

export interface PluginVersion {
  readonly id: string;
  readonly pluginKey: string;
  readonly displayName: string;
  readonly version: string;
  readonly changelog: string;
  readonly manifest: Record<string, unknown>;
  readonly iconUrl: string;
  readonly publishedAt: string;
}

export interface PluginInstallation {
  readonly id: string;
  readonly pluginKey: string;
  readonly displayName: string;
  readonly version: string;
  readonly versionId: string;
  readonly status: "connected" | "needs_review" | "updating" | "failed";
  readonly threadIds: ReadonlyArray<string>;
  readonly projectId: string | null;
  readonly installedBy: string;
  readonly installedAt: string;
  readonly updatedAt: string;
  readonly updateAvailable: boolean;
  readonly rollbackVersion: string | null;
  readonly rollbackToVersion: string | null;
  readonly lastSyncedAt: string;
  readonly servers: ReadonlyArray<PluginServerConnection>;
  readonly errorMessage: string | null;
}

export interface PluginServerConnection {
  readonly serverKey: string;
  readonly name: string;
  readonly status: "connected" | "disconnected" | "needs_auth";
  readonly connectedBy: string | null;
  readonly connectedAt: string | null;
}

export interface MarketplaceListing {
  readonly id: string;
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly author: string;
  readonly latestVersion: string;
  readonly latestVersionId: string;
  readonly iconUrl: string;
  readonly featured: boolean;
  readonly installed: boolean;
  readonly category: string;
  readonly tags: ReadonlyArray<string>;
  readonly repository: string;
  readonly updatedAt: string;
}

export interface ThreadPluginBinding {
  readonly id: string;
  readonly threadId: string;
  readonly installationId: string;
  readonly pluginKey: string;
  readonly displayName: string;
  readonly version: string;
  readonly status: "enabled" | "disabled";
  readonly addedBy: string;
  readonly addedAt: string;
}

export const sampleVersions: ReadonlyArray<PluginVersion> = [
  {
    id: "plugver_sample_ci_1_4_0",
    pluginKey: "ci-helper",
    displayName: "CI Helper",
    version: "1.4.0",
    changelog:
      "Adds retry hints for flaky checks and a compact status summary.",
    manifest: {
      name: "ci-helper",
      version: "1.4.0",
      description: "Checks and retries from inside a thread",
      permissions: ["read:pulls", "write:comments"],
      servers: [
        { key: "checks", name: "Checks", transport: "http" },
        { key: "logs", name: "Logs", transport: "http" },
      ],
    },
    iconUrl: "https://plugins.example.com/ci-helper/1.4.0/icon.svg",
    publishedAt: isoMinutesAgo(2 * 24 * 60),
  },
  {
    id: "plugver_sample_ci_1_3_2",
    pluginKey: "ci-helper",
    displayName: "CI Helper",
    version: "1.3.2",
    changelog: "Fixes a timeout when a check queue is empty.",
    manifest: {
      name: "ci-helper",
      version: "1.3.2",
      description: "Checks and retries from inside a thread",
      permissions: ["read:pulls"],
      servers: [{ key: "checks", name: "Checks", transport: "http" }],
    },
    iconUrl: "https://plugins.example.com/ci-helper/1.3.2/icon.svg",
    publishedAt: isoMinutesAgo(12 * 24 * 60),
  },
  {
    id: "plugver_sample_notes_2_0_1",
    pluginKey: "release-notes",
    displayName: "Release Notes",
    version: "2.0.1",
    changelog: "Groups changelog entries by area and supports release drafts.",
    manifest: {
      name: "release-notes",
      version: "2.0.1",
      description: "Draft and organise release notes",
      permissions: ["read:issues", "write:files"],
      servers: [{ key: "changelog", name: "Changelog", transport: "http" }],
    },
    iconUrl: "https://plugins.example.com/release-notes/2.0.1/icon.svg",
    publishedAt: isoMinutesAgo(5 * 24 * 60),
  },
  {
    id: "plugver_sample_docs_0_9_0",
    pluginKey: "docs-search",
    displayName: "Docs Search",
    version: "0.9.0",
    changelog: "First public release with workspace search and page previews.",
    manifest: {
      name: "docs-search",
      version: "0.9.0",
      description: "Search documentation without leaving a thread",
      permissions: ["read:files"],
      servers: [{ key: "docs", name: "Docs search", transport: "http" }],
    },
    iconUrl: "https://plugins.example.com/docs-search/0.9.0/icon.svg",
    publishedAt: isoMinutesAgo(8 * 24 * 60),
  },
];

export const sampleInstallations: ReadonlyArray<PluginInstallation> = [
  {
    id: "plugininst_sample_ci",
    pluginKey: "ci-helper",
    displayName: "CI Helper",
    version: "1.3.2",
    versionId: "plugver_sample_ci_1_3_2",
    status: "needs_review",
    threadIds: [threads.checkoutTest.id, threads.bundler.id],
    projectId: projects.web.id,
    installedBy: people.sam.id,
    installedAt: isoMinutesAgo(20 * 24 * 60),
    updatedAt: isoMinutesAgo(60),
    updateAvailable: true,
    rollbackVersion: null,
    rollbackToVersion: null,
    lastSyncedAt: isoMinutesAgo(15),
    servers: [
      {
        serverKey: "checks",
        name: "Checks",
        status: "connected",
        connectedBy: people.sam.id,
        connectedAt: isoMinutesAgo(20 * 24 * 60),
      },
      {
        serverKey: "logs",
        name: "Logs",
        status: "needs_auth",
        connectedBy: null,
        connectedAt: null,
      },
    ],
    errorMessage: null,
  },
  {
    id: "plugininst_sample_notes",
    pluginKey: "release-notes",
    displayName: "Release Notes",
    version: "2.0.1",
    versionId: "plugver_sample_notes_2_0_1",
    status: "connected",
    threadIds: [threads.gettingStarted.id],
    projectId: projects.docs.id,
    installedBy: people.priya.id,
    installedAt: isoMinutesAgo(9 * 24 * 60),
    updatedAt: isoMinutesAgo(3 * 60),
    updateAvailable: false,
    rollbackVersion: null,
    rollbackToVersion: null,
    lastSyncedAt: isoMinutesAgo(8),
    servers: [
      {
        serverKey: "changelog",
        name: "Changelog",
        status: "connected",
        connectedBy: people.priya.id,
        connectedAt: isoMinutesAgo(9 * 24 * 60),
      },
    ],
    errorMessage: null,
  },
];

export const sampleThreadPlugins: ReadonlyArray<ThreadPluginBinding> = [
  {
    id: "plugthread_sample_ci_checkout",
    threadId: threads.checkoutTest.id,
    installationId: "plugininst_sample_ci",
    pluginKey: "ci-helper",
    displayName: "CI Helper",
    version: "1.3.2",
    status: "enabled",
    addedBy: people.sam.id,
    addedAt: isoMinutesAgo(18 * 24 * 60),
  },
  {
    id: "plugthread_sample_ci_bundler",
    threadId: threads.bundler.id,
    installationId: "plugininst_sample_ci",
    pluginKey: "ci-helper",
    displayName: "CI Helper",
    version: "1.3.2",
    status: "enabled",
    addedBy: people.casey.id,
    addedAt: isoMinutesAgo(6 * 24 * 60),
  },
  {
    id: "plugthread_sample_notes_docs",
    threadId: threads.gettingStarted.id,
    installationId: "plugininst_sample_notes",
    pluginKey: "release-notes",
    displayName: "Release Notes",
    version: "2.0.1",
    status: "enabled",
    addedBy: people.priya.id,
    addedAt: isoMinutesAgo(8 * 24 * 60),
  },
];

export const sampleMarketplace: ReadonlyArray<MarketplaceListing> = [
  {
    id: "plug_sample_ci",
    key: "ci-helper",
    displayName: "CI Helper",
    description: "Inspect checks and retry failed runs from a thread.",
    author: "Acme platform",
    latestVersion: "1.4.0",
    latestVersionId: "plugver_sample_ci_1_4_0",
    iconUrl: "https://plugins.example.com/ci-helper/1.4.0/icon.svg",
    featured: true,
    installed: true,
    category: "developer-tools",
    tags: ["ci", "checks"],
    repository: "acme/ci-helper",
    updatedAt: isoMinutesAgo(2 * 24 * 60),
  },
  {
    id: "plug_sample_notes",
    key: "release-notes",
    displayName: "Release Notes",
    description: "Draft changelogs and group release entries by area.",
    author: "Acme docs",
    latestVersion: "2.0.1",
    latestVersionId: "plugver_sample_notes_2_0_1",
    iconUrl: "https://plugins.example.com/release-notes/2.0.1/icon.svg",
    featured: false,
    installed: true,
    category: "productivity",
    tags: ["releases", "docs"],
    repository: "acme/release-notes",
    updatedAt: isoMinutesAgo(5 * 24 * 60),
  },
  {
    id: "plug_sample_docs",
    key: "docs-search",
    displayName: "Docs Search",
    description: "Search your documentation without leaving the conversation.",
    author: "Acme docs",
    latestVersion: "0.9.0",
    latestVersionId: "plugver_sample_docs_0_9_0",
    iconUrl: "https://plugins.example.com/docs-search/0.9.0/icon.svg",
    featured: true,
    installed: false,
    category: "productivity",
    tags: ["search", "docs"],
    repository: "acme/docs-search",
    updatedAt: isoMinutesAgo(8 * 24 * 60),
  },
];
