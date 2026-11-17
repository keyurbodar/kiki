import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  filterModelSections,
  MobileAddDrawer,
  MobileMachineDrawer,
  MobileModelDrawer,
  MobileTabDrawer,
} from "./index";

afterEach(cleanup);

const panes = [
  { id: "overview", label: "Overview", icon: "list", open: true },
  { id: "files", label: "Files", icon: "files", open: false },
];

describe("MobileTabDrawer", () => {
  it("lists panes, crew and terminals, and filters panes by search", () => {
    const onOpenPane = vi.fn();
    render(
      <MobileTabDrawer
        open
        title="Sample thread"
        panes={panes}
        crew={{ threads: 2, pullRequests: 5 }}
        sideThreads={1}
        terminals={{ status: "Awake", live: true }}
        onOpenPane={onOpenPane}
        onOpenSideThreads={() => {}}
        onNewTerminal={() => {}}
      />,
    );
    expect(screen.getByText("Sample thread")).toBeTruthy();
    expect(screen.getByText("Crew")).toBeTruthy();
    expect(screen.getByText("Pull requests")).toBeTruthy();
    expect(screen.getByText("Awake")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search tabs"), {
      target: { value: "fil" },
    });
    expect(screen.queryByText("Overview")).toBeNull();
    expect(screen.queryByText("New terminal")).toBeNull();
    fireEvent.click(screen.getByText("Files"));
    expect(onOpenPane).toHaveBeenCalledWith("files");
  });

  it("drops the crew group for threads without a crew", () => {
    render(
      <MobileTabDrawer
        open
        title="Sample thread"
        panes={panes}
        sideThreads={0}
        terminals={{ status: "Awake", live: true }}
        onOpenPane={() => {}}
        onOpenSideThreads={() => {}}
        onNewTerminal={() => {}}
      />,
    );
    expect(screen.queryByText("Crew")).toBeNull();
    expect(screen.getByText("Side threads")).toBeTruthy();
  });
});

describe("MobileAddDrawer", () => {
  it("offers side thread, attachments and references", () => {
    const onSelect = vi.fn();
    render(<MobileAddDrawer open onSelect={onSelect} />);
    for (const label of [
      "New side thread",
      "Upload attachment",
      "People",
      "Files",
    ])
      expect(screen.getByText(label)).toBeTruthy();
    fireEvent.click(screen.getByText("Environment variables"));
    expect(onSelect).toHaveBeenCalledWith("environment");
  });
});

describe("MobileModelDrawer", () => {
  const sections = [
    {
      id: "a",
      label: "Provider A",
      models: [
        { id: "m1", name: "Model One", price: "$1 / $2" },
        { id: "m2", name: "Model Two", badge: "Free" },
      ],
    },
    { id: "b", label: "Provider B", models: [{ id: "m3", name: "Other" }] },
  ];

  it("filters sections by model name", () => {
    expect(filterModelSections(sections, "two")).toEqual([
      { ...sections[0], models: [sections[0]?.models[1]] },
    ]);
  });

  it("marks the selected model and opens settings without selecting", () => {
    const onSelect = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <MobileModelDrawer
        open
        sections={sections}
        selectedId="m1"
        groupLabel="By provider"
        onSelect={onSelect}
        onOpenSettings={onOpenSettings}
        onGroupBy={() => {}}
      />,
    );
    const selected = screen.getByRole("option", { selected: true });
    expect(selected.textContent).toContain("Model One");
    expect(selected.textContent).not.toContain("$1 / $2");
    fireEvent.click(screen.getByLabelText("Other settings"));
    expect(onOpenSettings).toHaveBeenCalledWith("m3");
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Model Two"));
    expect(onSelect).toHaveBeenCalledWith("m2");
  });
});

describe("MobileMachineDrawer", () => {
  it("shows the machine and its actions", () => {
    const onAction = vi.fn();
    render(
      <MobileMachineDrawer
        open
        name="sample-box"
        detail="Worktree"
        live
        actions={[{ id: "move", label: "Move to cloud", icon: "cloud" }]}
        onAction={onAction}
      />,
    );
    expect(screen.getByText("sample-box")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Online" })).toBeTruthy();
    fireEvent.click(screen.getByText("Move to cloud"));
    expect(onAction).toHaveBeenCalledWith("move");
  });
});
