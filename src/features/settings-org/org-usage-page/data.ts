import { Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import type {
  Principal,
  UsageBreakdownEntry,
  UsageBreakdownRoute,
  UsageMemberRow,
  UsageSeries,
  UsageSummary,
  UsageThreadPage,
  UsageThreadRow,
} from "./types";

type Row = Record<string, unknown>;

const row = (value: unknown): Row =>
  typeof value === "object" && value !== null ? (value as Row) : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const strOrNull = (value: unknown) =>
  typeof value === "string" ? value : null;
const num = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const bool = (value: unknown) => value === true;
const list = (value: unknown): ReadonlyArray<unknown> =>
  Array.isArray(value) ? value : [];

/**
 * Capy counts credits at 1e-5 of a dollar. Payloads that carry `costCents`
 * predate that unit, so they decode from cents instead of their own credits.
 */
const creditsOf = (value: Row, fallback = 0) => {
  const cents = num(value.costCents, Number.NaN);
  if (Number.isFinite(cents) && cents !== 0) return cents * 1000;
  return num(value.credits, num(value.totalCredits, fallback));
};

const tokensOf = (value: unknown) => {
  const tokens = row(value);
  return {
    inputTokens: num(tokens.inputTokens),
    outputTokens: num(tokens.outputTokens),
    cacheReadTokens: num(tokens.cacheReadTokens),
  };
};

const decodePeriod = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const period = row(value);
  const start = strOrNull(period.start);
  const end = strOrNull(period.end);
  return start === null || end === null ? null : { start, end };
};

const decodeIncluded = (value: unknown) => {
  const included = row(value);
  return {
    feature: str(included.feature, "usage"),
    used: num(included.used),
    granted: num(included.granted),
    resetsAt: strOrNull(included.resetsAt),
    breakdown: list(included.breakdown).map((entry) => {
      const item = row(entry);
      return {
        key: str(item.key),
        count: num(item.count),
        amount: num(item.amount),
      };
    }),
  };
};

export const decodeUsageSummary = (value: unknown): UsageSummary => {
  const summary = row(value);
  const balance =
    summary.balance === null || summary.balance === undefined
      ? null
      : row(summary.balance);
  return {
    period: decodePeriod(summary.period),
    balance:
      balance === null
        ? null
        : {
            remainingCredits: num(balance.remainingCredits),
            unlimited: bool(balance.unlimited),
          },
    included: list(summary.included).map(decodeIncluded),
  };
};

/**
 * The series arrives either as Capy's bucketed payload
 * (`{bucket, keys, buckets:[{start, end, slices}]}`) or as a flat list of
 * points (`{date, credits}`), which carries no route split. A flat point is
 * spend billed to the org, so it decodes to a single `paid` slice.
 */
export const decodeUsageSeries = (value: unknown): UsageSeries => {
  const series = row(value);
  const buckets = list(series.buckets);
  if (buckets.length > 0) {
    return {
      bucket: str(series.bucket, "day") === "hour" ? "hour" : "day",
      keys: list(series.keys).map((entry) => {
        const key = row(entry);
        return { key: str(key.key), label: str(key.label, str(key.key)) };
      }),
      buckets: buckets.map((entry) => {
        const bucket = row(entry);
        return {
          start: str(bucket.start),
          end: str(bucket.end, str(bucket.start)),
          slices: list(bucket.slices).map((slice) => {
            const item = row(slice);
            return { key: str(item.key, "paid"), credits: num(item.credits) };
          }),
          ...(bucket.includedCredits === undefined
            ? {}
            : { includedCredits: num(bucket.includedCredits) }),
        };
      }),
    };
  }
  const points = list(
    Array.isArray(value) ? value : (series.points ?? series.series),
  );
  return {
    bucket: "day",
    keys: [{ key: "paid", label: "Billed" }],
    buckets: points.map((entry) => {
      const point = row(entry);
      const start = str(point.date, str(point.start));
      return {
        start,
        end: str(point.end, start),
        slices: [{ key: "paid", credits: creditsOf(point) }],
      };
    }),
  };
};

