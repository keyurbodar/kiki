import { describe, expect, it } from "vitest";
import {
  type Automation,
  addTrigger,
  applyRunWhen,
  canSave,
  defaultTrigger,
  formFromAutomation,
  hasDuplicateSchedules,
  isDirty,
  maxTriggers,
  organizeOf,
  savedAutomation,
  toggleId,
  updatePayload,
  withRunAs,
} from "./model";
import { nextSchedule } from "./schedule";

const automation: Automation = {
  id: "auto_sample",
  projectId: "proj_sample",
  name: "Nightly dependency check",
  description: null,
  prompt: "Check dependencies",
  enabled: false,
  creator: "Alex Morgan",
  creatorUserId: "user_sample_alex",
  runAsKind: "human",
  runAsId: "user_sample_alex",
  slackImpersonation: false,
  quietSlackPosts: false,
  threadMode: "new",
  singleJamId: null,
  triggers: [{ type: "schedule", cron: "*/10 * * * *", timezone: "UTC" }],
  model: null,
  maxRunsPerDay: null,
  machineSize: null,
  organize: { pin: true, tags: ["tag_sample"] },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("form", () => {
  it("builds the editor form from an automation", () => {
    const form = formFromAutomation(automation);
    expect(form).toMatchObject({
      description: "",
      pin: true,
      folderIds: [],
      tagIds: ["tag_sample"],
      runsIn: { threadMode: "new", singleJamId: null },
      runAs: null,
    });
    expect(canSave(form)).toBe(true);
    expect(isDirty(form, formFromAutomation(automation))).toBe(false);
  });

  it("blocks saving without a name, prompt, trigger or with duplicate schedules", () => {
    const form = formFromAutomation(automation);
    expect(canSave({ ...form, name: " " })).toBe(false);
    expect(canSave({ ...form, prompt: "" })).toBe(false);
    expect(canSave({ ...form, triggers: [] })).toBe(false);
    const twice = [...form.triggers, ...form.triggers];
    expect(hasDuplicateSchedules(twice)).toBe(true);
    expect(canSave({ ...form, triggers: twice })).toBe(false);
  });

  it("clears pin, tags and Slack impersonation for a service run-as", () => {
    const form = {
      ...formFromAutomation(automation),
      slackImpersonation: true,
    };
    expect(withRunAs(form, { kind: "service", id: "svc" })).toMatchObject({
      pin: false,
      tagIds: [],
      slackImpersonation: false,
    });
    expect(withRunAs(form, { kind: "human", id: "u" }).pin).toBe(true);
  });

  it("drops empty organize settings", () => {
    const form = formFromAutomation(automation);
    expect(organizeOf({ ...form, pin: false, tagIds: [] })).toBeNull();
    expect(organizeOf(form)).toEqual({
      pin: true,
      folders: undefined,
      tags: ["tag_sample"],
    });
    expect(toggleId(["a"], "a")).toEqual([]);
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
  });
});

describe("addTrigger", () => {
  const form = formFromAutomation(automation);

  it("adds a schedule after the last one at the next free time", () => {
    const result = addTrigger(form, defaultTrigger("schedule"), nextSchedule);
    expect(result.kind).toBe("added");
    if (result.kind === "added") expect(result.triggers).toHaveLength(2);
  });

  it("allows one webhook and one manual trigger", () => {
    const withWebhook = {
      ...form,
      triggers: [defaultTrigger("incoming_webhook")],
    };
    expect(
      addTrigger(withWebhook, defaultTrigger("incoming_webhook"), nextSchedule),
    ).toEqual({
      kind: "warning",
      title: "Only one webhook trigger is allowed",
      description: "Edit the existing one instead",
    });
  });

  it("caps triggers at twenty", () => {
    const full = {
      ...form,
      triggers: Array.from({ length: maxTriggers }, () =>
        defaultTrigger("github"),
      ),
    };
    expect(
      addTrigger(full, defaultTrigger("slack"), nextSchedule),
    ).toMatchObject({
      kind: "warning",
      title: "Automations can have up to 20 triggers",
    });
  });

  it("carries the shared run-when condition onto event triggers", () => {
    const result = addTrigger(
      { ...form, runWhen: " real bug " },
      defaultTrigger("slack"),
      nextSchedule,
    );
    expect(result.kind === "added" && result.triggers.at(-1)).toMatchObject({
      runWhen: "real bug",
    });
  });
});

describe("save", () => {
  it("applies run-when unless each trigger keeps its own", () => {
    const triggers = [defaultTrigger("github"), defaultTrigger("schedule")];
    expect(applyRunWhen(triggers, "x", false)[0]).toMatchObject({
      runWhen: "x",
    });
    expect(applyRunWhen(triggers, "x", true)).toBe(triggers);
    expect(
      applyRunWhen(
        [{ ...defaultTrigger("github"), runWhen: "y" } as never],
        "",
        false,
      )[0],
    ).not.toHaveProperty("runWhen");
  });

  it("sends run-as and runs-in only when they changed", () => {
    const form = formFromAutomation(automation);
    const same = savedAutomation(automation, form, form.triggers, new Date(0));
    expect(updatePayload(same, automation, form)).not.toHaveProperty("runAsId");
    expect(updatePayload(same, automation, form)).not.toHaveProperty(
      "threadMode",
    );
    const changed = {
      ...form,
      runAs: { kind: "human" as const, id: "user_sample_sam" },
      runsIn: { threadMode: "single" as const, singleJamId: "jam_sample" },
    };
    const next = savedAutomation(
      automation,
      changed,
      form.triggers,
      new Date(0),
    );
    expect(updatePayload(next, automation, changed)).toMatchObject({
      runAsId: "user_sample_sam",
      threadMode: "single",
      singleJamId: "jam_sample",
    });
  });
});
