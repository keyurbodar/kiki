import { afterEach, describe, expect, it } from "vitest";
import { quoteTargetOf } from "./quote-target";

afterEach(() => {
  document.body.innerHTML = "";
});

const TIMELINE = `
  <div data-chat-row-id="row_agent">
    <div data-slot="agent-message">
      <div data-slot="message-section"><div data-component="markdown"><p id="first">One</p></div></div>
      <div data-slot="message-section"><div data-component="markdown"><p id="second">Two</p></div></div>
      <div data-slot="message-footer"><button id="footer">Reply</button></div>
    </div>
  </div>
  <div data-chat-row-id="group:exchange:1">
    <div data-slot="work-group-panel">
      <div><div data-component="markdown"><p id="group-first">Worked</p></div></div>
      <div><div data-component="markdown"><p id="group-second">Retry added</p></div></div>
    </div>
  </div>
  <p id="loose">Outside any row</p>
`;

const mount = () => {
  document.body.innerHTML = TIMELINE;
};

const node = (id: string) => document.getElementById(id) as Element;

describe("quoteTargetOf", () => {
  it("reads the block's index among the row's markdown blocks", () => {
    mount();
    expect(quoteTargetOf(node("first"))).toEqual({
      rowKey: "row_agent",
      section: 0,
    });
    expect(quoteTargetOf(node("second"))).toEqual({
      rowKey: "row_agent",
      section: 1,
    });
  });

  it("keys a block folded into a work group by the group's row", () => {
    mount();
    expect(quoteTargetOf(node("group-second"))).toEqual({
      rowKey: "group:exchange:1",
      section: 1,
    });
  });

  it("resolves a text node through its parent", () => {
    mount();
    expect(quoteTargetOf(node("second").firstChild)).toEqual({
      rowKey: "row_agent",
      section: 1,
    });
  });

  it("refuses nodes with no quotable block behind them", () => {
    mount();
    expect(quoteTargetOf(node("loose"))).toBeNull();
    expect(quoteTargetOf(node("footer"))).toBeNull();
    expect(quoteTargetOf(null)).toBeNull();
  });
});
