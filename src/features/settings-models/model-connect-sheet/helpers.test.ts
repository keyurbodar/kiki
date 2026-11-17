import { describe, expect, it } from "vitest";
import type { CatalogEntry, LabTicks } from "../model-routing/types.ts";
import {
  buildTicks,
  cleanHeaders,
  customIdProblem,
  directTicks,
  draftHeaders,
  hasHeaderProblems,
  headerProblem,
  listedModels,
  matchedFirst,
  nearestEdge,
  nextHeaderId,
  nextTargetPhrase,
  parseTokens,
  previewValue,
  readMediaCheck,
  relativeTime,
  removalSummary,
  servedCount,
  stripWhitespace,
  tagNames,
  tagRanges,
  tokenFields,
  totalCount,
  valueParts,
  wireMessage,
} from "./helpers.ts";

const entry = (id: string, provider: string, name: string): CatalogEntry => ({
  id,
  name,
  provider,
  efforts: [],
  fast: false,
  pro: false,
  limits: { context: 2e5, output: 32e3 },
});

const catalog = [
  entry("acme/alpha", "acme", "Alpha"),
  entry("acme/beta", "acme", "Beta"),
  entry("zen/gamma", "zen", "Gamma"),
];

describe("parseTokens", () => {
  it("reads whole numbers with separators", () => {
    expect(parseTokens("128,000")).toBe(128e3);
    expect(parseTokens("1_000 000")).toBe(1e6);
  });
  it("is undefined when empty and NaN when not a positive integer", () => {
    expect(parseTokens(" ")).toBeUndefined();
    expect(parseTokens("1.5")).toBeNaN();
    expect(parseTokens("-4")).toBeNaN();
    expect(parseTokens("abc")).toBeNaN();
  });
});

describe("stripWhitespace", () => {
  it("drops spaces, newlines and zero-width characters", () => {
    expect(stripWhitespace(" sk-\u200bab c\n")).toBe("sk-abc");
  });
});

describe("wireMessage", () => {
  it("says plain JSON tools when only tool features were rejected", () => {
    expect(wireMessage(["strict", "custom"])).toBe(
      "This endpoint rejected strict tool schemas and freeform tool input, so Capy sends plain JSON tools",
    );
  });
  it("says it leaves features out otherwise", () => {
    expect(wireMessage(["thinking"])).toBe(
      "This endpoint rejected adaptive thinking, so Capy leaves them out",
    );
  });
});

describe("relativeTime", () => {
  const now = Date.UTC(2026, 0, 10);
  it("formats past and future spans", () => {
    expect(relativeTime(new Date(now - 2e3), now)).toBe("just now");
    expect(relativeTime(new Date(now - 30e3), now)).toBe("30s ago");
    expect(relativeTime(new Date(now - 5 * 6e4), now)).toBe("5m ago");
    expect(relativeTime(new Date(now - 3 * 36e5), now)).toBe("3h ago");
    expect(relativeTime(new Date(now - 2 * 864e5), now)).toBe("2d ago");
    expect(relativeTime(new Date(now + 14 * 864e5), now)).toBe("in 2w");
  });
});

