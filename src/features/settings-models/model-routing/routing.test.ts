import { describe, expect, it } from "vitest";
import { decodeRouting } from "./decode.ts";
import {
  fixtureNow,
  sampleCapyCredits,
  sampleCatalog,
  sampleCredential,
  sampleRouting,
  sampleTicks,
} from "./fixtures.ts";
import {
  applyTick,
  catalogRows,
  connectionsCount,
  describeCapyCredits,
  describeCredential,
  describeEndpoint,
  describeHealth,
  formatContext,
  formatPrice,
  formatTokens,
  healthSentence,
  labName,
  labRank,
  lockedModels,
  myConnections,
  neverUseCapyCredits,
  organizationConnections,
} from "./routing.ts";

describe("formatters", () => {
  it("formats context and token counts like Capy", () => {
    expect(formatContext(1_000_000)).toBe("1M");
    expect(formatContext(1_500_000)).toBe("1.5M");
    expect(formatContext(200_000)).toBe("200k");
    expect(formatContext(512)).toBe("512");
    expect(formatTokens(128_500)).toBe("128.5K");
    expect(formatTokens(2_000_000)).toBe("2M");
    expect(formatPrice(0.8)).toBe("$0.8");
  });

  it("names and orders labs", () => {
    expect(labName("moonshotai")).toBe("Moonshot");
    expect(labName("unknown-lab")).toBe("unknown-lab");
    expect(labRank("anthropic")).toBeLessThan(labRank("google"));
  });

  it("counts connections", () => {
    expect(connectionsCount(0)).toBe("No connections");
    expect(connectionsCount(1)).toBe("1 connection");
    expect(connectionsCount(3)).toBe("3 connections");
  });
});

describe("describeCredential", () => {
  it("summarises what a key serves", () => {
    expect(describeCredential(sampleCredential, fixtureNow)).toBe(
      "Serves every Anthropic model, except Sample Small",
    );
    expect(
      describeCredential({ ...sampleCredential, ticks: [] }, fixtureNow),
    ).toBe("Serves nothing yet");
  });

  it("puts problems first", () => {
    expect(
      describeCredential(
        { ...sampleCredential, status: "invalid" },
        fixtureNow,
      ),
    ).toBe("The provider rejected this key");
    expect(
      describeCredential(
        { ...sampleCredential, exhaustedUntil: new Date(fixtureNow + 36e5) },
        fixtureNow,
      ),
    ).toMatch(/^Out of usage until /);
    expect(
      describeCredential(
        {
          ...sampleCredential,
          ownerType: "user",
          health: { state: "signed_out", kind: "key", provider: "openrouter" },
        },
        fixtureNow,
      ),
    ).toBe("Acme gateway key was rejected, replace it");
  });

  it("describes the endpoint", () => {
    expect(describeEndpoint(sampleCredential)).toBe(
      "Through gateway.example.com/v1 with the Responses API",
    );
    expect(
      describeEndpoint({
        ...sampleCredential,
        baseURL: undefined,
        api: undefined,
        azure: { resourceName: "acme-east" },
      }),
    ).toBe("On acme-east");
  });

  it("describes Capy credits", () => {
    expect(describeCapyCredits(sampleCapyCredits)).toBe(
      "Serves models nothing else serves, except OpenAI models",
    );
    expect(
      describeCapyCredits({
        ...sampleCapyCredits,
        ticks: sampleTicks.map((lab) => ({
          ...lab,
          models: lab.models.map((m) => ({ ...m, ticked: false })),
        })),
      }),
    ).toBe("Never used");
  });
});

describe("describeHealth", () => {
  it("builds badges and sentences", () => {
    expect(
      describeHealth(
        { state: "signed_out", kind: "member_seat", provider: "claude" },
        fixtureNow,
      ),
    ).toMatchObject({
      badge: "Reconnect needed",
      sentence: "Claude signed out, reconnect it",
    });
    expect(
      describeHealth(
        {
          state: "disabled",
          kind: "key",
          provider: "openai",
          action: "enable",
        },
        fixtureNow,
        "Sample Turbo",
      ),
    ).toMatchObject({
      badge: "Off",
      sentence:
        "OpenAI is turned off in settings, turn it on to use Sample Turbo",
      action: { label: "Turn on", href: "/settings/models#api-keys" },
    });
    expect(
      healthSentence(
        { state: "signed_out", kind: "key", provider: "openai" },
        "user",
        fixtureNow,
      ),
    ).toBe("OpenAI rejected your key, replace it");
  });
});

