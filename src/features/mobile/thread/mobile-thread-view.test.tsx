import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHAT_TAB, MobileThreadView, modelSections } from "./index";

afterEach(cleanup);

describe("MobileThreadView", () => {
  const tabs = [{ id: "overview", label: "Overview", icon: "list" }];

  it("renders title, tabs and the composer on the chat tab", () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    render(
      <MobileThreadView
        title="Sample thread"
        sidebarTrigger={<button type="button">Open sidebar</button>}
        tabs={tabs}
        activeTab={CHAT_TAB}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        composer={<div>composer</div>}
      >
        <div>timeline</div>
      </MobileThreadView>,
    );
    expect(screen.getByRole("heading").textContent).toBe("Sample thread");
    expect(
      screen.getByRole("tab", { name: "Chat" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("composer")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
    expect(onSelectTab).toHaveBeenCalledWith("overview");
    fireEvent.click(screen.getByLabelText("Close Overview"));
    expect(onCloseTab).toHaveBeenCalledWith("overview");
  });

  it("hides the composer on a pane tab", () => {
    render(
      <MobileThreadView
        title="Sample thread"
        sidebarTrigger={null}
        tabs={tabs}
        activeTab="overview"
        onSelectTab={() => {}}
        onCloseTab={() => {}}
        composer={<div>composer</div>}
      >
        <div>pane</div>
      </MobileThreadView>,
    );
    expect(screen.queryByText("composer")).toBeNull();
  });
});

describe("modelSections", () => {
  it("groups models by provider and skips malformed rows", () => {
    expect(
      modelSections([
        { id: "a", name: "A", provider: "P" },
        { id: "b", provider: "P" },
        { name: "no id" },
        { id: "c", name: "C" },
      ]),
    ).toEqual([
      {
        id: "P",
        label: "P",
        models: [
          { id: "a", name: "A" },
          { id: "b", name: "b" },
        ],
      },
      { id: "Models", label: "Models", models: [{ id: "c", name: "C" }] },
    ]);
    expect(modelSections(undefined)).toEqual([]);
  });
});
