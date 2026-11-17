import { expect, it } from "vitest";
import { UpdateRow as UpdateRowSchema } from "@/data/events";
import { Schema } from "effect";

import { clusterSummary } from "./cluster-row";

type UpdateRow = Schema.Schema.Type<typeof UpdateRowSchema>;

const rowFrom = (value: unknown) => Schema.decodeUnknownSync(UpdateRowSchema)(value);

const base = {
  id: "update:1",
  eventId: "01J0000000000000000000000",
  createdAt: new Date(0),
};

const task = (): UpdateRow => rowFrom({
  ...base,
  type: "update",
  kind: "task",
  childJamId: "jam_1",
  reference: { kind: "task", localIndex: 1 },
  outcome: "completed",
  summary: "Done",
  attachments: [],
});

it("pluralizes update counts", () => {
  expect(clusterSummary([task(), task()])).toBe("2 subagent reports");
  expect(clusterSummary([task()])).toBe("subagent report");
});