describe("applyTick", () => {
  it("ticks a whole lab with a wildcard", () => {
    expect(
      applyTick([], false, sampleTicks, { lab: "openai", ticked: true }),
    ).toEqual([{ model: "openai/*", excluded: false }]);
    expect(
      applyTick([{ model: "openai/*", excluded: false }], false, sampleTicks, {
        lab: "openai",
        ticked: false,
      }),
    ).toEqual([]);
  });

  it("drops overrides that match the lab", () => {
    expect(
      applyTick(sampleCredential.models, false, sampleTicks, {
        lab: "anthropic",
        model: "anthropic/sample-small",
        ticked: true,
      }),
    ).toEqual([]);
    expect(
      applyTick([], false, sampleTicks, {
        lab: "anthropic",
        model: "anthropic/sample-large",
        ticked: false,
      }),
    ).toEqual([{ model: "anthropic/sample-large", excluded: true }]);
  });

  it("keeps custom model details when unticking", () => {
    const custom = {
      model: "custom/m",
      name: "Custom M",
      providerModelId: "m-1",
    };
    expect(
      applyTick([custom], true, sampleTicks, {
        lab: "custom",
        model: "custom/m",
        ticked: false,
      }),
    ).toEqual([{ ...custom, excluded: true }]);
  });

  it("applies a whole-lab toggle to its mapped models", () => {
    const mapped = {
      model: "openai/sample-turbo",
      providerModelId: "hosted-turbo",
    };
    expect(
      applyTick([mapped], false, sampleTicks, { lab: "openai", ticked: false }),
    ).toEqual([
      {
        model: "openai/sample-turbo",
        providerModelId: "hosted-turbo",
        excluded: true,
      },
    ]);
    expect(
      applyTick(
        [
          {
            model: "openai/sample-turbo",
            providerModelId: "hosted-turbo",
            excluded: true,
          },
          { model: "openai/*", excluded: true },
        ],
        false,
        sampleTicks,
        { lab: "openai", ticked: true },
      ),
    ).toEqual([
      { model: "openai/sample-turbo", providerModelId: "hosted-turbo" },
      { model: "openai/*", excluded: false },
    ]);
  });

  it("clears redundant overrides when the lab state matches", () => {
    expect(
      applyTick(
        [
          { model: "anthropic/sample-small", excluded: true },
          { model: "anthropic/sample-large", context: 32e3 },
        ],
        true,
        sampleTicks,
        { lab: "anthropic", ticked: true },
      ),
    ).toEqual([{ model: "anthropic/sample-large", context: 32e3 }]);
    expect(
      applyTick(
        [{ model: "anthropic/sample-large", context: 32e3 }],
        false,
        sampleTicks,
        { lab: "anthropic", ticked: false },
      ),
    ).toEqual([
      { model: "anthropic/sample-large", context: 32e3, excluded: true },
    ]);
  });

  it("leaves named models of other labs alone", () => {
    const custom = { model: "acme-coder", name: "Acme Coder" };
    expect(
      applyTick([custom], false, sampleTicks, { lab: "openai", ticked: false }),
    ).toEqual([custom]);
  });

  it("never uses Capy credits", () => {
    expect(neverUseCapyCredits(sampleTicks)).toEqual([
      { model: "anthropic/*", excluded: true },
      { model: "openai/*", excluded: true },
    ]);
  });
});

describe("routing lists", () => {
  it("orders my connections and the organization's", () => {
    const routing = {
      ...sampleRouting,
      credentials: [
        ...sampleRouting.credentials,
        {
          ...sampleCredential,
          id: "cred_mine",
          ownerType: "user" as const,
          position: 2,
        },
      ],
    };
    expect(myConnections(routing).map((c) => c.id)).toEqual([
      "cred_sample_seat",
      "cred_mine",
    ]);
    expect(organizationConnections(routing).map((c) => c.id)).toEqual([
      "cred_sample_gateway",
    ]);
    expect(lockedModels(routing)).toEqual(["anthropic/sample-large"]);
  });

  it("joins routes with the catalog and settings", () => {
    const rows = catalogRows(sampleRouting, sampleCatalog, []);
    expect(rows.map((r) => r.entry.id)).toEqual([
      "anthropic/sample-large",
      "anthropic/sample-small",
      "openai/sample-turbo",
    ]);
    expect(rows[2]?.setting?.off).toBe(true);
    expect(catalogRows(undefined, sampleCatalog, [])).toEqual([]);
  });

  it("decodes dates from the wire", () => {
    const routing = decodeRouting({
      ...sampleRouting,
      seats: [
        {
          ...sampleRouting.seats[0],
          expiresAt: "2026-02-01T00:00:00.000Z",
          plan: null,
        },
      ],
    });
    expect(routing?.seats[0]?.expiresAt).toBeInstanceOf(Date);
    expect(routing?.seats[0]?.plan).toBeUndefined();
  });

  it("defaults the lists a payload leaves out", () => {
    const routing = decodeRouting({ small: "a", medium: "b", large: "c" });
    expect(routing).toEqual({
      admin: false,
      seats: [],
      credentials: [],
      routes: [],
      settings: [],
    });
    expect(decodeRouting(null)).toBeUndefined();
    expect(decodeRouting([])).toBeUndefined();
  });
});
