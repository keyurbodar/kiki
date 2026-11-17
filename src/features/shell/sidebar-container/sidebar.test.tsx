import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Sidebar } from "./sidebar";
import {
  clampSidebarWidth,
  readStoredSidebarOpen,
  readStoredSidebarWidth,
  SIDEBAR_OPEN_KEY,
  SIDEBAR_WIDTH_KEY,
  SidebarProvider,
  useSidebarActions,
  useSidebarState,
} from "./sidebar-state";
import { isSidebarToggleShortcut } from "./use-sidebar-shortcut";

let actions: ReturnType<typeof useSidebarActions>;
let state: ReturnType<typeof useSidebarState>;

function Probe() {
  actions = useSidebarActions();
  state = useSidebarState();
  return null;
}

const renderShell = () =>
  render(
    <SidebarProvider>
      <Probe />
      <Sidebar>
        <nav>nav</nav>
      </Sidebar>
    </SidebarProvider>,
  );

const slot = (container: HTMLElement, name: string) => {
  const el = container.querySelector<HTMLElement>(`[data-slot=${name}]`);
  if (!el) throw new Error(`missing ${name}`);
  return el;
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty("--sidebar-width-user");
});
afterEach(cleanup);

describe("sidebar width", () => {
  it("clamps to Capy's 224 to 330 range", () => {
    expect(clampSidebarWidth(100)).toBe(224);
    expect(clampSidebarWidth(260)).toBe(260);
    expect(clampSidebarWidth(900)).toBe(330);
  });

  it("reads persisted values and ignores junk", () => {
    expect(readStoredSidebarWidth()).toBeNull();
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "nope");
    expect(readStoredSidebarWidth()).toBeNull();
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "300");
    expect(readStoredSidebarWidth()).toBe(300);
    expect(readStoredSidebarOpen()).toBeNull();
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    expect(readStoredSidebarOpen()).toBe(false);
  });

  it("defaults to 240 on the wrapper", () => {
    const { container } = renderShell();
    const wrapper = slot(container, "sidebar-wrapper");
    expect(wrapper.style.getPropertyValue("--sidebar-width")).toBe(
      "var(--sidebar-width-user, 240px)",
    );
    expect(state.width).toBe(240);
  });

  it("hydrates width and open state from storage", () => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "999");
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    renderShell();
    expect(state.width).toBe(330);
    expect(state.open).toBe(false);
  });

  it("setWidth clamps, persists and sets the user variable", () => {
    renderShell();
    act(() => actions.setWidth(1000));
    expect(state.width).toBe(330);
    expect(localStorage.getItem(SIDEBAR_WIDTH_KEY)).toBe("330");
    expect(
      document.documentElement.style.getPropertyValue("--sidebar-width-user"),
    ).toBe("330px");
  });
});

describe("collapse and expand", () => {
  it("toggle persists the open state and hides the content", () => {
    const { container } = renderShell();
    const content = slot(container, "sidebar-content");
    expect(content.hasAttribute("inert")).toBe(false);
    expect(slot(container, "sidebar-gap").className).toContain(
      "w-(--sidebar-width)",
    );
    act(() => actions.toggle());
    expect(state.open).toBe(false);
    expect(localStorage.getItem(SIDEBAR_OPEN_KEY)).toBe("false");
    expect(content.hasAttribute("inert")).toBe(true);
    expect(slot(container, "sidebar-gap").className).toContain("w-0");
    expect(slot(container, "sidebar-container").className).toContain(
      "-translate-x-full",
    );
    expect(slot(container, "sidebar-rail").tabIndex).toBe(-1);
    act(() => actions.toggle());
    expect(state.open).toBe(true);
    expect(localStorage.getItem(SIDEBAR_OPEN_KEY)).toBe("true");
  });
});

describe("resize rail", () => {
  it("steps 8 with arrows and 32 with shift", () => {
    const { container } = renderShell();
    const rail = slot(container, "sidebar-rail");
    expect(rail.getAttribute("aria-label")).toBe("Resize sidebar");
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(state.width).toBe(248);
    fireEvent.keyDown(rail, { key: "ArrowLeft", shiftKey: true });
    expect(state.width).toBe(224);
  });

  it("double click resets to the default width", () => {
    const { container } = renderShell();
    act(() => actions.setWidth(300));
    fireEvent.doubleClick(slot(container, "sidebar-rail"));
    expect(state.width).toBe(240);
  });
});

describe("keyboard shortcut", () => {
  it("matches mod+b only", () => {
    const key = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);
    expect(isSidebarToggleShortcut(key({ key: "b", metaKey: true }))).toBe(
      true,
    );
    expect(isSidebarToggleShortcut(key({ key: "B", ctrlKey: true }))).toBe(
      true,
    );
    expect(isSidebarToggleShortcut(key({ key: "b" }))).toBe(false);
    expect(
      isSidebarToggleShortcut(key({ key: "b", metaKey: true, shiftKey: true })),
    ).toBe(false);
  });
});
