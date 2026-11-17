import { AsyncResult } from "effect/reactivity";
import { describe, expect, it } from "vitest";
import {
  actorChoiceLabel,
  auditQueryKey,
  defaultAuditFilters,
  hasActiveFilters,
  isSameActor,
  mergeAuditPages,
  parseAuditMembers,
} from "./audit-filters";
import { actionLabel, actorParts, subjectLabel } from "./audit-format";
import { decodeAuditPage } from "./audit-schema";

const now = Date.parse("2026-03-02T09:00:00.000Z");

const page = (ids: ReadonlyArray<string>, nextCursor: string | null) =>
  AsyncResult.success(
    decodeAuditPage({
      events: ids.map((id) => ({
        id,
        action: "member.invite",
        createdAt: now,
      })),
      nextCursor,
    }),
    { waiting: false },
  );

describe("auditQueryKey", () => {
  it("asks for everything with the default filters", () => {
    expect(auditQueryKey(defaultAuditFilters, "  ", now)).toEqual({
      order: "newest",
      actor: undefined,
      userId: undefined,
      family: undefined,
      q: undefined,
    });
  });

  it("carries the person, the family and the trimmed search", () => {
    const key = auditQueryKey(
      {
        ...defaultAuditFilters,
        actor: { kind: "human", userId: "user_sample_alex" },
        family: "members",
      },
      "  Morgan ",
      now,
    );
    expect(key.actor).toBe("human");
    expect(key.userId).toBe("user_sample_alex");
    expect(key.family).toBe("members");
    expect(key.q).toBe("Morgan");
  });

  it("turns a preset range into bounds around now", () => {
    const key = auditQueryKey(
      { ...defaultAuditFilters, date: "week" },
      "",
      now,
    );
    expect(key.from).toBeDefined();
    expect(Number.isNaN(Date.parse(key.from ?? ""))).toBe(false);
  });

  it("knows when filters are active", () => {
    expect(hasActiveFilters(defaultAuditFilters, "")).toBe(false);
    expect(
      hasActiveFilters({ ...defaultAuditFilters, family: "billing" }, ""),
    ).toBe(true);
    expect(hasActiveFilters(defaultAuditFilters, "alex")).toBe(true);
  });
});

describe("actor choices", () => {
  it("labels each kind", () => {
    const members = parseAuditMembers({
      members: [{ userId: "u1", firstName: "Alex", lastName: "Morgan" }],
    });
    expect(actorChoiceLabel({ kind: "agent" }, members)).toBe("Capy");
    expect(actorChoiceLabel({ kind: "service" }, members)).toBe("API keys");
    expect(actorChoiceLabel({ kind: "system" }, members)).toBe("System");
    expect(actorChoiceLabel({ kind: "human", userId: "u1" }, members)).toBe(
      "Alex Morgan",
    );
    expect(actorChoiceLabel({ kind: "human", userId: "gone" }, members)).toBe(
      "Former member",
    );
  });

  it("compares a chosen actor", () => {
    expect(isSameActor(null, { kind: "agent" })).toBe(false);
    expect(isSameActor({ kind: "agent" }, { kind: "agent" })).toBe(true);
    expect(
      isSameActor(
        { kind: "human", userId: "u1" },
        { kind: "human", userId: "u1" },
      ),
    ).toBe(true);
    expect(
      isSameActor(
        { kind: "human", userId: "u1" },
        { kind: "human", userId: "u2" },
      ),
    ).toBe(false);
  });
});

describe("mergeAuditPages", () => {
  it("joins chained pages and drops repeats", () => {
    const state = mergeAuditPages(
      ["", "2"],
      [page(["a", "b"], "2"), page(["b", "c"], null)],
    );
    expect(state.events.map((event) => event.id)).toEqual(["a", "b", "c"]);
    expect(state.state).toBe("complete");
    expect(state.next).toBeNull();
  });

  it("reports more while a page has a cursor", () => {
    const state = mergeAuditPages([""], [page(["a"], "9")]);
    expect(state.state).toBe("more");
    expect(state.next).toBe("9");
  });

  it("stops at a cursor that does not chain", () => {
    const state = mergeAuditPages(["", "2"], [page(["a"], "9")]);
    expect(state.events).toHaveLength(1);
    expect(state.cursors).toEqual([""]);
    expect(state.next).toBe("9");
  });

  it("loads while the next page is pending", () => {
    const state = mergeAuditPages(
      ["", "2"],
      [page(["a"], "2"), AsyncResult.initial(true)],
    );
    expect(state.state).toBe("loading");
    expect(state.next).toBe("2");
  });
});

describe("decodeAuditPage", () => {
  it("reads Capy's page shape", () => {
    const decoded = decodeAuditPage({
      events: [
        {
          id: "evt_1",
          action: "member.role_change",
          family: "members",
          createdAt: "2026-03-02T08:00:00.000Z",
          actor: {
            _tag: "human",
            person: { userId: "u1", name: "Alex Morgan", email: null },
          },
          subject: { kind: "member", label: "Sam Rivera", person: null },
          facts: [{ key: "role", value: { _tag: "text", text: "Admin" } }],
          changes: [
            {
              _tag: "value",
              field: "role",
              name: null,
              from: "Member",
              to: "Admin",
            },
          ],
        },
      ],
      nextCursor: "2",
    });
    expect(decoded.nextCursor).toBe("2");
    const [event] = decoded.events;
    expect(event?.createdAt.toISOString()).toBe("2026-03-02T08:00:00.000Z");
    expect(actionLabel(event!)).toBe("Changed role");
    expect(actorParts(event!)).toEqual(["Alex Morgan", null]);
    expect(subjectLabel(event!)).toBe("Sam Rivera");
  });

  it("reads the older flat rows the mock answers with", () => {
    const decoded = decodeAuditPage([
      {
        id: "aud_sample_001",
        action: "thread.created",
        actorId: "user_sample_alex",
        actorEmail: "alex@example.com",
        targetName: "Fix flaky checkout test",
        createdAt: "2026-03-02T08:41:00.000Z",
      },
    ]);
    const [event] = decoded.events;
    expect(event?.subject.label).toBe("Fix flaky checkout test");
    expect(actorParts(event!)[0]).toBe("alex@example.com");
    expect(decoded.nextCursor).toBeNull();
  });

  it("reads an unreadable payload as an empty page", () => {
    expect(decodeAuditPage(undefined)).toEqual({
      events: [],
      nextCursor: null,
    });
  });
});