export const decodeUsageBreakdown = (
  value: unknown,
): ReadonlyArray<UsageBreakdownRoute> => {
  const routes = new Map<string, UsageBreakdownRoute>();
  for (const [index, entry] of list(
    Array.isArray(value) ? value : row(value).routes,
  ).entries()) {
    const item = row(entry);
    const kind = str(item.kind, str(item.route, "usage"));
    const label =
      strOrNull(item.model) ??
      strOrNull(item.label) ??
      strOrNull(item.projectId) ??
      `Item ${index + 1}`;
    const route = routes.get(kind) ?? {
      route: kind,
      credits: 0,
      tokenFeeCredits: 0,
      entries: [],
      images: [],
      machines: [],
    };
    route.credits += creditsOf(item);
    route.tokenFeeCredits += num(item.tokenFeeCredits);
    routes.set(kind, {
      ...route,
      entries: [
        ...route.entries,
        {
          key: `${kind}:${label}`,
          label,
          credits: creditsOf(item),
          tokens: tokensOf(item.tokens),
        } satisfies UsageBreakdownEntry,
      ],
      machines: [
        ...route.machines,
        ...list(item.machines).map((machine) => {
          const value = row(machine);
          return {
            size: str(value.size, "standard"),
            credits: num(value.credits),
            vmMs: num(value.vmMs),
          };
        }),
      ],
      images: [
        ...route.images,
        ...list(item.images).map((image) => {
          const value = row(image);
          return {
            endpoint: str(value.endpoint, "images"),
            label: str(value.label, "Images"),
            credits: num(value.credits),
          };
        }),
      ],
    });
  }
  return [...routes.values()];
};

export const decodeUsageMembers = (
  value: unknown,
): ReadonlyArray<UsageMemberRow> =>
  list(Array.isArray(value) ? value : row(value).members).map((entry) => {
    const member = row(entry);
    const credits = creditsOf(member);
    const name = strOrNull(member.name);
    return {
      principalUserId: strOrNull(
        member.principalUserId ?? member.userId ?? member.id,
      ),
      name,
      llmCredits: creditsOf({ credits: member.llmCredits }, credits),
      vmCredits: num(member.vmCredits),
      subscriptionCredits: num(member.subscriptionCredits),
      byokCredits: num(member.byokCredits),
      imageCredits: num(member.imageCredits),
      tokenFeeCredits: num(member.tokenFeeCredits),
      totalCredits: credits,
      threads: num(member.threads),
      tokens: member.tokens === undefined ? undefined : tokensOf(member.tokens),
    };
  });

const decodeThreadRow = (value: unknown): UsageThreadRow => {
  const thread = row(value);
  return {
    jamId: str(thread.jamId, str(thread.threadId)),
    title: strOrNull(thread.title),
    principalUserId: strOrNull(
      thread.principalUserId ?? thread.userId ?? thread.ownerId,
    ),
    totalCredits: creditsOf(thread),
    dominantRoute: str(thread.dominantRoute, "paid"),
    createdAt: str(thread.createdAt),
    lastActivityAt: str(thread.lastActivityAt),
    personal: bool(thread.personal),
    channel: str(thread.channel),
    threadCount:
      thread.threadCount === undefined ? undefined : num(thread.threadCount),
    tokens: num(thread.tokens),
    machineHours: num(thread.machineHours),
  };
};

export const decodeUsageThreadPage = (value: unknown): UsageThreadPage => {
  if (Array.isArray(value)) {
    const items = value.map(decodeThreadRow);
    return {
      page: 1,
      pageCount: 1,
      totalThreads: items.length,
      items,
    };
  }
  const page = row(value);
  const items = list(page.items).map(decodeThreadRow);
  return {
    page: num(page.page, 1),
    pageCount: num(page.pageCount, 1),
    totalThreads: num(page.totalThreads, items.length),
    items,
  };
};

export const principalsOf = (
  members: ReadonlyArray<UsageMemberRow>,
): Map<string, Principal> =>
  new Map(
    members.flatMap((member) =>
      member.principalUserId === null
        ? []
        : [
            [
              member.principalUserId,
              {
                name: member.name ?? member.principalUserId,
                imageUrl: null,
                kind: "member" as const,
              } satisfies Principal,
            ] as const,
          ],
    ),
  );

export const usageScopeKey = (orgId: string, scope: Record<string, string>) =>
  `${orgId}|${JSON.stringify(scope)}`;

export type UsageScope = Record<string, string>;

const withScope = (
  endpoint:
    | "usage"
    | "usageSeries"
    | "usageBreakdown"
    | "usageMemberEntries"
    | "usageThreads",
) =>
  Atom.family((key: string) => {
    const { orgId, scope } = JSON.parse(key) as {
      orgId: string;
      scope: UsageScope;
    };
    return ApiClient.query("billing", endpoint, {
      params: { orgId },
      query: scope,
      reactivityKeys: [`billing:${orgId}`],
      timeToLive: queryTimeToLive,
    });
  });

export const usageSummaryAtom = withScope("usage");
export const usageSeriesAtom = withScope("usageSeries");
export const usageBreakdownAtom = withScope("usageBreakdown");
export const usageMembersAtom = withScope("usageMemberEntries");
export const usageThreadsAtom = withScope("usageThreads");

export const usageQueryKey = (orgId: string, scope: UsageScope) =>
  JSON.stringify({ orgId, scope });
