import { describe, expect, it } from "vitest";
import {
  bindingGlyphs,
  captureBinding,
  captureDigitBinding,
  commandCatalog,
  commandLabels,
  conflictReason,
  effectiveBindings,
  normalizeBinding,
  parseBinding,
  reservedReason,
  whenLabels,
} from "./keybindings";

const key = (over: Partial<Parameters<typeof captureBinding>[0]>) => ({
  key: "k",
  code: "KeyK",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...over,
});

describe("parsing bindings", () => {
  it("parses a chord and its modifiers", () => {
    expect(parseBinding("mod+shift+k")).toEqual([
      {
        key: "k",
        mod: true,
        ctrl: false,
        meta: false,
        alt: false,
        shift: true,
      },
    ]);
  });

  it("parses two-chord sequences and rejects longer ones", () => {
    expect(parseBinding("mod+k mod+p")).toHaveLength(2);
    expect(parseBinding("a b c")).toBeNull();
  });

  it("normalizes modifier order and key aliases", () => {
    expect(normalizeBinding("shift+mod+space")).toBe("mod+shift+space");
    expect(normalizeBinding("shift++")).toBeNull();
    expect(normalizeBinding("mod+plus")).toBe("mod+plus");
    expect(normalizeBinding("hyper+k")).toBeNull();
  });
});

describe("capturing keys", () => {
  it("maps the platform modifier to mod", () => {
    expect(captureBinding(key({ metaKey: true }), true)).toBe("mod+k");
    expect(captureBinding(key({ ctrlKey: true }), false)).toBe("mod+k");
    expect(captureBinding(key({ ctrlKey: true }), true)).toBe("ctrl+k");
    expect(captureBinding(key({ metaKey: true }), false)).toBe("meta+k");
  });

  it("ignores bare modifier presses", () => {
    expect(
      captureBinding(key({ key: "Shift", code: "ShiftLeft", shiftKey: true })),
    ).toBeNull();
  });

  it("collapses the 1-9 range for ranged commands", () => {
    expect(
      captureDigitBinding(
        key({ key: "3", code: "Digit3", metaKey: true }),
        true,
      ),
    ).toBe("mod+digit");
  });
});

describe("glyphs", () => {
  it("renders modifier glyphs per platform", () => {
    expect(bindingGlyphs("mod+shift+k", true)).toEqual(["⇧", "⌘", "K"]);
    expect(bindingGlyphs("mod+shift+k", false)).toEqual(["Ctrl", "Shift", "K"]);
  });

  it("renders named keys", () => {
    expect(bindingGlyphs("escape", false)).toEqual(["Esc"]);
    expect(bindingGlyphs("enter", false)).toEqual(["↵"]);
  });
});

describe("validation", () => {
  it("rejects browser-reserved and modifier-less shortcuts", () => {
    expect(reservedReason("pull.openGitHub", "mod+w")).toBe(
      "mod+w is reserved by the browser",
    );
    expect(reservedReason("thread.jump", "mod+k")).toBe(
      "mod+k needs a number key (1–9)",
    );
    expect(reservedReason("tab.close", "digit")).toBe(
      "digit cannot use the 1–9 number range",
    );
    expect(reservedReason("tab.close", "k")).toBe("k needs a modifier key");
    expect(reservedReason("tab.close", "mod+k")).toBeNull();
  });

  it("reports conflicts across commands but ignores contextual ones", () => {
    const bindings = effectiveBindings({
      "tab.close": ["mod+k"],
      "sidebar.toggle": ["mod+k"],
    });
    expect(
      conflictReason("mod+k", "sidebar.toggle", bindings, false),
    ).toContain("conflicts with");
    expect(
      conflictReason("mod+j", "sidebar.toggle", bindings, false),
    ).toBeNull();
  });

  it("drops overrides that would be invalid", () => {
    const bindings = effectiveBindings({ "tab.close": ["k"] });
    expect(
      bindings.some((b) => b.command === "tab.close" && b.key === "k"),
    ).toBe(false);
    expect(
      effectiveBindings({ "tab.close": null }).some(
        (b) => b.command === "tab.close",
      ),
    ).toBe(false);
  });
});

describe("the catalog", () => {
  it("gives every command a label and a distinct id", () => {
    const ids = commandCatalog.map((c) => c.command);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(commandLabels[id]?.length).toBeGreaterThan(0);
  });

  it("ships valid default bindings", () => {
    for (const c of commandCatalog) {
      for (const binding of c.defaults) {
        expect(normalizeBinding(binding), binding).not.toBeNull();
        expect(reservedReason(c.command, binding), binding).toBeNull();
      }
    }
  });

  it("labels every when-clause used by the catalog", () => {
    for (const c of commandCatalog) {
      for (const clause of c.when ?? []) {
        expect(whenLabels[clause], clause).toBeDefined();
      }
    }
  });
});
