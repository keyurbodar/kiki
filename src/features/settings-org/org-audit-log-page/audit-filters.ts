import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import {
  customDateBounds,
  type DateRange,
  dateRangeBounds,
  isCustomDateRange,
} from "@/components/view-toolbar";
import type { AuditQueryKey } from "@/data/atoms/audit";
import {
  type AuditEvent,
  type AuditFamily,
  type AuditOrder,
  type AuditPage,
  decodeAuditPage,
} from "./audit-schema";

export type ActorChoice =
  | { readonly kind: "agent" | "service" | "system" }
  | { readonly kind: "human"; readonly userId: string };

export type AuditFilters = {
  readonly actor: ActorChoice | null;
  readonly family: AuditFamily | null;
  readonly date: DateRange | null;
  readonly order: AuditOrder;
};

export const defaultAuditFilters: AuditFilters = {
  actor: null,
  family: null,
  date: null,
  order: "newest",
};

export const hasActiveFilters = (filters: AuditFilters, search: string) =>
  filters.actor !== null ||
  filters.family !== null ||
  filters.date !== null ||
  search.trim() !== "";

/** An org member as the actor filter lists them. */
export type AuditMember = {
  readonly userId: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly imageUrl: string | null;
};

export const memberLabel = (member: AuditMember) =>
  member.name ?? member.email ?? member.userId;

const stringOrNull = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null;

/** Reads the members list loosely: its endpoint is not decoded yet. */
export const parseAuditMembers = (
  value: unknown,
): ReadonlyArray<AuditMember> => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === "object" &&
        value !== null &&
        "members" in value &&
        Array.isArray(value.members)
      ? value.members
      : [];
  return rows.flatMap((row: unknown) => {
    if (typeof row !== "object" || row === null) return [];
    const record = row as Record<string, unknown>;
    const userId = stringOrNull(record.userId) ?? stringOrNull(record.id);
    if (userId === null) return [];
    const fullName = [
      stringOrNull(record.firstName),
      stringOrNull(record.lastName),
    ]
      .filter((part) => part !== null)
      .join(" ");
    return [
      {
        userId,
        name: stringOrNull(record.name) ?? stringOrNull(fullName),
        email: stringOrNull(record.email),
        imageUrl: stringOrNull(record.imageUrl),
      },
    ];
  });
};

export const actorChoiceLabel = (
  choice: ActorChoice,
  members: ReadonlyArray<AuditMember>,
) => {
  switch (choice.kind) {
    case "agent":
      return "Capy";
    case "service":
      return "API keys";
    case "system":
      return "System";
    case "human": {
      const member = members.find((row) => row.userId === choice.userId);
      return member === undefined ? "Former member" : memberLabel(member);
    }
  }
};

export const isSameActor = (current: ActorChoice | null, choice: ActorChoice) =>
  current !== null &&
  current.kind === choice.kind &&
  (current.kind !== "human" ||
    (choice.kind === "human" && current.userId === choice.userId));

const dateQuery = (date: DateRange | null, now: number) => {
  if (date === null) return {};
  if (isCustomDateRange(date)) {
    const bounds = customDateBounds(date.from, date.to);
    return bounds === undefined
      ? {}
      : {
          from: bounds.after.toISOString(),
          to: new Date(bounds.before.getTime() + 1).toISOString(),
        };
  }
  const bounds = dateRangeBounds(date, now);
  return {
    from: bounds.after?.toISOString(),
    to: bounds.before?.toISOString(),
  };
};

/** The list query the filters and the debounced search ask for. `now` pins preset ranges for the page's lifetime. */
export const auditQueryKey = (
  filters: AuditFilters,
  search: string,
  now: number,
): AuditQueryKey => ({
  order: filters.order,
  actor: filters.actor?.kind,
  userId: filters.actor?.kind === "human" ? filters.actor.userId : undefined,
  family: filters.family ?? undefined,
  q: search.trim() === "" ? undefined : search.trim(),
  ...dateQuery(filters.date, now),
});

export type AuditPagesState = {
  readonly events: ReadonlyArray<AuditEvent>;
  /** The cursors whose pages are loaded and chain into each other. */
  readonly cursors: ReadonlyArray<string>;
  /** The cursor to load next, or null once the trail is complete. */
  readonly next: string | null;
  readonly state: "more" | "complete" | "loading" | "failed";
  readonly forbidden: boolean;
};

/** Decodes one page result, so a loose payload becomes the page the ledger renders. */
export const decodePageResult = <E>(
  result: AsyncResult.AsyncResult<unknown, E>,
): AsyncResult.AsyncResult<AuditPage, E> =>
  AsyncResult.isSuccess(result)
    ? AsyncResult.success(decodeAuditPage(result.value), { waiting: false })
    : (result as AsyncResult.AsyncResult<AuditPage, E>);

const isForbidden = <E>(result: AsyncResult.AsyncResult<AuditPage, E>) =>
  Option.match(AsyncResult.error(result), {
    onNone: () => false,
    onSome: (error) =>
      typeof error === "object" &&
      error !== null &&
      "_tag" in error &&
      error._tag === "capy/Forbidden",
  });

/** Joins loaded pages in cursor order, dropping repeats, and says what the list can do next. */
export function mergeAuditPages<E>(
  cursors: ReadonlyArray<string>,
  results: ReadonlyArray<AsyncResult.AsyncResult<AuditPage, E>>,
): AuditPagesState {
  const seen = new Set<string>();
  let events: ReadonlyArray<AuditEvent> = [];
  let expected = "";
  for (const [index, cursor] of cursors.entries()) {
    if (cursor !== expected)
      return {
        events,
        cursors: cursors.slice(0, index),
        next: expected,
        state: "more",
        forbidden: false,
      };
    const result = results[index];
    const page =
      result === undefined
        ? undefined
        : Option.getOrUndefined(AsyncResult.value(result));
    if (page === undefined) {
      const failed = result !== undefined && AsyncResult.isFailure(result);
      return {
        events,
        cursors: cursors.slice(0, index),
        next: cursor,
        state: failed ? "failed" : "loading",
        forbidden: failed && isForbidden(result),
      };
    }
    const list = page.events;
    events = [...events, ...list.filter((event) => !seen.has(event.id))];
    for (const event of list) seen.add(event.id);
    if (page.nextCursor === null)
      return {
        events,
        cursors: cursors.slice(0, index + 1),
        next: null,
        state: "complete",
        forbidden: false,
      };
    expected = page.nextCursor;
  }
  return { events, cursors, next: expected, state: "more", forbidden: false };
}
