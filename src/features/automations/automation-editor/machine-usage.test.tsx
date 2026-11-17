import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsRow } from "@/primitives/settings-row";
import { EditorSections } from "./editor-sections";
import {
  type MachineHourMeter,
  MachineUsageNote,
  machineHoursLeft,
  machineMinuteRate,
  machineUsageLine,
} from "./machine-usage";
import type { EditorForm } from "./model";

afterEach(cleanup);

const meter: MachineHourMeter = { allowance: 30000, consumed: 29875 };

describe("machine usage copy", () => {
  it("prints Capy's line from the meter", () => {
    expect(machineUsageLine(meter, 4)).toBe(
      "Uses 4 machine minutes a minute, about 125 h of the 30,000 left",
    );
  });

  it("derives every number, so another meter reads another line", () => {
    expect(machineUsageLine({ allowance: 2500, consumed: 400 }, 1)).toBe(
      "Uses 1 machine minute a minute, about 2,100 h of the 2,500 left",
    );
    expect(machineHoursLeft({ allowance: 2500, consumed: 2600 })).toBe(0);
    expect(machineUsageLine(meter, null)).toBe(
      "About 125 h of the 30,000 left",
    );
  });

  it("takes the minute rate from the machine size", () => {
    expect(machineMinuteRate("large")).toBe(4);
    expect(machineMinuteRate("ultra")).toBe(8);
    expect(machineMinuteRate(null)).toBeNull();
  });
});

describe("machine usage note", () => {
  const renderRow = () =>
    render(
      <SettingsRow
        label="Machine size"
        description={
          <>
            Compute for each run&apos;s machine, project default when unset
            <MachineUsageNote meter={meter} size="large" />
          </>
        }
      >
        <span>4 CPU / 16 GB</span>
      </SettingsRow>,
    );

  it("adds a third line to the row", () => {
    const { baseElement } = renderRow();
    const row = baseElement.querySelector("[data-slot='settings-row']");
    const text = row?.textContent ?? "";
    expect(text.indexOf("Machine size")).toBeLessThan(
      text.indexOf("Compute for each run's machine"),
    );
    expect(text.indexOf("Compute for each run's machine")).toBeLessThan(
      text.indexOf("Uses 4 machine minutes a minute"),
    );
    const column = row?.firstElementChild?.firstElementChild;
    const description = column?.children[1];
    expect(description?.childNodes).toHaveLength(2);
  });

  it("opens How usage counts", async () => {
    renderRow();
    const trigger = screen.getByRole("button", { name: "How usage counts" });
    expect(trigger.dataset.slot).toBe("popover-trigger");
    fireEvent.click(trigger);
    await screen.findByText(/Past the allowance/);
    expect(screen.getByText(/29,875 of 30,000 machine hours/)).toBeTruthy();
    expect(screen.getByText(/uses 4 machine minutes/)).toBeTruthy();
  });
});

const form: EditorForm = {
  name: "Nightly dependency check",
  description: "",
  prompt: "",
  runWhen: "",
  triggers: [{ type: "schedule", cron: "0 2 * * *", timezone: "UTC" }],
  maxRunsPerDay: null,
  model: null,
  machineSize: null,
  pin: false,
  folderIds: [],
  tagIds: [],
  runAs: null,
  slackImpersonation: false,
  quietSlackPosts: null,
  runsIn: { threadMode: "new", singleJamId: null },
};

const limitsSections = (machineUsage?: MachineHourMeter) => (
  <EditorSections
    form={form}
    setForm={() => {}}
    mixedRunWhen={false}
    serviceRunAs={false}
    folders={[]}
    tags={[]}
    machineSizeDefault="large"
    machineUsage={machineUsage}
  />
);

describe("the Limits row", () => {
  it("carries the usage line the allowance gives it", () => {
    render(limitsSections(meter));
    const row = [
      ...document.querySelectorAll("[data-slot='settings-row']"),
    ].find((candidate) => candidate.textContent?.startsWith("Machine size"));
    expect(row?.textContent).toContain(
      "Uses 4 machine minutes a minute, about 125 h of the 30,000 left",
    );
    expect(
      screen.getByRole("button", { name: "How usage counts" }),
    ).toBeTruthy();
  });

  it("leaves the line out while the payload carries no allowance", () => {
    render(limitsSections(undefined));
    expect(
      screen.queryByRole("button", { name: "How usage counts" }),
    ).toBeNull();
  });
});
