import { describe, expect, it } from "vitest";
import {
  effortLabel,
  featuredModels,
  findGroup,
  formatContext,
  formatPrice,
  groupModels,
  isFreeRoute,
  type ModelEntry,
  type ModelGroup,
  maxFavorites,
  parseEntries,
  preferredRoute,
  priceLabel,
  resolveModes,
  searchModels,
  selectEntry,
  selectionSummary,
  stepEffort,
  toggleMode,
} from "./catalog";

const entry = (over: Partial<ModelEntry> & { id: string }): ModelEntry => ({
  name: over.id.split("/")[1] ?? over.id,
  provider: over.id.split("/")[0] ?? over.id,
  efforts: ["low", "medium", "high"],
  defaultEffort: "medium",
  fast: false,
  pro: false,
  limits: { context: 1_000_000 },
  ...over,
});

const entries: ReadonlyArray<ModelEntry> = [
  entry({
    id: "anthropic/claude-opus-5-5",
    name: "Claude Opus 5.5",
    fast: true,
    pricing: { input: 4, output: 20 },
  }),
  entry({
    id: "claude-code/claude-opus-5-5",
    name: "Claude Opus 5.5",
    provider: "claude-code",
    route: { kind: "member_seat", service: "claude", label: "Claude" },
  }),
  entry({
    id: "openai/gpt-6-sol",
    name: "GPT-6 Sol",
    provider: "openai",
    pro: true,
    ultrafast: true,
    daybreak: "red",
    pricing: { input: 2, output: 10 },
  }),
  entry({
    id: "zai/glm-5.3-flash-ads",
    name: "GLM-5.3-Flash",
    provider: "zai",
    ads: true,
    pricing: { input: 0, output: 0 },
  }),
  entry({
    id: "openai/gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    replaces: ["openai/gpt-6-sol"],
  }),
];

const groups = groupModels(entries);

const at = (index: number): ModelEntry => {
  const item = entries[index];
  if (item === undefined) throw new Error("missing fixture entry");
  return item;
};

const groupAt = (index: number): ModelGroup => {
  const item = groups[index];
  if (item === undefined) throw new Error("missing fixture group");
  return item;
};

