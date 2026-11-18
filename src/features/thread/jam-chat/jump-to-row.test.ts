import { afterEach, describe, expect, it, vi } from "vitest";
import type { TimelineRow } from "@/data/events";
import { JUMP_LEAD, jumpToRow, rowForJump } from "./jump-to-row";

afterEach(() => {
  document.body.innerHTML = "";
});

const rect = (top: number, left: number, width: number, height: number) => ({
  top,
  left,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const rows = [
  {
    id: "row_agent",
    type: "agent-message",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAA1",
  },
  {
    id: "row_user",
    type: "user-message",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAA2",
  },
  {
    id: "group:exchange:1",
    type: "work-group",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAA3",
    entries: [{ id: "row_activity", type: "activity" }],
  },
  {
    id: "row_cluster",
    type: "cluster",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAA4",
    members: [{ id: "row_update", type: "update" }],
  },
] as unknown as readonly TimelineRow[];

const TIMELINE = `
  <div data-chat-row-id="row_agent">
    <div data-slot="message-section" id="sec_0">One</div>
    <div data-slot="message-section" id="sec_1">Two</div>
  </div>
  <div data-chat-row-id="group:exchange:1">
    <div data-slot="message-section" id="sec_grouped">Grouped</div>
  </div>
`;

const mount = () => {
  const scroll = document.createElement("div");
  scroll.innerHTML = TIMELINE;
  scroll.getBoundingClientRect = () => rect(0, 0, 837, 800) as DOMRect;
  Object.defineProperty(scroll, "scrollHeight", { value: 2000 });
  Object.defineProperty(scroll, "clientHeight", { value: 800 });
  scroll.scrollTop = 100;
  document.body.append(scroll);
  const section = (id: string) => document.getElementById(id) as HTMLElement;
  section("sec_0").getBoundingClientRect = () =>
    rect(300, 0, 800, 20) as DOMRect;
  section("sec_1").getBoundingClientRect = () =>
    rect(900, 0, 800, 20) as DOMRect;
  section("sec_grouped").getBoundingClientRect = () =>
    rect(5000, 0, 800, 20) as DOMRect;
  return scroll;
};

const list = () => ({
  scrollToOffset: vi.fn(),
  scrollToIndex: vi.fn(),
});

describe("rowForJump", () => {
  it("resolves a message id and a chat row key", () => {
    expect(rowForJump(rows, "row_agent")?.id).toBe("row_agent");
    expect(rowForJump(rows, "group:exchange:1")?.id).toBe("group:exchange:1");
  });

  it("resolves a cluster member to the cluster that holds it", () => {
    expect(rowForJump(rows, "row_update")?.id).toBe("row_cluster");
  });

  it("returns nothing for a row that is not in the timeline", () => {
    expect(rowForJump(rows, "row_missing")).toBeUndefined();
  });
});

describe("jumpToRow", () => {
  it("scrolls so the quoted section lands under the lead and takes focus", () => {
    const scroll = mount();
    const target = { rowKey: "row_agent", section: 1, index: 0 };
    const api = list();
    const landed = jumpToRow(api, scroll, target);
    expect(api.scrollToOffset).toHaveBeenCalledWith({
      offset: 100 + 900 - 0 - JUMP_LEAD,
      animated: true,
    });
    expect(landed?.id).toBe("sec_1");
    expect(document.activeElement?.id).toBe("sec_1");
    expect(landed?.getAttribute("tabindex")).toBe("-1");
    expect(api.scrollToIndex).not.toHaveBeenCalled();
  });

  it("clamps a section that would scroll past the end of the list", () => {
    const scroll = mount();
    const api = list();
    jumpToRow(api, scroll, {
      rowKey: "group:exchange:1",
      section: 0,
      index: 2,
    });
    expect(api.scrollToOffset).toHaveBeenCalledWith({
      offset: 2000 - 800,
      animated: true,
    });
  });

  it("falls back to the row when the section is not rendered", () => {
    const scroll = mount();
    const api = list();
    const landed = jumpToRow(api, scroll, {
      rowKey: "row_agent",
      section: 7,
      index: 0,
    });
    expect(landed?.getAttribute("data-chat-row-id")).toBe("row_agent");
  });

  it("asks the list for an index when the row is not mounted yet", () => {
    const scroll = mount();
    const api = list();
    const landed = jumpToRow(api, scroll, {
      rowKey: "row_user",
      section: 0,
      index: 3,
    });
    expect(landed).toBeNull();
    expect(api.scrollToIndex).toHaveBeenCalledWith({
      index: 3,
      animated: true,
      viewPosition: 0,
    });
    expect(api.scrollToOffset).not.toHaveBeenCalled();
  });

  it("does nothing without a scroll container", () => {
    expect(
      jumpToRow(list(), null, { rowKey: "row_agent", section: 0, index: 0 }),
    ).toBeNull();
  });
});
