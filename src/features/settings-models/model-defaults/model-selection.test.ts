import { describe, expect, it } from "vitest";
import {
  extractCatalog,
  filterCatalog,
  formatTokens,
  fromSelection,
  parseTokens,
  providerOf,
  selectionEffort,
  selectionName,
  toSelection,
} from "./model-selection";

const catalog = [
  {
    id: "anthropic/claude-opus",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    context: 200_000,
  },
  {
    id: "openai/gpt",
    name: "GPT",
    provider: "openai",
    efforts: ["low", "high"],
    context: 128_000,
  },
];

describe("model selection", () => {
  it("accepts bare and structured payloads", () => {
    expect(fromSelection("anthropic/claude-opus")?.modelId).toBe(
      "anthropic/claude-opus",
    );
    expect(
      fromSelection({ modelId: "openai/gpt", reasoningMode: "high" }),
    ).toEqual({
      modelId: "openai/gpt",
      reasoningMode: "high",
      modes: undefined,
    });
    expect(fromSelection(undefined)).toBeNull();
    expect(fromSelection({})).toBeNull();
  });

  it("round-trips a selection through the API shape", () => {
    const selection = {
      modelId: "openai/gpt",
      reasoningMode: "high",
      modes: { fast: true },
    };
    expect(toSelection(fromSelection(selection))).toEqual(selection);
    expect(toSelection(null)).toBeNull();
  });

  it("reads the catalog out of the endpoint payload", () => {
    expect(
      extractCatalog([
        { id: "x/y", name: "Y", provider: "x" },
        { id: "a/b", name: "B", limits: { context: 9000 } },
      ]),
    ).toEqual([
      { id: "x/y", name: "Y", provider: "x", efforts: [] },
      { id: "a/b", name: "B", provider: "capy", efforts: [], context: 9000 },
    ]);
    expect(extractCatalog(null)).toEqual([]);
    expect(
      extractCatalog({ models: [{ id: "x/y", name: "Y", provider: "x" }] }),
    ).toEqual([]);
  });

  it("names a selection, its provider and its effort", () => {
    expect(selectionName(catalog, { modelId: "anthropic/claude-opus" })).toBe(
      "Claude Opus 5.5",
    );
    expect(selectionName(catalog, { modelId: "unknown/model" })).toBe("model");
    expect(selectionName(catalog, null)).toBe("No model");
    expect(providerOf(catalog, { modelId: "unknown/model" })).toBe("unknown");
    expect(providerOf(catalog, null)).toBe("capy");
    expect(selectionEffort(catalog, { modelId: "anthropic/claude-opus" })).toBe(
      "Medium",
    );
    expect(
      selectionEffort(catalog, {
        modelId: "anthropic/claude-opus",
        reasoningMode: "xhigh",
      }),
    ).toBe("Extra high");
  });

  it("filters the catalog case-insensitively", () => {
    expect(filterCatalog(catalog, "GPT").map((entry) => entry.id)).toEqual([
      "openai/gpt",
    ]);
    expect(filterCatalog(catalog, "  ")).toEqual(catalog);
    expect(filterCatalog(catalog, "nothing")).toEqual([]);
  });
});

describe("token input", () => {
  it("parses grouped and plain integers and rejects bad input", () => {
    expect(parseTokens("120,000")).toBe(120_000);
    expect(parseTokens(" 50000 ")).toBe(50_000);
    expect(parseTokens("")).toBeNull();
    expect(parseTokens("12.5")).toBeNull();
    expect(parseTokens("abc")).toBeNull();
  });

  it("formats thousands with grouping", () => {
    expect(formatTokens(400_000)).toBe("400,000");
  });
});
