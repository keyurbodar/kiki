import { Schema } from "effect";
import { expect, it } from "vitest";
import { UpdateRow as UpdateRowSchema } from "@/data/events";

import { clusterSummary } from "./cluster-row";

type UpdateRow = Schema.Schema.Type<typeof UpdateRowSchema>;

const rowFrom = (value: unknown) =>
  Schema.decodeUnknownSync(UpdateRowSchema)(value);

const base = {
  id: "update:1",
  eventId: "01J0000000000000000000000Z",
  createdAt: new Date(0).toISOString(),
};

const task = (): UpdateRow =>
  rowFrom({
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

it("opens its members when the folded line is clicked", async () => {
  const { cleanup, fireEvent, render, screen } = await import(
    "@testing-library/react"
  );
  const { ClusterRow } = await import("./cluster-row");
  const cluster = {
    ...base,
    type: "cluster",
    members: [task()],
    expanded: false,
  } as unknown as Parameters<typeof ClusterRow>[0]["row"];
  render(<ClusterRow row={cluster} />);
  const trigger = screen.getByRole("button");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByText("Subagent 1 finished")).toBeNull();
  fireEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.queryByText("Subagent 1 finished")).not.toBeNull();
  cleanup();
});
