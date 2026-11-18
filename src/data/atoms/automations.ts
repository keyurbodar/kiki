import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";
import { idleAtom } from "./idle.ts";

export type ThreadAutomation = {
  id: string;
  name: string;
  enabled: boolean;
  nextRunAt?: Date;
  /** The schedule summary, for example "Daily at 9:00 AM (UTC)". */
  schedule?: string;
};

export const automationsAtom = Atom.family((orgId: string) =>
  ApiClient.query("automations", "list", {
    params: { orgId },
    query: {},
    reactivityKeys: [`automation:${orgId}`, `automation_run:${orgId}`],
    timeToLive: queryTimeToLive,
  }),
);

/** The automations list while the org is unknown, so nothing requests a placeholder org. */
export const idleAutomationsAtom = idleAtom<unknown>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toDate = (value: unknown) => {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** Maps undecoded `automations.list` rows; a failed or pending list is empty. */
export function toThreadAutomations(
  result: AsyncResult.AsyncResult<unknown, unknown>,
): ThreadAutomation[] {
  const rows = Option.getOrUndefined(AsyncResult.value(result));
  const items = isRecord(rows) && Array.isArray(rows.items) ? rows.items : rows;
  if (!Array.isArray(items)) return [];
  return items.flatMap((row) => {
    if (!isRecord(row) || typeof row.id !== "string") return [];
    return [
      {
        id: row.id,
        name: typeof row.name === "string" ? row.name : "",
        enabled: row.enabled !== false,
        nextRunAt: toDate(row.nextRunAt),
        schedule: typeof row.schedule === "string" ? row.schedule : undefined,
      },
    ];
  });
}