describe("buildTicks", () => {
  it("lists every catalog model of a direct provider", () => {
    const ticks = buildTicks(
      directTicks("acme", catalog),
      [],
      [],
      true,
      catalog,
      "acme",
      false,
    );
    expect(ticks).toHaveLength(1);
    expect(ticks[0]?.models.map((m) => [m.model, m.ticked])).toEqual([
      ["acme/alpha", true],
      ["acme/beta", true],
    ]);
    expect(servedCount(ticks)).toBe(2);
    expect(totalCount(ticks)).toBe(2);
  });

  it("applies wildcard and per-model exclusions", () => {
    const ticks = buildTicks(
      directTicks("acme", catalog),
      [],
      [{ model: "acme/*", excluded: true }, { model: "acme/beta" }],
      true,
      catalog,
      "acme",
      false,
    );
    expect(ticks[0]?.ticked).toBe(false);
    expect(ticks[0]?.models.map((m) => m.ticked)).toEqual([false, true]);
  });

  it("adds listed matches under their lab, keeping the served-as id", () => {
    const ticks = buildTicks(
      [],
      [
        {
          providerModelId: "gamma-xl",
          context: 64e3,
          match: { model: "zen/gamma", entryId: "zen/gamma" },
        },
        { providerModelId: "mystery" },
      ],
      [],
      false,
      catalog,
      undefined,
      false,
    );
    expect(ticks).toEqual([
      {
        lab: "zen",
        ticked: false,
        models: [
          {
            model: "zen/gamma",
            entryId: "zen/gamma",
            name: "Gamma",
            ticked: false,
            providerModelId: "gamma-xl",
            context: 64e3,
          },
        ],
      },
    ]);
  });

  it("puts named models under the custom lab", () => {
    const ticks = buildTicks(
      [],
      [],
      [{ model: "acme-coder", name: "Acme Coder", context: 32e3 }],
      false,
      catalog,
      "custom",
      true,
    );
    expect(ticks[0]?.lab).toBe("custom");
    expect(ticks[0]?.models[0]).toMatchObject({
      model: "acme-coder",
      entryId: "custom/acme-coder",
      custom: true,
      ticked: true,
    });
  });

  it("renders an excluded named model unticked", () => {
    const ticks = buildTicks(
      [],
      [],
      [{ model: "acme-coder", name: "Acme Coder", excluded: true }],
      false,
      catalog,
      "custom",
      true,
    );
    expect(ticks[0]?.models[0]?.ticked).toBe(false);
    expect(servedCount(ticks)).toBe(0);
    expect(
      buildTicks(
        [],
        [],
        [{ model: "acme-coder", name: "Acme Coder", excluded: false }],
        false,
        catalog,
        "custom",
        true,
      )[0]?.models[0]?.ticked,
    ).toBe(true);
  });

  it("hides served-as rows with no setting on custom endpoints", () => {
    const base: Array<LabTicks> = [
      {
        lab: "acme",
        ticked: false,
        models: [
          {
            model: "acme/alpha",
            entryId: "acme/alpha",
            name: "Alpha",
            ticked: true,
            providerModelId: "Alpha-Hosted",
          },
        ],
      },
    ];
    expect(buildTicks(base, [], [], false, catalog, "custom", true)).toEqual(
      [],
    );
    expect(
      buildTicks(base, [], [], false, catalog, "custom", false),
    ).toHaveLength(1);
  });
});

describe("listedModels and matchedFirst", () => {
  it("keeps matched rows and drops ids equal to the model", () => {
    expect(
      listedModels([
        {
          providerModelId: "acme/alpha",
          match: { model: "acme/alpha", entryId: "acme/alpha" },
        },
        {
          providerModelId: "beta-1",
          context: 1e3,
          match: { model: "acme/beta", entryId: "acme/beta" },
        },
        { providerModelId: "loose" },
      ]),
    ).toEqual([
      { model: "acme/alpha", providerModelId: undefined, context: undefined },
      { model: "acme/beta", providerModelId: "beta-1", context: 1e3 },
    ]);
  });
  it("sorts matched rows first", () => {
    const rows = [
      { providerModelId: "b" },
      { providerModelId: "a", match: { model: "a", entryId: "a" } },
    ];
    expect(rows.toSorted(matchedFirst)[0]?.providerModelId).toBe("a");
  });
});

describe("tokenFields", () => {
  it("defaults compact at and caps the output placeholder", () => {
    const fields = tokenFields("100,000", "", "");
    expect(fields.context).toBe(1e5);
    expect(fields.defaultCompactAt).toBe(8e4);
    expect(fields.outputPlaceholder).toBe(32e3);
    expect(tokenFields("1,000,000", "", "").defaultCompactAt).toBe(4e5);
    expect(tokenFields("8000", "", "").outputPlaceholder).toBe(8e3);
  });
  it("reports each problem", () => {
    expect(tokenFields("abc", "", "").contextProblem).toBe(
      "Enter a whole number of tokens",
    );
    expect(tokenFields("1000", "2000", "").outputProblem).toBe(
      "At most the context window",
    );
    expect(tokenFields("1000", "x", "").outputProblem).toBe(
      "Enter a whole number of tokens",
    );
    expect(tokenFields("100000", "", "40000").compactProblem).toBe(
      "At least 50,000 tokens",
    );
    expect(tokenFields("60000", "", "60000").compactProblem).toBe(
      "Below the context window",
    );
    expect(tokenFields("100000", "", "60000").compactProblem).toBeUndefined();
  });
});

