import { describe, expect, it } from "vitest";
import {
  webhookBatchActionFailure,
  webhookBatchActionToast,
  webhookBatchPager,
} from "./batch-action";

const result = (
  status: "collecting" | "queued" | "cancelled",
  runStatus: "failed" | "skipped" | "running" | null = null,
  failure: string | null = null,
) => ({ status, runStatus, failure });

describe("webhook batch action toasts", () => {
  it("reports races with the server", () => {
    expect(webhookBatchActionToast("flush", result("cancelled"))).toEqual({
      level: "info",
      message: "Batch was already cancelled",
    });
    expect(webhookBatchActionToast("cancel", result("queued"))).toEqual({
      level: "info",
      message: "Batch is already starting",
    });
  });

  it("reports failed and skipped runs", () => {
    expect(
      webhookBatchActionToast(
        "flush",
        result("queued", "failed", "No credits"),
      ),
    ).toEqual({ level: "error", message: "No credits" });
    expect(
      webhookBatchActionToast("flush", result("queued", "failed")),
    ).toEqual({ level: "error", message: "Could not start batch" });
    expect(
      webhookBatchActionToast("flush", result("queued", "skipped")),
    ).toEqual({ level: "info", message: "Batch was skipped" });
  });

  it("confirms success and failure", () => {
    expect(
      webhookBatchActionToast("flush", result("queued", "running")),
    ).toEqual({ level: "success", message: "Batch is starting" });
    expect(webhookBatchActionToast("cancel", result("cancelled"))).toEqual({
      level: "success",
      message: "Batch cancelled",
    });
    expect(webhookBatchActionFailure("cancel").message).toBe(
      "Could not cancel batch",
    );
  });
});

describe("webhook batch pager", () => {
  it("walks a cursor stack", () => {
    const second = webhookBatchPager.next(webhookBatchPager.first, "c1");
    expect(second).toEqual(["", "c1"]);
    expect(webhookBatchPager.current(second)).toBe("c1");
    expect(webhookBatchPager.next(second, null)).toBe(second);
    expect(webhookBatchPager.previous(second)).toEqual([""]);
    expect(webhookBatchPager.previous([""])).toEqual([""]);
  });
});
