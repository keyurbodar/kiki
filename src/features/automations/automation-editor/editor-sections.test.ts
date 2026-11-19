import { describe, expect, it } from "vitest";
import { formatMachine } from "@/components/plan-picker/plan-catalog";
import {
  limitsDescription,
  machineSizeLabel,
  modelLabel,
  parseMaxRuns,
  reasoningLabel,
} from "./editor-sections";
import { defaultTrigger } from "./model";
import { initialsOf } from "./parts";
import { triggerTitle } from "./triggers";

describe("editor copy", () => {
  it("labels models and reasoning", () => {
    expect(modelLabel({ id: "acme/fast-model-free", reasoning: null })).toBe(
      "fast model free",
    );
    expect(reasoningLabel("medium")).toBe("Medium");
    expect(reasoningLabel(null)).toBeNull();
  });

  it("describes limits by trigger mix", () => {
    expect(limitsDescription([defaultTrigger("schedule")])).toBe(
      "Extra events are skipped and start no thread",
    );
    expect(limitsDescription([defaultTrigger("incoming_webhook")])).toBe(
      "Extra events are skipped and listed in Incoming events under History",
    );
    expect(
      limitsDescription([
        defaultTrigger("incoming_webhook"),
        defaultTrigger("schedule"),
      ]),
    ).toContain("grouped webhook");
  });

  it("labels the machine size each run inherits", () => {
    expect(machineSizeLabel(null, "large")).toBe(formatMachine("large"));
    expect(machineSizeLabel("small", "large")).toBe(formatMachine("small"));
    expect(machineSizeLabel("nonsense", "large")).toBe(formatMachine("large"));
    expect(machineSizeLabel(null, null)).toBe("Project default");
  });

  it("parses max runs per day", () => {
    expect(parseMaxRuns("")).toBeNull();
    expect(parseMaxRuns("0")).toBeNull();
    expect(parseMaxRuns("3.7")).toBe(3);
  });

  it("titles triggers and initials", () => {
    expect(triggerTitle(defaultTrigger("schedule"))).toBe("On a schedule");
    expect(triggerTitle(defaultTrigger("on_demand"))).toBe("Manual run");
    expect(triggerTitle(defaultTrigger("github"))).toBe("GitHub");
    expect(initialsOf("Alex Morgan")).toBe("AM");
  });
});
