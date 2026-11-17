import { isoMinutesAgo, people, projects } from "../fixtures/world.ts";

export type MemoryStatus = "active" | "forgotten";

export interface MemoryRow {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly kind: "project" | "preference" | "person";
  readonly scope: string;
  readonly sourceThreadId: string | null;
  readonly projectId: string | null;
  readonly authorId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly status: MemoryStatus;
  readonly forgottenAt: string | null;
}

export const volumeId = "vol_sample_acme";
export const otherVolumeId = "vol_sample_team";

export const memories: ReadonlyArray<MemoryRow> = [
  {
    id: "mem_sample_checkout",
    title: "Checkout retries",
    body: "Retry gateway timeouts twice before failing the checkout test.",
    kind: "project",
    scope: "project-web",
    sourceThreadId: "jam_sample_0001",
    projectId: projects.web.id,
    authorId: people.alex.id,
    createdAt: isoMinutesAgo(12 * 24 * 60),
    updatedAt: isoMinutesAgo(2 * 60),
    status: "active",
    forgottenAt: null,
  },
  {
    id: "mem_sample_review",
    title: "Review preferences",
    body: "Keep pull request reviews short and mention the affected file paths.",
    kind: "preference",
    scope: "organization",
    sourceThreadId: null,
    projectId: null,
    authorId: people.sam.id,
    createdAt: isoMinutesAgo(20 * 24 * 60),
    updatedAt: isoMinutesAgo(6 * 60),
    status: "active",
    forgottenAt: null,
  },
  {
    id: "mem_sample_docs",
    title: "Docs owner",
    body: "Priya maintains the getting started guide and reviews API docs changes.",
    kind: "person",
    scope: "project-docs",
    sourceThreadId: "jam_sample_0005",
    projectId: projects.docs.id,
    authorId: people.priya.id,
    createdAt: isoMinutesAgo(8 * 24 * 60),
    updatedAt: isoMinutesAgo(24 * 60),
    status: "active",
    forgottenAt: null,
  },
  {
    id: "mem_sample_legacy",
    title: "Legacy deploy window",
    body: "The legacy site deploys on Thursday afternoons.",
    kind: "project",
    scope: "project-old",
    sourceThreadId: null,
    projectId: projects.old.id,
    authorId: people.jordan.id,
    createdAt: isoMinutesAgo(60 * 24 * 60),
    updatedAt: isoMinutesAgo(30 * 24 * 60),
    status: "forgotten",
    forgottenAt: isoMinutesAgo(30 * 24 * 60),
  },
];