describe("headers", () => {
  const draft = (id: number, name: string, value = "") => ({ id, name, value });
  it("validates names, reserved names, duplicates and tags", () => {
    expect(headerProblem(draft(0, "bad name"), [])?.text).toBe(
      "Header names use letters, digits, and dashes",
    );
    expect(headerProblem(draft(0, "Authorization"), [])?.text).toBe(
      "Authorization is set by Capy, pick another name",
    );
    const all = [draft(0, "X-Team"), draft(1, "x-team")];
    expect(headerProblem(all[1] ?? draft(9, ""), all)?.text).toBe(
      "x-team is already listed",
    );
    expect(headerProblem(draft(0, "X-User", `\${capy.nope}`), [])).toEqual({
      field: "value",
      text: "Unknown tag capy.nope, insert one from the tag list",
    });
    expect(headerProblem(draft(0, "", "v"), [])?.text).toBe("Name the header");
    expect(headerProblem(draft(0, "X-User", `\${capy.user.id}`), [])).toBe(
      undefined,
    );
  });
  it("cleans, drafts and numbers headers", () => {
    expect(cleanHeaders([draft(0, " X-A ", "1"), draft(1, " ", "2")])).toEqual([
      { name: "X-A", value: "1" },
    ]);
    expect(draftHeaders([{ name: "X-A", secret: true }])).toEqual([
      { id: 0, name: "X-A", value: "" },
    ]);
    expect(nextHeaderId([])).toBe(0);
    expect(nextHeaderId([draft(4, "a")])).toBe(5);
    expect(hasHeaderProblems([draft(0, "host")])).toBe(true);
  });
  it("finds, previews and splits tags", () => {
    const value = `id=\${capy.user.id};\${capy.x}`;
    expect(tagNames(value)).toEqual(["capy.user.id", "capy.x"]);
    expect(tagRanges(value)).toEqual([
      { start: 3, end: 18 },
      { start: 19, end: 28 },
    ]);
    expect(previewValue(value)).toBe(
      `id=user_01K5R2Q8ZT3M7XV9W1B4NCD6EF;\${capy.x}`,
    );
    expect(valueParts(value)).toEqual([
      { start: 0, text: "id=" },
      { start: 3, tag: "capy.user.id", width: 15 },
      { start: 18, text: ";" },
      { start: 19, tag: "capy.x", width: 9 },
    ]);
    expect(nearestEdge(5, { start: 3, end: 18 })).toBe(3);
    expect(nearestEdge(15, { start: 3, end: 18 })).toBe(18);
  });
});

describe("removalSummary", () => {
  const routes = [
    {
      model: "acme/alpha",
      entryId: "acme/alpha",
      org: { kind: "org_credential" as const, ref: "k1", label: "Acme" },
      orgNext: { kind: "capy" as const, ref: "capy", label: "Capy" },
    },
    {
      model: "acme/beta",
      entryId: "acme/beta",
      org: { kind: "org_credential" as const, ref: "k1", label: "Acme" },
    },
    {
      model: "zen/gamma",
      entryId: "zen/gamma",
      org: { kind: "org_credential" as const, ref: "k2", label: "Zen" },
    },
  ];
  const nameOf = (model: string) => model.split("/")[1] ?? model;
  it("groups models by what serves them next", () => {
    expect(
      removalSummary({ id: "k1", ownerType: "org" }, routes, [], nameOf),
    ).toEqual({
      blocked: [],
      lines: [
        "alpha will run on Capy credits",
        "beta will have nothing to run on",
      ],
    });
  });
  it("blocks models locked to the key with nothing next", () => {
    expect(
      removalSummary(
        { id: "k1", ownerType: "org" },
        routes,
        ["acme/beta", "acme/alpha"],
        nameOf,
      ).blocked,
    ).toEqual(["beta"]);
  });
  it("names the next target", () => {
    expect(
      nextTargetPhrase({ kind: "member_seat", ref: "s", label: "Claude" }),
    ).toBe("will run on your Claude subscription");
    expect(
      nextTargetPhrase({ kind: "user_credential", ref: "u", label: "Zen" }),
    ).toBe("will run on Zen key");
    expect(
      nextTargetPhrase({ kind: "user_credential", ref: "u", label: "Zen key" }),
    ).toBe("will run on Zen key");
  });
});

describe("customIdProblem", () => {
  it("rejects empty, duplicate and catalog ids", () => {
    expect(customIdProblem("!!!", [], [], catalog)).toBe(
      "Use letters, numbers, dots or dashes",
    );
    expect(
      customIdProblem(
        "Acme-Coder",
        [{ model: "acme-coder", name: "Acme Coder" }],
        [],
        catalog,
      ),
    ).toBe("Already added");
    expect(customIdProblem("acme/alpha", [], [], catalog)).toBe(
      "Capy already has this model, add it with Use a Capy model",
    );
    expect(customIdProblem("acme-coder", [], [], catalog)).toBeUndefined();
  });
});

describe("readMediaCheck", () => {
  it("revives the checked date", () => {
    const result = readMediaCheck({
      media: { state: "no", checkedAt: "2026-01-02T00:00:00Z", outcome: "403" },
      failure: "Blocked",
    });
    expect(result.media.checkedAt?.toISOString()).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(result.failure).toBe("Blocked");
  });
});
