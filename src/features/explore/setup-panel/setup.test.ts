import { describe, expect, it } from "vitest";
import { accentInk, ditherPixels } from "./accent";
import {
  automationStep,
  automationsNote,
  automationsOnLabel,
  errorMessage,
  filledInputs,
  installFailureLine,
  installSummary,
  lowerFirst,
  readInputRejection,
  type SetupCard,
  type SetupInput,
  setupPrompt,
  shortVersion,
  urlHost,
} from "./setup";

const card: SetupCard = {
  kind: "plugin",
  slug: "sample-monitor",
  displayName: "Sample Monitor",
  version: null,
  versionId: "ver_sample",
  maker: { name: "Acme" },
  accent: null,
};

const inputs: SetupInput[] = [
  { kind: "secret", id: "token", label: "API token", note: "Needs a token" },
];

describe("setup helpers", () => {
  it("lowercases a leading capital word only", () => {
    expect(lowerFirst("API token")).toBe("API token");
    expect(lowerFirst("Region")).toBe("region");
  });

  it("shortens commit versions", () => {
    expect(shortVersion("a".repeat(40))).toBe("aaaaaaa");
    expect(shortVersion("1.2.0")).toBe("1.2.0");
  });

  it("reads only https hosts", () => {
    expect(urlHost("https://sample.acme.dev/path")).toBe("sample.acme.dev");
    expect(urlHost("http://sample.acme.dev")).toBeUndefined();
    expect(urlHost("nope")).toBeUndefined();
  });

  it("summarises how the install signs in", () => {
    const server = {
      serverId: "srv",
      displayName: "Sample",
      placement: "remote" as const,
    };
    expect(
      installSummary(
        card,
        { kind: "plugin", plugin: { servers: [{ ...server, auth: "oauth" }] } },
        inputs,
      ),
    ).toBe("Signs in to Acme after Install, Needs a token");
    expect(
      installSummary(
        card,
        {
          kind: "plugin",
          plugin: { servers: [{ ...server, auth: "headers" }] },
        },
        [],
      ),
    ).toBe("No sign in, the key goes with every request");
    expect(
      installSummary(card, { kind: "plugin", plugin: { servers: [] } }, []),
    ).toBe("No sign in, runs on each thread's machine");
    expect(
      installSummary(
        { ...card, kind: "skill" },
        { kind: "skill", skill: { starters: [] } },
        [],
      ),
    ).toBe("Adds the skill to the project's shared files");
  });

  it("words install failures", () => {
    expect(installFailureLine({ input: "token", message: "Bad" }, inputs)).toBe(
      "Nothing was installed, fix the API token and try again",
    );
    expect(
      installFailureLine({ input: null, message: "Server down" }, inputs),
    ).toBe("Server down, nothing was installed");
  });

  it("reads Capy's input rejection and keeps fallbacks for other errors", () => {
    const rejection = {
      _tag: "capy/PluginInputRejected",
      input: "token",
      message: "Bad",
    };
    expect(readInputRejection(rejection)).toEqual({
      input: "token",
      message: "Bad",
    });
    expect(readInputRejection({ cause: rejection })).toEqual({
      input: "token",
      message: "Bad",
    });
    expect(readInputRejection(new Error("x"))).toBeUndefined();
    expect(
      errorMessage(new Error("Transport"), "Could not start the thread"),
    ).toBe("Could not start the thread");
    expect(errorMessage(rejection, "fallback")).toBe("Bad");
  });

  it("counts automations", () => {
    expect(automationsOnLabel(1, 1)).toBe("1 of 1 automation on");
    expect(automationsOnLabel(1, 3)).toBe("1 of 3 automations on");
    expect(automationsNote(1)).toBe(
      "The automation is created when you install, on or off as set here",
    );
    expect(automationsNote(2)).toMatch(/^Both automations/);
    expect(automationsNote(3)).toMatch(/^All automations/);
    expect(
      automationStep({
        name: "n",
        purpose: "Triage new errors.",
        prompt: "",
        trigger: { type: "x" },
      }),
    ).toBe("Suggest an automation: triage new errors");
  });

  it("drops blank inputs", () => {
    expect(filledInputs({ a: " ", b: "x" })).toEqual({ b: "x" });
  });

  it("builds the setup thread prompt", () => {
    const text = setupPrompt({
      kind: "plugin",
      slug: "sample-monitor",
      displayName: "Sample Monitor",
      version: "1.2.0",
      first: "create a key",
      setup: {
        prompt: "Connect the monitor.",
        automations: [
          {
            name: "Triage",
            purpose: "Triage errors",
            prompt: "Look\nFix",
            trigger: { type: "sentry" },
          },
        ],
      },
    });
    expect(text.split("\n\n")).toEqual([
      "Set up the Sample Monitor plugin (1.2.0) from Explore.",
      "First: create a key.",
      "Connect the monitor.",
      expect.stringContaining("propose the automations below"),
      'Suggested automations:\n- Triage (trigger {"type":"sentry"}): Triage errors\n  Look\n  Fix',
    ]);
  });
});

describe("accent dither", () => {
  it("falls back to grey without a chromatic accent", () => {
    const [r, g, b] = accentInk(null, null, true);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("tints toward the accent hue", () => {
    const [r = 0, , b = 0] = accentInk("#3366ff", null, false);
    expect(b).toBeGreaterThan(r);
  });

  it("lights more cells toward the right edge", () => {
    const pixels = ditherPixels(32, 8, [1, 2, 3], 120);
    const lit = (col: number) =>
      Array.from(
        { length: 8 },
        (_, row) => pixels[(row * 32 + col) * 4 + 3],
      ).filter((alpha) => alpha === 120).length;
    expect(lit(0)).toBe(0);
    expect(lit(31)).toBeGreaterThan(0);
  });
});
