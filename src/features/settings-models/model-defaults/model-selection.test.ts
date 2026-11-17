import { describe, expect, it } from "vitest";
import {
  fallbackCatalog,
  filterCatalog,
  formatTokens,
  fromSelection,
  parseTokens,
  selectionEffort,
  selectionName,
  toSelection,
} from "./model-selection";

describe("model selection", () => {
  it("accepts both the bare and structured org payloads", () => {
    expect(fromSelection("anthropic/claude-opus")?.modelId).toBe(
      "anthropic/claude-opus",
    );
    expect(
      fromSelection({ modelId: "openai/gpt", reasoningMode: "high" }),
    ).toEqual({ modelId: "openai/gpt", reasoningMode: "high", modes: undefined });
    expect(fromSelection(undefined)).toBeNull();
  });

  it("round-trips a selection through the API shape", () => {
    const selection = {
      modelId: "openai/gpt",
      reasoningMode: "high",
      modes: { fast: true },
    };
    expect(toSelection(fromSelection(selection))).toEqual({
      modelId: "openai/gpt",
      reasoningMode: "high",
      modes: { fast: true },
    });
  });

  it("shows fallback names and effort labels", () => {
    expect(selectionName(fallbackCatalog, { modelId: "unknown/model" })).toBe(
      "model",
    );
    expect(selectionEffort(fallbackCatalog, { modelId: "anthropic/claude-opus" })).toBe(
      "Medium",
    );
    expect(selectionName(fallbackCatalog, null)).toBe("No model");
  });

  it("filters the catalog case-insensitively", () => {
    expect(filterCatalog(fallbackCatalog, "GPT").map((entry) => entry.id)).toEqual([
      "openai/gpt",
    ]);
    expect(filterCatalog(fallbackCatalog, "nothing")).toEqual([]);
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
