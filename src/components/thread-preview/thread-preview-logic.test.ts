import { describe, expect, it } from "vitest";
import {
  asAsk,
  asMachine,
  automationName,
  crewWithoutAsks,
  isCaptain,
  limitSection,
  machineLabel,
  type PreviewAsk,
  type PreviewThread,
  previewOrigin,
  threadAsks,
  threadCode,
} from "./thread-preview-logic";

const thread = (overrides: Partial<PreviewThread> = {}): PreviewThread =>
  ({
    id: "jam_main",
    needsYou: true,
    status: "waiting",
    ask: null,
    crewCount: undefined,
    ...overrides,
  }) as PreviewThread;

const ask = (overrides: Partial<PreviewAsk>): PreviewAsk => ({
  key: "a",
  threadId: "jam_main",
  text: "Approve the plan",
  ...overrides,
});

describe("threadCode", () => {
  it("prefixes the project code", () => {
    expect(threadCode({ threadNumber: 12 }, "ACME")).toBe("ACME-12");
  });
  it("falls back to a bare number", () => {
    expect(threadCode({ threadNumber: 12 }, undefined)).toBe("#12");
  });
  it("is null without a number", () => {
    expect(threadCode({ threadNumber: null }, "ACME")).toBeNull();
  });
});

describe("narrowing undecoded fields", () => {
  it("reads machines", () => {
    expect(asMachine({ kind: "device", name: "workstation" })).toEqual({
      kind: "device",
      name: "workstation",
    });
    expect(asMachine(null)).toBeUndefined();
    expect(machineLabel({ kind: "device", name: "workstation" })).toBe(
      "workstation",
    );
    expect(machineLabel({ kind: "cloud" })).toBe("Cloud");
  });
  it("reads asks and automations", () => {
    expect(asAsk({ key: "k", text: "Go?" })).toEqual({
      key: "k",
      threadId: "",
      text: "Go?",
    });
    expect(asAsk("nope")).toBeUndefined();
    expect(automationName({ name: "Nightly" })).toBe("Nightly");
    expect(automationName(undefined)).toBeUndefined();
  });
  it("shows only Slack and Linear origins", () => {
    expect(previewOrigin("slack")).toBe("slack");
    expect(previewOrigin("linear")).toBe("linear");
    expect(previewOrigin("web")).toBeUndefined();
    expect(previewOrigin("github")).toBeUndefined();
  });
});

describe("limitSection", () => {
  it("caps at three until the section is expanded", () => {
    const items = [1, 2, 3, 4, 5];
    expect(limitSection([], "crew", items)).toEqual([1, 2, 3]);
    expect(limitSection(["crew"], "crew", items)).toEqual(items);
    expect(limitSection(["tasks"], "crew", items)).toEqual([1, 2, 3]);
  });
});

describe("threadAsks", () => {
  it("shows nothing unless the thread needs you and is not working", () => {
    expect(threadAsks(thread({ needsYou: false }), [ask({})]).header).toEqual(
      [],
    );
    expect(threadAsks(thread({ status: "working" }), [ask({})]).header).toEqual(
      [],
    );
  });

  it("uses the thread's own live asks", () => {
    const own = ask({ key: "own" });
    const { header } = threadAsks(thread(), [
      own,
      ask({ key: "stale", stale: true }),
      ask({ key: "other", threadId: "jam_other" }),
    ]);
    expect(header).toEqual([own]);
  });

  it("falls back to the card's ask when there are no own asks", () => {
    const { header } = threadAsks(
      thread({ ask: { key: "card", text: "Hi" } }),
      [],
    );
    expect(header.map((a) => a.key)).toEqual(["card"]);
  });

  it("groups crew asks by cause for captains only", () => {
    const captain = thread({ crewCount: 2, ask: { key: "card" } });
    const asks = [
      ask({ key: "x", threadId: "jam_a", causeKey: "deploy" }),
      ask({ key: "y", threadId: "jam_b", causeKey: "deploy" }),
      ask({ key: "z", threadId: "jam_c" }),
      ask({ key: "own" }),
    ];
    const { header, groups } = threadAsks(captain, asks);
    expect(header.map((a) => a.key)).toEqual(["card"]);
    expect(groups.map(([key, items]) => [key, items.length])).toEqual([
      ["deploy", 2],
      ["jam_c:z", 1],
    ]);
    expect(threadAsks(thread(), asks).groups).toEqual([]);
  });
});

describe("crewWithoutAsks", () => {
  const crew = [
    { id: "jam_a", title: "A", needsYou: true },
    { id: "jam_b", title: "B", needsYou: false },
  ];
  it("drops members that need you while asks are loading", () => {
    expect(crewWithoutAsks(crew, undefined, []).map((m) => m.id)).toEqual([
      "jam_b",
    ]);
  });
  it("drops members already listed under Asks", () => {
    const groups = [["k", [ask({ threadId: "jam_b" })]] as const];
    expect(crewWithoutAsks(crew, [], groups).map((m) => m.id)).toEqual([
      "jam_a",
    ]);
  });
  it("detects captains by crew count", () => {
    expect(isCaptain({ crewCount: 0 })).toBe(true);
    expect(isCaptain({ crewCount: undefined })).toBe(false);
  });
});
