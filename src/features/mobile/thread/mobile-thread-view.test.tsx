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

  it("lays the pane over the transcript in the right panel", () => {
    render(
      <MobileThreadView
        title="Sample thread"
        sidebarTrigger={<button type="button">Open sidebar</button>}
        tabs={tabs}
        activeTab="overview"
        onSelectTab={() => {}}
        onCloseTab={() => {}}
        pane={<div>pane body</div>}
        composer={<div>composer</div>}
      >
        <div>timeline</div>
      </MobileThreadView>,
    );
    const panel = document.querySelector("[data-slot=right-panel]");
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("data-state")).toBe("open");
    expect(panel?.className ?? "").toContain("max-md:absolute");
    expect(
      document.querySelector("[data-slot=right-panel-content]")?.textContent,
    ).toBe("pane body");
    expect(screen.getByText("timeline")).toBeTruthy();
    expect(screen.getByText("composer")).toBeTruthy();
    expect(
      document
        .querySelector<HTMLElement>("[data-slot=right-panel-group]")
        ?.style.getPropertyValue("--thread-pane-top"),
    ).toMatch(/px$/);
  });

  it("mounts no panel while the chat tab is active", () => {
    render(
      <MobileThreadView
        title="Sample thread"
        sidebarTrigger={null}
        tabs={tabs}
        activeTab={CHAT_TAB}
        onSelectTab={() => {}}
        onCloseTab={() => {}}
        composer={<div>composer</div>}
      >
        <div>timeline</div>
      </MobileThreadView>,
    );
    expect(document.querySelector("[data-slot=right-panel]")).toBeNull();
    expect(screen.getByText("timeline")).toBeTruthy();
    expect(screen.getByText("composer")).toBeTruthy();
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

  it("reads the models array out of the endpoint's payload", () => {
    expect(
      modelSections({
        models: [{ id: "a", name: "A", provider: "P" }],
        credentials: [],
        services: [],
      }),
    ).toEqual([{ id: "P", label: "P", models: [{ id: "a", name: "A" }] }]);
  });
});
