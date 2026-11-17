import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  formatMachine,
  type MachineSize,
} from "@/components/plan-picker/plan-catalog";
import { MachineConfigMenu } from "./machine-config";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

/** The size labels carry non-breaking spaces, so compare their raw text. */
const rawText = (text: string) => text;

/** A size label sits on its own row, on the submenu's value, and on the Default row. */
const sizeRows = (size: MachineSize) =>
  screen.queryAllByText(formatMachine(size), { normalizer: rawText });

const openMenu = () =>
  fireEvent.click(screen.getByLabelText("Machine configuration"));

describe("MachineConfigMenu", () => {
  it("opens the menu from the footer trigger", async () => {
    render(<MachineConfigMenu />);
    expect(screen.queryByText("MCP servers")).toBeNull();
    openMenu();
    expect(await screen.findByText("Machine size")).toBeTruthy();
    expect(screen.getByText("MCP servers")).toBeTruthy();
  });

  it("labels itself as the thread configuration when it carries organize rows", () => {
    render(<MachineConfigMenu organize={<span>Pin</span>} />);
    expect(screen.getByLabelText("Thread configuration")).toBeTruthy();
  });

  it("offers Default, every permitted size, and their price", () => {
    render(
      <MachineConfigMenu defaultOpen="machine-size" defaultSize="medium" />,
    );
    expect(screen.getByText("Default")).toBeTruthy();
    for (const size of [
      "small",
      "medium",
      "large",
      "ultra",
      "hyper",
    ] as const) {
      expect(sizeRows(size).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("$0.20/hr")).toBeTruthy();
    expect(sizeRows("bigguy")).toHaveLength(0);
    // The submenu's value, the Default row and the row itself carry the project's size.
    expect(sizeRows("medium")).toHaveLength(3);
  });

  it("hides Big Guy unless the org has it", () => {
    render(<MachineConfigMenu defaultOpen="machine-size" bigGuyAvailable />);
    expect(sizeRows("bigguy")).toHaveLength(1);
    expect(screen.getByText("$3.20/hr")).toBeTruthy();
  });

  it("hides sizes above the largest the org may pick and clamps the default", () => {
    render(
      <MachineConfigMenu
        defaultOpen="machine-size"
        maxSize="medium"
        defaultSize="ultra"
      />,
    );
    expect(sizeRows("small")).toHaveLength(1);
    expect(sizeRows("large")).toHaveLength(0);
    expect(sizeRows("ultra")).toHaveLength(0);
    expect(sizeRows("medium")).toHaveLength(3);
  });

  it("reports the size the row picks and the Default row's inherit", () => {
    const onSizeChange = vi.fn();
    render(
      <MachineConfigMenu
        defaultOpen="machine-size"
        size="large"
        onSizeChange={onSizeChange}
      />,
    );
    const [ultraRow] = sizeRows("ultra");
    if (ultraRow === undefined) throw new Error("the ultra row is missing");
    fireEvent.click(ultraRow);
    expect(onSizeChange).toHaveBeenCalledWith("ultra");
    fireEvent.click(screen.getByText("Default"));
    expect(onSizeChange).toHaveBeenLastCalledWith(null);
  });

  it("shows the status dot once the thread overrides the project default", () => {
    const inherited = render(<MachineConfigMenu />);
    expect(inherited.container.querySelector(".bg-primary")).toBeNull();
    inherited.unmount();
    const overriding = render(<MachineConfigMenu size="large" />);
    expect(overriding.container.querySelector(".bg-primary")).not.toBeNull();
  });

  it("swaps the cloud rows for the worktree base on a device run", async () => {
    const onFromOriginChange = vi.fn();
    render(
      <MachineConfigMenu
        runsOn="device"
        projectId="proj_1"
        worktree={{ fromOrigin: true, onFromOriginChange }}
      />,
    );
    openMenu();
    expect(await screen.findByText("Worktree base")).toBeTruthy();
    expect(screen.queryByText("Machine size")).toBeNull();
    expect(screen.queryByText("Setup and snapshots")).toBeNull();
    fireEvent.click(screen.getByText("Worktree base"));
    fireEvent.click(await screen.findByText("Local"));
    expect(onFromOriginChange).toHaveBeenCalledWith(false);
  });

  it("links the project rows to setup and snapshots", async () => {
    render(<MachineConfigMenu projectId="proj_1" />);
    openMenu();
    fireEvent.click(await screen.findByText("Setup and snapshots"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/settings/projects/$projectId/dev-environment",
      params: { projectId: "proj_1" },
    });
  });

  it("links the project rows to environment variables", async () => {
    render(<MachineConfigMenu projectId="proj_1" />);
    openMenu();
    fireEvent.click(await screen.findByText("Environment variables"));
    expect(navigate).toHaveBeenCalledWith({
      to: "/settings/projects/$projectId/environment-variables",
      params: { projectId: "proj_1" },
    });
  });

  it("leaves the project rows inert without a project", () => {
    render(<MachineConfigMenu />);
    openMenu();
    expect(
      screen.getByText("Setup and snapshots").closest("[data-disabled]"),
    ).not.toBeNull();
  });
});
