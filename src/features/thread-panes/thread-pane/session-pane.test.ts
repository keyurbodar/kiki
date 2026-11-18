import { describe, expect, it } from "vitest";
import { parseSessionPane } from "./session-pane";

describe("parseSessionPane", () => {
  it("reads a browser session id", () => {
    expect(parseSessionPane("browser:tab_01")).toEqual({
      kind: "browser",
      sessionId: "tab_01",
    });
  });

  it("reads a shell's machine and client", () => {
    expect(parseSessionPane("shell:machine_01:cl_02")).toEqual({
      kind: "shell",
      machineId: "machine_01",
      clientId: "cl_02",
    });
  });

  it("refuses anything that is not a complete session key", () => {
    for (const value of [
      undefined,
      "browser",
      "browser:",
      "browser:tab:extra",
      "shell:machine_01",
      "shell::cl_02",
      "shell:machine_01:",
      "overview",
    ])
      expect(parseSessionPane(value)).toBeUndefined();
  });
});
