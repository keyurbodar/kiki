import { expect, it } from "vitest";
import { UpdateRow as UpdateRowSchema } from "@/data/events";
import type { Schema } from "effect";

type UpdateRow = Schema.Schema.Type<typeof UpdateRowSchema>;
import { clusterSummary } from "./cluster-row";

const base = {
  id: "update:1",
  eventId: "01J0000000000000000000000" as UpdateRow["eventId"],
  createdAt: new Date(0),
};

const task = (): UpdateRow => ({
  ...base,
  type: "update",
  kind: "task",
  childJamId: "jam_1" as UpdateRow["childJamId"],
  reference: { kind: "task", localIndex: 1 },
  outcome: "completed",
  summary: "Done",
  attachments: [],
});

it("pluralizes update counts", () => {
  expect(clusterSummary([task(), task()])).toBe("2 subagent reports");
  expect(clusterSummary([task()])).toBe("subagent report");
});
