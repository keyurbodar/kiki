import { cleanup } from "@testing-library/react";
import { DateTime } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { IssueEventId, IssueStateId } from "@/data/api/schemas/ids";
import { IssueActor, IssueEvent, IssueState } from "@/data/api/schemas/issue";
import { eventText } from "./activity-items";
import { issueStateOfType } from "./issue-header";

afterEach(cleanup);

const state = (id: string, type: "open" | "closed", isDefault = false) =>
  new IssueState({
    id: IssueStateId.make(id),
    name: id,
    type,
    icon: "empty",
    color: "gray",
    position: 0,
    isDefault,
  });

const event = (payload: unknown, actor: IssueActor | null, code?: string) =>
  new IssueEvent({
    id: IssueEventId.make("iev_sample_1"),
    kind: "created",
    actor,
    payload,
    refs: { pr_1: "acme/web#131", jam_1: "WEB-41" },
    issueCode: code ?? null,
    createdAt: DateTime.makeUnsafe("2026-11-17T10:00:00Z"),
  });

const alex = new IssueActor({
  kind: "user",
  id: "user_sample_alex",
  name: "Alex Morgan",
  code: null,
  avatarUrl: null,
  captain: false,
});

describe("issueStateOfType", () => {
  it("prefers the default state of the type", () => {
    const states = [
      state("todo", "open", true),
      state("canceled", "closed"),
      state("done", "closed", true),
    ];
    expect(issueStateOfType(states, "closed")?.id).toBe("done");
    expect(issueStateOfType(states, "open")?.id).toBe("todo");
    expect(issueStateOfType([state("x", "closed")], "closed")?.id).toBe("x");
    expect(issueStateOfType([], "open")).toBeUndefined();
  });
});

describe("eventText", () => {
  const names = (id: string) => (id === "ist_review" ? "In review" : undefined);
  it("words events the way Capy does", () => {
    expect(eventText(event({ kind: "created" }, alex), names)).toBe(
      "Alex Morgan created the issue",
    );
    expect(
      eventText(
        event(
          {
            kind: "state_changed",
            to: { id: "ist_review", name: "In review" },
          },
          alex,
        ),
        names,
      ),
    ).toBe("Alex Morgan moved the issue to In review");
    expect(
      eventText(
        event(
          { kind: "linked", target: { kind: "thread", jamId: "jam_1" } },
          alex,
        ),
        names,
      ),
    ).toBe("Alex Morgan linked WEB-41");
    expect(
      eventText(
        event(
          {
            kind: "linked",
            target: { kind: "issue", issueId: "jam_1", relation: "blocks" },
          },
          null,
          "ACME-2",
        ),
        names,
      ),
    ).toBe("Capy marked ACME-2 as blocking WEB-41");
    expect(eventText(event({ kind: "mystery" }, alex), names)).toBe(
      "This update needs a newer version of Capy",
    );
  });
});
