import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  accessDescription,
  runsInDescription,
  runsInLabel,
  selectableThreads,
  threadCode,
} from "./runs-in";
import { RunsInRows } from "./runs-in-select";

afterEach(cleanup);

const thread = {
  id: "jam_1",
  title: "Release prep",
  code: "ACME-1",
  archived: false,
};

describe("runs in copy", () => {
  it("labels each mode", () => {
    expect(
      runsInLabel({ threadMode: "new", singleJamId: null }, undefined),
    ).toBe("New thread each run");
    expect(
      runsInLabel({ threadMode: "single", singleJamId: null }, undefined),
    ).toBe("One standing thread");
    expect(
      runsInLabel({ threadMode: "single", singleJamId: "jam_1" }, thread),
    ).toBe("ACME-1");
    expect(
      runsInDescription({ threadMode: "new", singleJamId: null }, null),
    ).toBe("Each run starts a new thread");
    expect(
      runsInDescription({ threadMode: "single", singleJamId: null }, null),
    ).toBe("The first run starts a thread, and every later run continues it");
    expect(accessDescription("ACME-1", false)).toBe(
      "Everyone who can see ACME-1 sees this automation",
    );
    expect(accessDescription("ACME-1", true)).toBe(
      "Only people who can see ACME-1 see this automation and its runs",
    );
  });

  it("builds thread codes and filters selectable threads", () => {
    expect(
      threadCode({ threadNumber: 4, projectId: "p" }, [
        { id: "p", code: "ACME" },
      ]),
    ).toBe("ACME-4");
    expect(
      threadCode({ threadNumber: null, projectId: "p" }, [
        { id: "p", code: "ACME" },
      ]),
    ).toBeNull();
    const archived = { ...thread, id: "jam_2", archived: true };
    const taken = { ...thread, id: "jam_3" };
    expect(
      selectableThreads([thread, archived, taken], new Set(["jam_3"]), ""),
    ).toEqual([thread]);
    expect(selectableThreads([thread], new Set(), "acme-1")).toEqual([thread]);
    expect(selectableThreads([thread], new Set(), "zzz")).toEqual([]);
  });
});

describe("RunsInRows", () => {
  it("shows Access for an existing thread", () => {
    render(
      <RunsInRows
        runsIn={{ threadMode: "single", singleJamId: "jam_1" }}
        thread={{ ...thread, personal: false }}
        control={<button type="button">ACME-1</button>}
        project={null}
      />,
    );
    expect(screen.getByText("Every run continues ACME-1")).toBeTruthy();
    expect(screen.getByText("Shared")).toBeTruthy();
  });

  it("shows Project for a new thread each run", () => {
    render(
      <RunsInRows
        runsIn={{ threadMode: "new", singleJamId: null }}
        control={null}
        project={<span>Web</span>}
      />,
    );
    expect(
      screen.getByText("Runs start their thread in this project"),
    ).toBeTruthy();
  });
});
