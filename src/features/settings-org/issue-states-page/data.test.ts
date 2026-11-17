import { describe, expect, it } from "vitest";
import {
  decodeCounts,
  decodeLabels,
  decodeStates,
  issueStateChange,
} from "./data";

describe("issue states data", () => {
  it("decodes states from both shapes", () => {
    const state = decodeStates({
      states: [
        {
          id: "a",
          name: "Todo",
          type: "open",
          icon: "empty",
          color: "gray",
          position: 1,
          isDefault: true,
        },
      ],
    })[0];
    expect(state).toMatchObject({
      id: "a",
      name: "Todo",
      type: "open",
      isDefault: true,
    });
    expect(decodeStates([{ id: "b", name: "Done" }])[0]).toMatchObject({
      icon: "empty",
      color: "gray",
      type: "open",
    });
  });

  it("decodes labels and counts", () => {
    expect(
      decodeLabels({ labels: [{ id: "l", name: "Bug", color: "red" }] }),
    ).toEqual([{ id: "l", name: "Bug", color: "red" }]);
    expect(decodeCounts({ counts: { a: 3, b: "bad" } })).toEqual({
      a: 3,
      b: 0,
    });
  });

  it("sends only changed state fields", () => {
    const state = {
      id: "a",
      name: "Todo",
      type: "open" as const,
      icon: "empty",
      color: "gray",
      position: 0,
      isDefault: true,
    };
    expect(issueStateChange(state, { name: "Todo", icon: "check" })).toEqual({
      icon: "check",
    });
  });
});
