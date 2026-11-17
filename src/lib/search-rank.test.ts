import { describe, expect, it } from "vitest";
import { rankByQuery } from "./search-rank";

const labels = (items: ReadonlyArray<string>, query: string) =>
  rankByQuery(items, (item) => [item], query);

describe("rankByQuery", () => {
  it("returns every item in order for a blank query", () => {
    const items = ["Beta", "Alpha"];
    expect(rankByQuery(items, (item) => [item], "   ")).toBe(items);
  });

  it("ranks exact, prefix, word and substring hits in that order", () => {
    expect(labels(["Rebase main", "Main", "Base", "Mainline"], "ma")).toEqual([
      "Main",
      "Mainline",
      "Rebase main",
    ]);
    expect(labels(["database", "Base", "Base camp"], "base")).toEqual([
      "Base",
      "Base camp",
      "database",
    ]);
  });

  it("treats camel case and digit changes as word starts", () => {
    expect(labels(["Unrelated", "openRouter"], "router")).toEqual([
      "openRouter",
    ]);
    expect(labels(["gpt5mini"], "mini")).toEqual(["gpt5mini"]);
  });

  it("matches initials and word-start runs fuzzily", () => {
    expect(labels(["Git Hub", "Gather"], "gh")).toEqual(["Git Hub"]);
    expect(labels(["Linear Issues"], "lisu")).toEqual([]);
  });

  it("drops a single-letter hit inside a word", () => {
    expect(labels(["Cobalt"], "b")).toEqual([]);
  });

  it("needs every word of a multi-word query", () => {
    expect(labels(["Pull request review", "Pull"], "pull review")).toEqual([
      "Pull request review",
    ]);
  });

  it("keeps ties in their original order", () => {
    expect(labels(["Team b", "Team a"], "team")).toEqual(["Team b", "Team a"]);
  });

  it("weighs secondary fields half and only on word hits", () => {
    const items = [
      { name: "Zeta", note: "alpha build" },
      { name: "Alphabet", note: "" },
      { name: "Gamma", note: "xalpha" },
    ];
    const ranked = rankByQuery(
      items,
      (item) => [item.name, item.note],
      "alpha",
    );
    expect(ranked.map((item) => item.name)).toEqual(["Alphabet", "Zeta"]);
  });
});
