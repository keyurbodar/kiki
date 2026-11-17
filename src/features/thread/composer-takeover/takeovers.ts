import type {
  ClarifyRow,
  EnvironmentRequestRow,
  TimelineRow,
} from "@/data/events";

export type TakeoverKind =
  | "clarify"
  | "environment"
  | "desktop"
  | "terminal"
  | "feedback";

export const takeoverKey = (kind: TakeoverKind, id: string) =>
  kind === "clarify" ? "conversation" : `${kind}:${id}`;

export const pendingClarify = (
  rows: ReadonlyArray<TimelineRow>,
): typeof ClarifyRow.Type | undefined => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row === undefined) return undefined;
    if (row.type === "user-message" && row.actor.type !== "agent")
      return undefined;
    if (row.type === "clarify") return row;
  }
  return undefined;
};

export const pendingEnvironmentRequest = (
  rows: ReadonlyArray<TimelineRow>,
): typeof EnvironmentRequestRow.Type | undefined => {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row === undefined) return undefined;
    if (row.type === "environment-request")
      return row.fulfilled ? undefined : row;
  }
  return undefined;
};
