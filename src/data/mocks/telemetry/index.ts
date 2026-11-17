import { Effect, Ref } from "effect";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type BrowserIssue,
  type ErrorSample,
  ingestedAt,
  type SpanSample,
  sampleBrowserIssues,
  sampleErrors,
  sampleSpans,
} from "./fixtures.ts";

type Status = "ignored" | "resolved";

const queryText = (query: Record<string, unknown>, key: string) => {
  const value = query[key];
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : "";
  return typeof value === "string" ? value : "";
};

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

const withRepoNames = (
  issue: BrowserIssue,
  repos: ReadonlyArray<{ readonly id: string; readonly fullName: string }>,
) => ({
  ...issue,
  repo: repos.find((repo) => repo.id === issue.repoId)?.fullName ?? "acme/web",
});

export const TelemetryMock = mockGroup("telemetry", (handlers) =>
  Effect.gen(function* () {
    const db = yield* MockDb;
    const issues = yield* Ref.make<ReadonlyArray<BrowserIssue>>([
      ...sampleBrowserIssues,
    ]);
    const errors = yield* Ref.make<ReadonlyArray<ErrorSample>>([
      ...sampleErrors,
    ]);
    const spans = yield* Ref.make<ReadonlyArray<SpanSample>>([...sampleSpans]);

    const find = (id: string) =>
      Effect.gen(function* () {
        const rows = yield* Ref.get(issues);
        const issue = rows.find((row) => row.id === id);
        if (!issue) {
          return yield* Effect.die(new Error(`telemetry.issues: no row ${id}`));
        }
        return issue;
      });

    const setStatus = (id: string, status: Status, value: boolean) =>
      Effect.gen(function* () {
        const current = yield* find(id);
        const updated = { ...current, [status]: value };
        yield* Ref.update(issues, (rows) =>
          rows.map((row) => (row.id === id ? updated : row)),
        );
        return updated;
      });

    return handlers
      .handle("listIssues", ({ query }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(issues);
          const repos = yield* Ref.get(db.repos);
          const status = queryText(query, "status");
          const search = queryText(query, "search").toLowerCase();
          return rows
            .filter((row) => {
              if (status === "ignored") return row.ignored;
              if (status === "resolved") return row.resolved;
              if (status === "open") return !row.ignored && !row.resolved;
              return true;
            })
            .filter((row) => row.title.toLowerCase().includes(search))
            .map((row) => withRepoNames(row, repos));
        }),
      )
      .handle("ignoreIssue", ({ params }) =>
        setStatus(params.issueId, "ignored", true),
      )
      .handle("resolveIssue", ({ params }) =>
        setStatus(params.issueId, "resolved", true),
      )
      .handle("unignoreIssue", ({ params }) =>
        setStatus(params.issueId, "ignored", false),
      )
      .handle("unresolveIssue", ({ params }) =>
        setStatus(params.issueId, "resolved", false),
      )
      .handle("ingestErrors", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const batch = Array.isArray(input.errors) ? input.errors : [input];
          const rows = batch.map((entry): ErrorSample => {
            const value =
              typeof entry === "object" && entry !== null
                ? (entry as Record<string, unknown>)
                : {};
            return {
              id: newId("terr"),
              message: text(value.message, "Unknown browser error"),
              stack: text(value.stack, ""),
              level: text(value.level, "error"),
              service: text(value.service, "acme-web"),
              occurredAt: ingestedAt(),
            };
          });
          yield* Ref.update(errors, (current) => [...current, ...rows]);
          return { ok: true, ingested: rows.length, errors: rows };
        }),
      )
      .handle("ingestSpans", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const batch = Array.isArray(input.spans) ? input.spans : [input];
          const rows = batch.map((entry): SpanSample => {
            const value =
              typeof entry === "object" && entry !== null
                ? (entry as Record<string, unknown>)
                : {};
            const duration =
              typeof value.durationMs === "number"
                ? value.durationMs
                : typeof value.duration === "number"
                  ? value.duration
                  : 0;
            return {
              id: newId("tspan"),
              traceId: text(value.traceId, "trc_sample_1"),
              name: text(value.name, "unknown.span"),
              durationMs: duration,
              status: value.status === "error" ? "error" : "ok",
              service: text(value.service, "acme-web"),
              startedAt: ingestedAt(),
            };
          });
          yield* Ref.update(spans, (current) => [...current, ...rows]);
          return { ok: true, ingested: rows.length, spans: rows };
        }),
      );
  }),
);
