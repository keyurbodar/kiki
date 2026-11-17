import { describe, expect, it } from "vitest";
import {
  connectionSections,
  customEndpointEntry,
  entryRank,
  firstTarget,
  matchesQuery,
  presetEntry,
  providerEntry,
  seatEntries,
  targetKey,
} from "./entries.ts";

const titles = (sections: ReturnType<typeof connectionSections>) =>
  sections.map((s) => s.title);

const ids = (sections: ReturnType<typeof connectionSections>, title: string) =>
  sections.find((s) => s.title === title)?.entries.map((e) => e.id);

describe("seatEntries", () => {
  it("lists the connectable subscriptions without Qwen Code", () => {
    expect(seatEntries([]).map((e) => e.id)).toEqual([
      "claude",
      "codex",
      "copilot",
      "supergrok",
    ]);
    expect(seatEntries([]).every((e) => e.state === undefined)).toBe(true);
  });

  it("offers another seat, except for single-seat services", () => {
    const entries = seatEntries(["codex", "copilot"]);
    const codex = entries.find((e) => e.id === "codex");
    const copilot = entries.find((e) => e.id === "copilot");
    expect(codex?.state).toBe("Add another");
    expect(codex?.target).toEqual({ kind: "seat", service: "codex" });
    expect(copilot?.state).toBe("Connected");
    expect(copilot?.target).toBeUndefined();
    expect(codex?.detail).toBe("chatgpt.com");
  });
});

describe("connectionSections", () => {
  it("shows subscriptions only to members", () => {
    expect(titles(connectionSections("user", [], ""))).toEqual([
      "Subscriptions",
      "Coding plans",
      "API keys",
    ]);
    expect(titles(connectionSections("org", [], ""))).toEqual([
      "Coding plans",
      "API keys",
    ]);
  });

  it("orders entries by Capy's ranking and ends API keys with a custom endpoint", () => {
    const sections = connectionSections("user", [], "");
    expect(ids(sections, "Subscriptions")).toEqual([
      "codex",
      "claude",
      "supergrok",
      "copilot",
    ]);
    const keys = ids(sections, "API keys") ?? [];
    expect(keys.slice(0, 3)).toEqual(["anthropic", "openai", "openrouter"]);
    expect(keys.at(-1)).toBe("openai_compatible");
    expect(ids(sections, "Coding plans")?.[0]).toBe("opencode_go");
  });

  it("filters by name, host and alias", () => {
    expect(ids(connectionSections("user", [], " Gemini "), "API keys")).toEqual(
      ["google"],
    );
    expect(
      ids(connectionSections("user", [], "chatgpt"), "Subscriptions"),
    ).toEqual(["codex"]);
    expect(ids(connectionSections("user", [], "vllm"), "API keys")).toEqual([
      "openai_compatible",
    ]);
    expect(titles(connectionSections("user", [], "api.x.ai"))).toEqual([
      "Subscriptions",
      "API keys",
    ]);
  });

  it("returns nothing when no provider matches", () => {
    expect(connectionSections("user", [], "acme-nothing")).toEqual([]);
  });
});

describe("helpers", () => {
  it("builds provider and preset entries", () => {
    expect(providerEntry("xai")).toEqual({
      id: "xai",
      name: "xAI",
      detail: "api.x.ai",
      target: { kind: "key", provider: "xai" },
    });
    expect(
      presetEntry({
        id: "acme_gateway",
        provider: "openai_compatible",
        name: "Acme Gateway",
        kind: "gateway",
        baseURL: "https://gateway.acme.test/v1",
        api: "chat_completions",
        keyUrl: "https://acme.test/keys",
      }),
    ).toEqual({
      id: "acme_gateway",
      name: "Acme Gateway",
      detail: "gateway.acme.test",
      target: {
        kind: "key",
        provider: "openai_compatible",
        preset: "acme_gateway",
      },
    });
  });

  it("ranks unknown entries last", () => {
    expect(entryRank(customEndpointEntry)).toBeGreaterThan(
      entryRank(providerEntry("anthropic")),
    );
  });

  it("matches case-insensitively against the lowered query", () => {
    expect(matchesQuery(providerEntry("google"), "ai studio")).toBe(true);
    expect(matchesQuery(providerEntry("google"), "")).toBe(true);
    expect(matchesQuery(providerEntry("google"), "anthropic")).toBe(false);
  });

  it("picks the first entry it can open", () => {
    expect(firstTarget(connectionSections("user", ["copilot"], "github"))).toBe(
      undefined,
    );
    expect(firstTarget(connectionSections("user", [], ""))).toEqual({
      kind: "seat",
      service: "codex",
    });
  });

  it("keys each view", () => {
    expect(targetKey(undefined)).toBe("list");
    expect(targetKey({ kind: "seat", service: "codex" })).toBe("codex");
    expect(targetKey({ kind: "key", provider: "openai" })).toBe("openai");
    expect(
      targetKey({ kind: "key", provider: "openai_compatible", preset: "acme" }),
    ).toBe("acme");
  });
});
