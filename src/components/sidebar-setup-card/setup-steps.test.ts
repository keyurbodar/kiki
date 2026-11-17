import { describe, expect, it } from "vitest";
import {
  onboardingStatus,
  SETUP_STEP_IDS,
  setupSteps,
  setupVisible,
} from "./setup-steps";

describe("onboardingStatus", () => {
  it("reads steps by step or id and keeps completion flags", () => {
    const status = onboardingStatus({
      dismissed: false,
      steps: [
        { step: "connect-github", completed: true, skipped: false },
        { id: "ship-pr", completed: false, skipped: true },
      ],
    });
    expect(status).toEqual({
      dismissed: false,
      steps: [
        { step: "connect-github", completed: true, skipped: false },
        { step: "ship-pr", completed: false, skipped: true },
      ],
    });
  });

  it("returns undefined for a response it cannot read", () => {
    expect(onboardingStatus(null)).toBeUndefined();
    expect(onboardingStatus("nope")).toBeUndefined();
    expect(onboardingStatus({ dismissed: true })).toEqual({
      dismissed: true,
      steps: [],
    });
  });
});

describe("setupSteps", () => {
  it("keeps known steps in the order the api sent them", () => {
    const steps = setupSteps({
      dismissed: false,
      steps: [
        { step: "invite-teammate", completed: false, skipped: false },
        { step: "connect-github", completed: true, skipped: false },
        { step: "rename-organization", completed: false, skipped: false },
      ],
    });
    expect(steps.map((step) => step.id)).toEqual([
      "invite-teammate",
      "connect-github",
    ]);
    expect(steps[1]?.done).toBe(true);
    expect(steps[0]?.label).toBe("Invite a teammate");
  });

  it("carries the copy and action for every known step", () => {
    for (const id of SETUP_STEP_IDS) {
      const [step] = setupSteps({
        dismissed: false,
        steps: [{ step: id, completed: false, skipped: false }],
      });
      expect(step?.label).toBeTruthy();
      expect(typeof step?.action).toBe("string");
    }
  });
});

describe("setupVisible", () => {
  const status = (completed: boolean, dismissed = false) => ({
    dismissed,
    steps: [{ step: "connect-github", completed, skipped: false }],
  });

  it("shows while a step is outstanding", () => {
    expect(setupVisible(status(false))).toBe(true);
  });

  it("hides once dismissed or done, or with nothing to show", () => {
    expect(setupVisible(undefined)).toBe(false);
    expect(setupVisible(status(false, true))).toBe(false);
    expect(setupVisible(status(true))).toBe(false);
    expect(setupVisible({ dismissed: false, steps: [] })).toBe(false);
  });
});
