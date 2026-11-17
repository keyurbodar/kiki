import { describe, expect, it } from "vitest";
import { expandTargets, parseRef, parseViewport, shard } from "./targets";

const base = { maxMismatch: 5, threshold: 0.1 };

describe("expandTargets", () => {
  it("expands the matrix, fills placeholders and applies variants", () => {
    const targets = expandTargets(
      {
        matrix: { theme: ["default", "catppuccin"], scheme: ["dark", "light"] },
        targets: [
          {
            id: "tokens",
            route: "/__tokens?theme={theme}&mode={scheme}",
            variants: {
              light: { maxMismatch: 9 },
              "default/dark": {
                frame: "XYrzNr5Hg7",
                expect: { body: { color: "#ebebec" } },
              },
            },
          },
          {
            route: "/settings/appearance",
            scheme: "dark",
            viewport: "1440x818@2",
          },
        ],
      },
      base,
    );
    expect(targets.map((t) => t.id)).toEqual([
      "tokens--default-dark",
      "tokens--default-light",
      "tokens--catppuccin-dark",
      "tokens--catppuccin-light",
      "settings-appearance--default-dark",
      "settings-appearance--catppuccin-dark",
    ]);
    const [dark, light] = targets;
    expect(dark?.route).toBe("/__tokens?theme=default&mode=dark");
    expect(dark?.frame).toBe("XYrzNr5Hg7");
    expect(dark?.expect).toEqual({ body: { color: "#ebebec" } });
    expect(dark?.capture.html).toEqual([]);
    expect(light?.frame).toBeUndefined();
    expect(light?.maxMismatch).toBe(9);
    expect(targets[4]?.viewport).toEqual({
      width: 1440,
      height: 818,
      scale: 2,
    });
  });

  it("rejects duplicate ids and bad routes", () => {
    expect(() =>
      expandTargets({ targets: [{ route: "/a" }, { route: "/a" }] }, base),
    ).toThrow(/duplicate/);
    expect(() => expandTargets({ targets: [{ route: "a" }] }, base)).toThrow(
      /must start/,
    );
  });
});

describe("helpers", () => {
  it("parses refs", () => {
    expect(parseRef("#12")).toMatchObject({
      kind: "pr",
      fetchRef: "refs/pull/12/head",
      label: "pr-12",
    });
    expect(parseRef("68B8CB669")).toMatchObject({
      kind: "sha",
      sha: "68b8cb669",
    });
    expect(parseRef("main")).toMatchObject({
      kind: "branch",
      fetchRef: "refs/heads/main",
      label: "main",
    });
  });

  it("parses viewports", () => {
    expect(parseViewport("390x844")).toEqual({ width: 390, height: 844 });
    expect(() => parseViewport("wide")).toThrow();
  });

  it("shards round robin within the VM cap", () => {
    const parts = shard([...Array(10).keys()], 4, 16);
    expect(parts).toHaveLength(3);
    expect(parts.flat().sort((a, b) => a - b)).toEqual([...Array(10).keys()]);
    expect(shard([...Array(100).keys()], 2, 16)).toHaveLength(16);
  });
});
