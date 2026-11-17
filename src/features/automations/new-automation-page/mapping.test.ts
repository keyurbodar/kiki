import { describe, expect, it } from "vitest";
import { canSave, type EditorForm } from "../automation-editor/model";
import { findTemplate } from "../templates-section";
import {
  blankSeed,
  createdAutomationId,
  createPayload,
  formFromSeed,
  seedFromTemplate,
  seedFromThread,
  triggerFromTemplate,
} from "./mapping";

const slackTemplate = () => {
  const template = findTemplate("slack-customer-bug-triage");
  if (template === undefined) throw new Error("missing template fixture");
  return template;
};

const seeded = (): EditorForm =>
  formFromSeed(seedFromTemplate(slackTemplate()));

describe("trigger mapping", () => {
  it("keeps a template's event conditions and run condition", () => {
    expect(
      triggerFromTemplate({
        type: "slack",
        event: "message",
        conditions: { channels: [] },
        runWhen: "Run when a customer reports a bug",
      }),
    ).toEqual({
      type: "slack",
      event: "message",
      conditions: { channels: [] },
      runWhen: "Run when a customer reports a bug",
    });
  });

  it("defaults a schedule that ships without cron fields", () => {
    expect(triggerFromTemplate({ type: "schedule" })).toEqual({
      type: "schedule",
      cron: "0 9 * * *",
      timezone: "UTC",
    });
    expect(
      triggerFromTemplate({
        type: "schedule",
        cron: "0 9 * * 1",
        timezone: "UTC",
      }),
    ).toEqual({ type: "schedule", cron: "0 9 * * 1", timezone: "UTC" });
  });

  it("keeps an on-demand trigger free of conditions", () => {
    expect(triggerFromTemplate({ type: "on_demand" })).toEqual({
      type: "on_demand",
    });
  });
});

describe("seeds", () => {
  it("starts blank with a new thread each run", () => {
    expect(blankSeed()).toEqual({
      name: "",
      description: "",
      prompt: "",
      triggers: [],
      runWhen: "",
      runsIn: { threadMode: "new", singleJamId: null },
    });
  });

  it("seeds name, description, instructions, triggers and run condition", () => {
    const seed = seedFromTemplate(slackTemplate());
    expect(seed.name).toBe("Slack customer bug triage");
    expect(seed.description).toBe(
      "Detect customer bug reports in Slack, investigate impact, and prepare a verified fix path",
    );
    expect(seed.prompt.startsWith("Triage the Slack report")).toBe(true);
    expect(seed.triggers).toHaveLength(1);
    expect(seed.runWhen.startsWith("Run when a customer reports")).toBe(true);
    expect(seed.runsIn).toEqual({ threadMode: "new", singleJamId: null });
  });

  it("pins to the thread and names the automation after it", () => {
    expect(seedFromThread("jam_sample", "Ship the settings page")).toEqual({
      name: "Ship the settings page",
      description: "",
      prompt: "Ship the settings page",
      triggers: [],
      runWhen: "",
      runsIn: { threadMode: "single", singleJamId: "jam_sample" },
    });
    expect(seedFromThread("jam_sample", null).name).toBe("");
  });

  it("leaves a seeded template ready to create", () => {
    const form = seeded();
    expect(canSave(form)).toBe(true);
    expect(form.runsIn).toEqual({ threadMode: "new", singleJamId: null });
  });
});

describe("create payload", () => {
  it("sends the seeded automation under the chosen project", () => {
    const payload = createPayload(seeded(), {
      projectId: "proj_sample",
      viewerId: "user_sample_alex",
    });
    expect(payload.projectId).toBe("proj_sample");
    expect(payload.name).toBe("Slack customer bug triage");
    expect(payload.prompt.startsWith("Triage the Slack report")).toBe(true);
    expect(payload.enabled).toBe(true);
    expect(payload.triggers).toHaveLength(1);
    expect(payload.runAsKind).toBe("human");
    expect(payload.runAsId).toBe("user_sample_alex");
    expect(payload.quietSlackPosts).toBe(false);
    expect(payload.organize).toBeNull();
  });

  it("trims the name and prompt and drops an empty description", () => {
    const form = formFromSeed({
      ...blankSeed(),
      name: "  Nightly checks  ",
      prompt: "  Check dependencies  ",
    });
    const payload = createPayload(form, {
      projectId: "proj_sample",
      viewerId: undefined,
    });
    expect(payload.name).toBe("Nightly checks");
    expect(payload.prompt).toBe("Check dependencies");
    expect(payload.description).toBeNull();
    expect(payload.enabled).toBe(false);
    expect(payload.runAsId).toBe("");
  });

  it("carries a pinned thread and the picked run-as person", () => {
    const form: EditorForm = {
      ...formFromSeed(seedFromThread("jam_sample", "Ship it")),
      runAs: { kind: "service", id: "svc_sample" },
    };
    const payload = createPayload(form, {
      projectId: "proj_sample",
      viewerId: "user_sample_alex",
    });
    expect(payload.threadMode).toBe("single");
    expect(payload.singleJamId).toBe("jam_sample");
    expect(payload.runAsKind).toBe("service");
    expect(payload.runAsId).toBe("svc_sample");
  });
});

describe("created automation id", () => {
  it("reads the id from the undecoded create response", () => {
    expect(createdAutomationId({ id: "auto_sample" })).toBe("auto_sample");
  });

  it("returns nothing for responses without an id", () => {
    expect(createdAutomationId(null)).toBeUndefined();
    expect(createdAutomationId("auto_sample")).toBeUndefined();
    expect(createdAutomationId({ id: "" })).toBeUndefined();
    expect(createdAutomationId({})).toBeUndefined();
  });
});
