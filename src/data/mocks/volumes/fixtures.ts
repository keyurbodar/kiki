import {
  automations,
  captains,
  driveFiles,
  isoMinutesAgo,
  people,
  projects,
  threads,
  viewer,
} from "../fixtures/world.ts";

/**
 * Capy Drive sample data for the Acme org. Each volume is one drive scope; its
 * versions are listed oldest first and each holds the full file set at that
 * point, so the mock can derive manifests, folder pages, changes and per-file
 * history without storing them separately.
 */

const hour = 60;
const day = 24 * hour;

/** Pads a tag into an id that matches Capy's id patterns. */
const sampleId = (prefix: string, tag: string, length: number) =>
  `${prefix}_${tag.toUpperCase().padEnd(length, "0")}`;

export const volumeId = (tag: string) => sampleId("vol", `01S${tag}`, 26);
export const versionId = (tag: string) => sampleId("vver", `01S${tag}`, 26);
export const shareId = (tag: string) => `dsh_${`sample${tag}`.padEnd(24, "x")}`;

export interface FixtureFile {
  readonly path: string;
  readonly content: string;
  readonly mode?: number;
}

export interface FixtureVersion {
  readonly id: string;
  readonly kind: "autosave" | "checkpoint";
  readonly createdAt: string;
  readonly threadId: string | null;
  readonly threadTitle: string | null;
  readonly authorName: string | null;
  readonly files: ReadonlyArray<FixtureFile>;
}

export interface FixtureScope {
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}

export interface FixtureVolume {
  readonly id: string;
  readonly namespace: string;
  readonly name: string;
  readonly description: string | null;
  readonly archived: boolean;
  readonly scope: FixtureScope;
  readonly versions: ReadonlyArray<FixtureVersion>;
}

export interface FixtureShare {
  readonly id: string;
  readonly volumeId: string;
  readonly path: string;
  readonly visibility: "private" | "org" | "public";
  readonly createdBy: string | null;
  readonly createdAt: string;
}

const noScope: FixtureScope = {
  projectId: null,
  userId: null,
  automationId: null,
  captainJamId: null,
};

const fullName = (person: { firstName: string; lastName: string }) =>
  `${person.firstName} ${person.lastName}`;

const [releaseCaptain, docsCaptain] = captains;
const [nightlyDeps] = automations;

const orgAgents = `# Acme agent instructions

- Use bun for every JavaScript project.
- Open pull requests against main and keep them small.
- Never commit secrets or customer data.
`;

const releaseNotesSkill = `---
name: release-notes
description: Draft release notes from the merged pull requests since the last tag.
---

# Release notes

1. List the pull requests merged since the last release tag.
2. Group them by area and write one line per change.
3. Link each line to its pull request.
`;

const triageSkill = `---
name: triage
description: Label and prioritise new issues in the Acme tracker.
---

# Triage

Read each new issue, pick one area label and one priority, and ask for a reproduction when steps are missing.
`;

const styleGuide = `# Writing style

Write in plain language. Prefer short sentences, active voice and concrete examples.
`;

const checkoutSpec = `# Checkout retry

The checkout test fails when the payment stub answers slower than 2 seconds.

## Plan

1. Wait for the payment response instead of a fixed timeout.
2. Retry the stub call once before failing.
`;

const checkoutSpecV2 = `${checkoutSpec}
## Status

Fixed in the latest release; the retry is covered by the integration suite.
`;

const latencyCsv = `day,p50_ms,p95_ms
mon,182,410
tue,176,398
wed,190,455
thu,171,377
fri,169,362
`;

const webAgents = `# Web app instructions

Run \`bun run test\` before opening a pull request.
`;

const captainNotes = `# Release captain notes

- Cut the release branch on Monday.
- Collect the crew's reports before tagging.
`;

const crewRules = `# Crew rules

Each crew thread owns one pull request and reports back when CI is green.
`;

const weekReport = `# Week 9 report

Three pull requests merged, one rolled back. The checkout fix shipped on Thursday.
`;

