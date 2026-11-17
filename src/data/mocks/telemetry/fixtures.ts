import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people, projects, repos } from "../fixtures/world.ts";

export interface BrowserIssue {
  readonly id: string;
  readonly title: string;
  readonly kind: "error" | "performance" | "hydration";
  readonly level: "error" | "warning" | "info";
  readonly message: string;
  readonly url: string;
  readonly repoId: string;
  readonly projectId: string;
  readonly occurrences: number;
  readonly affectedUsers: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly ignored: boolean;
  readonly resolved: boolean;
  readonly assigneeId: string | null;
}

export const sampleBrowserIssues: ReadonlyArray<BrowserIssue> = [
  {
    id: "browser_issue_checkout",
    title: "Checkout step fails on slow connections",
    kind: "error",
    level: "error",
    message: "Timeout while loading payment methods",
    url: "https://acme.example.com/checkout",
    repoId: repos[0].id,
    projectId: projects.web.id,
    occurrences: 42,
    affectedUsers: 18,
    firstSeenAt: isoMinutesAgo(6 * 24 * 60),
    lastSeenAt: isoMinutesAgo(8),
    ignored: false,
    resolved: false,
    assigneeId: people.alex.id,
  },
  {
    id: "browser_issue_hydration",
    title: "Hydration mismatch on settings page",
    kind: "hydration",
    level: "warning",
    message: "Text content did not match during hydration",
    url: "https://acme.example.com/settings",
    repoId: repos[0].id,
    projectId: projects.web.id,
    occurrences: 17,
    affectedUsers: 9,
    firstSeenAt: isoMinutesAgo(3 * 24 * 60),
    lastSeenAt: isoMinutesAgo(46),
    ignored: true,
    resolved: false,
    assigneeId: null,
  },
  {
    id: "browser_issue_latency",
    title: "Orders endpoint is slow for large accounts",
    kind: "performance",
    level: "warning",
    message: "Long task exceeded the warning threshold",
    url: "https://acme.example.com/orders",
    repoId: repos[1].id,
    projectId: projects.api.id,
    occurrences: 8,
    affectedUsers: 4,
    firstSeenAt: isoMinutesAgo(12 * 24 * 60),
    lastSeenAt: isoMinutesAgo(3 * 60),
    ignored: false,
    resolved: true,
    assigneeId: people.jordan.id,
  },
];

export interface ErrorSample {
  readonly id: string;
  readonly message: string;
  readonly stack: string;
  readonly level: string;
  readonly service: string;
  readonly occurredAt: string;
}

export interface SpanSample {
  readonly id: string;
  readonly traceId: string;
  readonly name: string;
  readonly durationMs: number;
  readonly status: "ok" | "error";
  readonly service: string;
  readonly startedAt: string;
}

export const sampleErrors: ReadonlyArray<ErrorSample> = [
  {
    id: "err_sample_gateway",
    message: "Gateway timeout while retrying checkout",
    stack: "CheckoutService.retry at checkout.ts:88",
    level: "error",
    service: "acme-web",
    occurredAt: isoMinutesAgo(10),
  },
  {
    id: "err_sample_search",
    message: "Search index unavailable",
    stack: "SearchClient.query at search.ts:41",
    level: "warning",
    service: "acme-api",
    occurredAt: isoMinutesAgo(90),
  },
];

export const sampleSpans: ReadonlyArray<SpanSample> = [
  {
    id: "span_sample_checkout",
    traceId: "trc_sample_1",
    name: "POST /checkout",
    durationMs: 840,
    status: "error",
    service: "acme-web",
    startedAt: isoMinutesAgo(10),
  },
  {
    id: "span_sample_orders",
    traceId: "trc_sample_2",
    name: "GET /orders",
    durationMs: 120,
    status: "ok",
    service: "acme-api",
    startedAt: isoMinutesAgo(20),
  },
];

export const ingestedAt = () => DateTime.formatIso(minutesAgo(0));