describe("model picker catalog", () => {
  it("groups routes by lab and slug, preferring the plan route", () => {
    const opus = groups.find(
      (group) => group.key === "anthropic/claude-opus-5-5",
    );
    expect(opus?.lab).toBe("anthropic");
    expect(opus?.routes.map((route) => route.kind)).toEqual([
      "plan",
      "credits",
    ]);
  });

  it("puts labs in Capy's order", () => {
    expect(groups.map((group) => group.lab)).toEqual([
      "anthropic",
      "openai",
      "openai",
      "zai",
    ]);
  });

  it("marks replaced ids as older models", () => {
    const older = groups.find((group) => group.key === "openai/gpt-5.6-sol");
    expect(older?.older).toBe(true);
  });

  it("finds a group by a replaced id", () => {
    expect(findGroup(groups, "openai/gpt-6-sol")?.name).toBe("GPT-6 Sol");
    expect(findGroup(groups, "missing/model")).toBeUndefined();
  });

  it("keeps the remembered route, then the requested id", () => {
    const opus = groupAt(0);
    expect(preferredRoute(opus, {}).kind).toBe("plan");
    const credits = opus.routes.find((route) => route.kind === "credits");
    if (credits === undefined) throw new Error("expected a credits route");
    expect(preferredRoute(opus, { [opus.key]: credits.entry.id }).kind).toBe(
      "credits",
    );
    expect(preferredRoute(opus, {}, "anthropic/claude-opus-5-5").entry.id).toBe(
      "anthropic/claude-opus-5-5",
    );
  });

  it("features free, current models only", () => {
    const featured = featuredModels(groups);
    expect(featured.map((item) => item.group.key)).toEqual([
      "zai/glm-5.3-flash-ads",
    ]);
    const [first] = featured;
    expect(first?.note).toBe("Free, supported by ads");
    expect(
      first === undefined ? false : isFreeRoute(first.group.routes[0]),
    ).toBe(true);
  });

  it("searches names and labs, prefering whole-word matches", () => {
    expect(searchModels(groups, "glm").map((group) => group.key)).toEqual([
      "zai/glm-5.3-flash-ads",
    ]);
    expect(searchModels(groups, "openai").map((group) => group.name)).toEqual([
      "GPT-6 Sol",
      "GPT-5.6 Sol",
    ]);
    expect(searchModels(groups, "zzz")).toEqual([]);
  });

  it("resolves modes against what the model supports", () => {
    const opus = at(0);
    const sol = at(2);
    expect(resolveModes(opus, { fast: true })).toEqual({
      fast: true,
      pro: false,
      ultrafast: false,
      daybreak: false,
    });
    expect(resolveModes(opus, { pro: true, fast: true }).pro).toBe(false);
    const pro = resolveModes(sol, { pro: true, fast: true });
    expect(pro.pro).toBe(true);
    expect(pro.fast).toBe(false);
    expect(resolveModes(sol, { daybreak: true }).daybreak).toBe(true);
  });

  it("toggles one mode at a time, daybreak independently", () => {
    const modes = { fast: true, pro: false, ultrafast: false, daybreak: false };
    expect(toggleMode(modes, "pro")).toEqual({
      fast: false,
      pro: true,
      ultrafast: false,
      daybreak: false,
    });
    expect(toggleMode(modes, "daybreak").fast).toBe(true);
  });

  it("steps effort inside the model's range", () => {
    const opus = at(0);
    expect(stepEffort(opus, "medium", 1)).toBe("high");
    expect(stepEffort(opus, "high", 1)).toBe("high");
    expect(stepEffort(opus, undefined, -1)).toBe("low");
  });

  it("drops an effort the next model cannot run", () => {
    const next = selectEntry(
      { modelId: at(0).id, effort: "max", fast: true, pro: false },
      entry({ id: "zai/glm-5.3", efforts: ["low"] }),
    );
    expect(next.effort).toBeUndefined();
    expect(next.fast).toBe(false);
  });

  it("summarises the trigger label the way Capy does", () => {
    const opus = at(0);
    expect(
      selectionSummary(opus, undefined, {
        fast: false,
        pro: false,
        ultrafast: false,
        daybreak: false,
      }),
    ).toBe("Medium");
    expect(
      selectionSummary(opus, "high", {
        fast: true,
        pro: false,
        ultrafast: false,
        daybreak: false,
      }),
    ).toBe("High Fast");
    expect(
      selectionSummary(opus, "high", {
        fast: false,
        pro: true,
        ultrafast: false,
        daybreak: false,
      }),
    ).toBe("Pro");
  });

  it("formats context and prices", () => {
    expect(formatContext(1_000_000)).toBe("1M");
    expect(formatContext(128_000)).toBe("128K");
    expect(formatPrice(4)).toBe("$4");
    expect(formatPrice(0.5)).toBe("$0.50");
    expect(priceLabel(at(3))).toBe("Free");
    expect(priceLabel(at(0))).toBe("$4 / $20");
    expect(priceLabel(entry({ id: "x/y", efforts: [] }))).toBe("");
  });

  it("labels efforts and caps favorites at nine", () => {
    expect(effortLabel("xhigh")).toBe("Extra high");
    expect(maxFavorites).toBe(9);
  });

  it("ignores malformed catalog rows", () => {
    const parsed = parseEntries([
      { id: "a/b", name: "A", efforts: ["low"] },
      { id: "a/c" },
      null,
      "nope",
    ]);
    expect(parsed.map((item) => item.id)).toEqual(["a/b"]);
  });

  it("accepts a thin catalog row and fills in what it can", () => {
    const parsed = parseEntries([
      { id: "acme/fast-model", label: "Fast Model", provider: "acme" },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.name).toBe("Fast Model");
    expect(parsed[0]?.efforts).toEqual([]);
    expect(parsed[0]?.fast).toBe(false);
  });

  it("reads the catalog out of the /models envelope", () => {
    expect(
      parseEntries({
        models: [{ id: "a/b", name: "A", efforts: ["low"] }],
        credentials: [],
      }).map((item) => item.id),
    ).toEqual(["a/b"]);
  });
});
