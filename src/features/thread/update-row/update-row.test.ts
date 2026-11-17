import { expect, it } from "vitest";
import type { UpdateRow } from "@/data/events";
import { updateLabel, updateSource, updateStatus } from "./update-row";

const base = {
  id: "update:1",
  eventId: "01J0000000000000000000000" as UpdateRow["eventId"],
  createdAt: new Date(0),
};

it("labels review updates from their issue count", () => {
  const row: UpdateRow = { ...base, type: "update", kind: "review", prNumber: 12, issues: 2 };
  expect(updateLabel(row)).toBe("Review left 2 issues on PR #12");
  expect(updateStatus(row)).toBe("attention");
  expect(updateSource(row)).toBe("review");
});

it("labels operation results and watch endings", () => {
  const row: UpdateRow = {
    ...base,
    type: "update",
    kind: "operation",
    operationId: "op_1" as UpdateRow["operationId"],
    toolCallId: "tc_1" as UpdateRow["toolCallId"],
    blocks: [],
    isError: false,
    commandLabel: "bun run build",
  };
  expect(updateLabel(row)).toBe("bun run build, finished in the background");
  expect(updateStatus(row)).toBe("success");
});

it("infers notice source and status from the notification key", () => {
  const row: UpdateRow = {
    ...base,
    type: "update",
    kind: "notice",
    notificationKey: "pr_transition",
    summary: "PR #4 merged",
    prTransition: {
      repoFullName: "example/repo",
      prNumber: 4,
      transition: "merged",
    },
  };
  expect(updateSource(row)).toBe("github");
  expect(updateStatus(row)).toBe("success");
});
