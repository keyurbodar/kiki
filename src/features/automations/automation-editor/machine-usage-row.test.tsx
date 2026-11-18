import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MachineHourMeter } from "@/components/machine-usage";
import { EditorSections } from "./editor-sections";
import type { EditorForm } from "./model";

afterEach(cleanup);

const meter = { allowance: 30000, consumed: 29875 };

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
