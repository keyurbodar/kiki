import { describe, expect, it } from "vitest";
import {
  builtInDefaultModel,
  fromSelection,
  resolveDefaults,
} from "./model-selection";

describe("default model resolution", () => {
  it("falls back to the built-in default when nobody set a model", () => {
    const resolved = resolveDefaults({
      webValue: null,
      orgValue: null,
      surfaceValues: {},
    });
    expect(resolved.org).toEqual(builtInDefaultModel);
    expect(resolved.web).toEqual(builtInDefaultModel);
    expect(resolved.slack).toEqual(builtInDefaultModel);
  });

  it("inherits the org default into the web and surface rows", () => {
    const orgValue = fromSelection({ modelId: "openai/gpt" });
    const resolved = resolveDefaults({
      webValue: null,
      orgValue,
      surfaceValues: {},
    });
    expect(resolved.org.modelId).toBe("openai/gpt");
    expect(resolved.web.modelId).toBe("openai/gpt");
    expect(resolved.linear.modelId).toBe("openai/gpt");
  });

  it("keeps a surface override ahead of the web default", () => {
    const resolved = resolveDefaults({
      webValue: fromSelection("anthropic/claude-anthropic"),
      orgValue: fromSelection("openai/gpt"),
      surfaceValues: { slack: fromSelection("google/gemini") },
    });
    expect(resolved.web.modelId).toBe("anthropic/claude-anthropic");
    expect(resolved.slack.modelId).toBe("google/gemini");
    expect(resolved.linear.modelId).toBe("anthropic/claude-anthropic");
  });
});
