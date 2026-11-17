import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { makeThreadFixtures, TimelineRow } from "@/data/events";
import {
  pendingClarify,
  pendingEnvironmentRequest,
  takeoverKey,
} from "./takeovers";

const rows = makeThreadFixtures().rows.map((row) =>
  Schema.decodeUnknownSync(TimelineRow)(row),
);

describe("composer takeovers", () => {
  it("keys clarify as the conversation and the rest by id", () => {
    expect(takeoverKey("clarify", "toolu_1")).toBe("conversation");
    expect(takeoverKey("environment", "toolu_1")).toBe("environment:toolu_1");
  });

  it("finds the latest clarify until a person replies", () => {
    expect(pendingClarify(rows)?.type).toBe("clarify");
    const reply = rows.find(
      (row) => row.type === "user-message" && row.actor.type !== "agent",
    );
    expect(reply).toBeDefined();
    expect(
      pendingClarify([...rows, ...(reply ? [reply] : [])]),
    ).toBeUndefined();
  });

  it("finds the latest unfulfilled environment request", () => {
    const request = pendingEnvironmentRequest(rows);
    expect(request?.request.variables).toEqual(["SAMPLE_API_KEY"]);
    expect(
      pendingEnvironmentRequest(
        rows.map((row) =>
          row.type === "environment-request"
            ? { ...row, fulfilled: true }
            : row,
        ),
      ),
    ).toBeUndefined();
  });
});
