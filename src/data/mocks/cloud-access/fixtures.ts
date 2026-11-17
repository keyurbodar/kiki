import { isoMinutesAgo, org, people, projects } from "../fixtures/world.ts";

export interface CloudAccessTarget {
  readonly id: string;
  readonly name: string;
  readonly provider: "GitHub" | "Linear" | "Slack";
  readonly projectId: string;
  readonly status: "connected" | "needs_attention" | "disconnected";
  readonly externalId: string;
  readonly lastCheckedAt: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
}

export const targets: ReadonlyArray<CloudAccessTarget> = [
  {
    id: "cat_sample_github",
    name: "Acme GitHub",
    provider: "GitHub",
    projectId: projects.web.id,
    status: "connected",
    externalId: "acme",
    lastCheckedAt: isoMinutesAgo(15),
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(30 * 24 * 60),
  },
  {
    id: "cat_sample_linear",
    name: "Acme Linear",
    provider: "Linear",
    projectId: projects.api.id,
    status: "needs_attention",
    externalId: "ACME",
    lastCheckedAt: isoMinutesAgo(4 * 60),
    createdBy: people.sam.id,
    createdAt: isoMinutesAgo(12 * 24 * 60),
  },
  {
    id: "cat_sample_slack",
    name: "Acme Slack",
    provider: "Slack",
    projectId: projects.docs.id,
    status: "connected",
    externalId: "acme-docs",
    lastCheckedAt: isoMinutesAgo(60),
    createdBy: people.priya.id,
    createdAt: isoMinutesAgo(8 * 24 * 60),
  },
];

export const providerScopes: Readonly<
  Record<CloudAccessTarget["provider"], ReadonlyArray<string>>
> = {
  GitHub: ["repo", "read:org"],
  Linear: ["read", "write"],
  Slack: ["channels:read", "chat:write"],
};

export const organizationName = org.name;