export const sampleVolumes: ReadonlyArray<FixtureVolume> = [
  {
    id: volumeId("ORG"),
    namespace: "org",
    name: "Acme",
    description: null,
    archived: false,
    scope: noScope,
    versions: [
      {
        id: versionId("ORG1"),
        kind: "checkpoint",
        createdAt: isoMinutesAgo(9 * day),
        threadId: threads.incidents.id,
        threadTitle: threads.incidents.title,
        authorName: fullName(people.sam),
        files: [
          { path: "AGENTS.md", content: orgAgents },
          { path: "guides/style.md", content: styleGuide },
        ],
      },
      {
        id: versionId("ORG2"),
        kind: "autosave",
        createdAt: isoMinutesAgo(2 * day),
        threadId: null,
        threadTitle: null,
        authorName: fullName(viewer),
        files: [
          { path: "AGENTS.md", content: orgAgents },
          { path: "guides/style.md", content: styleGuide },
          { path: "skills/release-notes/SKILL.md", content: releaseNotesSkill },
          { path: "skills/triage/SKILL.md", content: triageSkill },
        ],
      },
    ],
  },
  {
    id: volumeId("PERSONAL"),
    namespace: "user",
    name: "Your drive",
    description: null,
    archived: false,
    scope: { ...noScope, userId: viewer.id },
    versions: [],
  },
  {
    id: volumeId("WEB"),
    namespace: "project",
    name: projects.web.name,
    description: null,
    archived: false,
    scope: { ...noScope, projectId: projects.web.id },
    versions: [
      {
        id: versionId("WEB1"),
        kind: "checkpoint",
        createdAt: isoMinutesAgo(5 * day),
        threadId: threads.checkoutTest.id,
        threadTitle: threads.checkoutTest.title,
        authorName: fullName(people.alex),
        files: [
          { path: "AGENTS.md", content: webAgents },
          { path: "specs/checkout-retry.md", content: checkoutSpec },
        ],
      },
      {
        id: versionId("WEB2"),
        kind: "checkpoint",
        createdAt: isoMinutesAgo(3 * hour),
        threadId: threads.bundler.id,
        threadTitle: threads.bundler.title,
        authorName: fullName(people.jordan),
        files: [
          { path: "AGENTS.md", content: webAgents },
          { path: "specs/checkout-retry.md", content: checkoutSpecV2 },
          { path: "reports/latency-week-9.csv", content: latencyCsv },
        ],
      },
    ],
  },
  {
    id: volumeId("WEBYOU"),
    namespace: "project-user",
    name: `Your drive in ${projects.web.name}`,
    description: null,
    archived: false,
    scope: { ...noScope, projectId: projects.web.id, userId: viewer.id },
    versions: [
      {
        id: versionId("WEBYOU1"),
        kind: "autosave",
        createdAt: isoMinutesAgo(day),
        threadId: null,
        threadTitle: null,
        authorName: fullName(viewer),
        files: [
          {
            path: "drafts/ideas.md",
            content: "# Ideas\n\n- Cache the product list on the edge.\n",
          },
        ],
      },
    ],
  },
  {
    id: volumeId("DOCS"),
    namespace: "project",
    name: projects.docs.name,
    description: null,
    archived: false,
    scope: { ...noScope, projectId: projects.docs.id },
    versions: [],
  },
  {
    id: volumeId("CAP1"),
    namespace: "captain",
    name: releaseCaptain.name,
    description: null,
    archived: false,
    scope: { ...noScope, captainJamId: releaseCaptain.id },
    versions: [
      {
        id: versionId("CAP11"),
        kind: "checkpoint",
        createdAt: isoMinutesAgo(40),
        threadId: releaseCaptain.id,
        threadTitle: releaseCaptain.name,
        authorName: fullName(people.alex),
        files: [
          { path: "NOTES.md", content: captainNotes },
          { path: "CREW.md", content: crewRules },
          { path: "reports/week-9.md", content: weekReport },
        ],
      },
    ],
  },
  {
    id: volumeId("CAP2"),
    namespace: "captain",
    name: docsCaptain.name,
    description: null,
    archived: false,
    scope: { ...noScope, captainJamId: docsCaptain.id },
    versions: [
      {
        id: versionId("CAP21"),
        kind: "checkpoint",
        createdAt: isoMinutesAgo(day + 2 * hour),
        threadId: docsCaptain.id,
        threadTitle: docsCaptain.name,
        authorName: fullName(people.priya),
        files: [{ path: "NOTES.md", content: "# Docs captain notes\n" }],
      },
    ],
  },
  {
    id: volumeId("AUTODEPS"),
    namespace: "automation",
    name: nightlyDeps.name,
    description: null,
    archived: false,
    scope: { ...noScope, automationId: nightlyDeps.id },
    versions: [
      {
        id: versionId("AUTODEPS1"),
        kind: "autosave",
        createdAt: isoMinutesAgo(7 * hour),
        threadId: null,
        threadTitle: null,
        authorName: null,
        files: [
          {
            path: "state/last-run.json",
            content: '{\n  "outdated": 3,\n  "checkedAt": "nightly"\n}\n',
          },
        ],
      },
    ],
  },
];

export const sampleShares: ReadonlyArray<FixtureShare> = [
  {
    id: shareId("spec"),
    volumeId: volumeId("WEB"),
    path: "specs/checkout-retry.md",
    visibility: "public",
    createdBy: fullName(people.alex),
    createdAt: isoMinutesAgo(2 * hour),
  },
  {
    id: shareId("style"),
    volumeId: volumeId("ORG"),
    path: "guides/style.md",
    visibility: "org",
    createdBy: fullName(people.sam),
    createdAt: isoMinutesAgo(3 * day),
  },
];

/** Capy Drive storage limit for the sample org: 10 GB. */
export const sampleStorageLimitBytes = 10 * 1024 ** 3;

/** Still-undecoded agent context preview, kept from the first volumes mock. */
export const agentContext = {
  title: "Checkout retry context",
  summary:
    "The checkout test times out when the payment gateway is slow. The draft pull retries gateway timeouts.",
  sources: [
    { path: driveFiles[0].path, excerpt: "Retry gateway timeouts twice." },
    { path: driveFiles[2].path, excerpt: "Release 2.4 ships the retry." },
  ],
};
