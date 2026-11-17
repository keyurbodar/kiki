import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  BranchTrigger,
  ComposerFooter,
  MachineTrigger,
} from "./composer-footer";
import {
  allocationSummary,
  branchRows,
  formatDuration,
  formatElapsed,
  formatGb,
  handoffLabel,
  machineTriggerLabel,
  type RunningHandoff,
  summarizeSetup,
} from "./machine";

afterEach(cleanup);

const handoff = (
  direction: RunningHandoff["direction"],
  state: RunningHandoff["state"],
): RunningHandoff => ({
  id: "handoff_1",
  direction,
  state,
  deviceId: "dev_1",
  createdAt: new Date(0),
});

describe("machine trigger label", () => {
  const laptop = { name: "Studio laptop", workspaceKind: "worktree" as const };

  it("reads the cloud machine detail", () => {
    expect(
      machineTriggerLabel({
        device: null,
        handoff: null,
        handoffText: null,
        settingUp: false,
        detail: null,
      }),
    ).toBe("Cloud");
    expect(
      machineTriggerLabel({
        device: null,
        handoff: null,
        handoffText: null,
        settingUp: false,
        detail: "Asleep",
      }),
    ).toBe("Cloud · Asleep");
  });

  it("names the device and its workspace kind", () => {
    const base = { handoff: null, handoffText: null, detail: null };
    expect(
      machineTriggerLabel({ ...base, device: laptop, settingUp: false }),
    ).toBe("Studio laptop · Worktree");
    expect(
      machineTriggerLabel({
        ...base,
        device: { ...laptop, workspaceKind: "checkout" },
        settingUp: false,
      }),
    ).toBe("Studio laptop · Current checkout");
    expect(
      machineTriggerLabel({ ...base, device: laptop, settingUp: true }),
    ).toBe("Studio laptop · Setting up");
  });

  it("shows a running handoff", () => {
    const toDevice = handoff("cloud_to_device", "staged");
    expect(handoffLabel(toDevice, false)).toBe("Uploaded");
    expect(handoffLabel(toDevice, true)).toBe("Waiting for Setup");
    expect(handoffLabel(handoff("device_to_cloud", "staged"), false)).toBe(
      "Waking",
    );
    expect(
      machineTriggerLabel({
        device: laptop,
        handoff: toDevice,
        handoffText: "Uploaded",
        settingUp: false,
        detail: null,
      }),
    ).toBe("Studio laptop · Uploaded");
    expect(
      machineTriggerLabel({
        device: null,
        handoff: handoff("device_to_cloud", "restoring"),
        handoffText: "Restoring",
        settingUp: false,
        detail: null,
      }),
    ).toBe("Cloud · Restoring");
  });
});

describe("machine formatting", () => {
  it("formats sizes and durations", () => {
    expect(formatGb(16 * 1073741824)).toBe("16");
    expect(formatGb(1.25 * 1073741824)).toBe("1.3");
    expect(
      allocationSummary({
        size: "large",
        cpuCount: 4,
        memoryBytes: 16 * 1073741824,
        diskBytes: 64 * 1073741824,
      }),
    ).toBe("4 vCPU · 16 GB · 64 GB disk");
    expect(formatDuration(400)).toBe("1s");
    expect(formatDuration(200_000)).toBe("3m 20s");
    expect(formatDuration(3_900_000)).toBe("1h 5m");
    expect(formatDuration(-1)).toBe("—");
    expect(formatElapsed(0)).toBe("0s");
  });

  it("rolls setup steps up per phase", () => {
    const step = (
      phase: "initialize" | "refresh" | "startup",
      status: "success" | "running" | "error" | "not_ready",
      repo: string,
      durationMs: number | null = null,
    ) => ({
      phase,
      status,
      repoFullName: repo,
      startedAt: status === "running" ? new Date(1000) : null,
      durationMs,
    });
    expect(
      summarizeSetup([
        step("startup", "success", "acme/web"),
        step("initialize", "success", "acme/web", 4000),
        step("initialize", "running", "acme/api"),
        step("refresh", "error", "acme/web"),
      ]),
    ).toEqual([
      {
        phase: "initialize",
        status: "running",
        count: 2,
        startedAt: 1000,
        durationMs: 4000,
      },
      {
        phase: "refresh",
        status: "error",
        count: 1,
        startedAt: null,
        durationMs: null,
      },
      {
        phase: "startup",
        status: "success",
        count: 1,
        startedAt: null,
        durationMs: null,
      },
    ]);
  });

  it("lists branches with repo labels", () => {
    expect(
      branchRows([
        { repo: ".", repoFullName: null, branch: "main" },
        { repo: "web", repoFullName: "acme/web", branch: "feat/dark-mode" },
        { repo: "api", repoFullName: "acme/api", branch: null },
      ]),
    ).toEqual([
      { key: ".", label: "workspace", repoFullName: null, branch: "main" },
      {
        key: "web",
        label: "web",
        repoFullName: "acme/web",
        branch: "feat/dark-mode",
      },
    ]);
  });
});

describe("ComposerFooter", () => {
  it("renders the machine and branch chips and the meter slot", () => {
    render(
      <ComposerFooter
        machine={
          <MachineTrigger
            machine={{
              device: null,
              state: "running",
              color: "success",
              statusLabel: "Running",
              detail: null,
              allocation: null,
              sizeLabel: null,
              settingUp: false,
              setupDegraded: false,
              setupSteps: [],
            }}
          />
        }
        branch={
          <BranchTrigger
            repos={[{ repo: "web", repoFullName: "acme/web", branch: "main" }]}
          />
        }
        meter={<span>meter</span>}
      />,
    );
    expect(screen.getByLabelText("Machine").textContent).toContain("Cloud");
    expect(screen.getByLabelText("Copy main")).toBeTruthy();
    expect(screen.getByText("meter")).toBeTruthy();
  });

  it("hides the branch chip without branches", () => {
    const { container } = render(<BranchTrigger repos={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
