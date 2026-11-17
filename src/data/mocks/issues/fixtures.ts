import { isoMinutesAgo, people } from "../fixtures/world.ts";

export const issueComments = [
  {
    id: "cmt_sample_1",
    issueCode: "ACME-2",
    authorId: people.sam.id,
    body: "Reproduces when the checkout worker restarts mid-test.",
    createdAt: isoMinutesAgo(25),
  },
  {
    id: "cmt_sample_2",
    issueCode: "ACME-3",
    authorId: people.priya.id,
    body: "Design review is done; the settings screen is ready to ship.",
    createdAt: isoMinutesAgo(48),
  },
] as const;

export const issueLinks = [
  {
    id: "lnk_sample_1",
    issueCode: "ACME-2",
    url: "https://github.com/acme/web/pull/131",
    title: "acme/web#131",
    kind: "pull",
    createdAt: isoMinutesAgo(20),
  },
  {
    id: "lnk_sample_2",
    issueCode: "ACME-5",
    url: "https://linear.example.com/acme/SEARCH-14",
    title: "SEARCH-14",
    kind: "linear",
    createdAt: isoMinutesAgo(60 * 18),
  },
] as const;

export const issueRelations = [
  {
    id: "rel_sample_1",
    issueCode: "ACME-2",
    relatedCode: "ACME-1",
    kind: "parent",
    createdAt: isoMinutesAgo(60 * 22),
  },
  {
    id: "rel_sample_2",
    issueCode: "ACME-3",
    relatedCode: "ACME-2",
    kind: "related",
    createdAt: isoMinutesAgo(75),
  },
] as const;

export const issueActivity = [
  {
    id: "act_sample_1",
    issueCode: "ACME-2",
    actorId: people.alex.id,
    summary: "Moved to In progress",
    createdAt: isoMinutesAgo(10),
  },
  {
    id: "act_sample_2",
    issueCode: "ACME-3",
    actorId: people.sam.id,
    summary: "Linked pull request acme/web#128",
    createdAt: isoMinutesAgo(30),
  },
] as const;

export const threadIssueIds: Readonly<Record<string, string>> = {
  jam_sample_0001: "ACME-2",
  jam_sample_0002: "ACME-3",
  jam_sample_0003: "ACME-4",
  jam_sample_0004: "ACME-5",
  jam_sample_0005: "ACME-6",
  jam_sample_0007: "ACME-8",
} as const;
