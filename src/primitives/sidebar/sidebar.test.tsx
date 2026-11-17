import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clampSidebarWidth,
  readStoredSidebarWidth,
  SIDEBAR_OPEN_KEY,
  SIDEBAR_WIDTH_KEY,
  Sidebar,
  SidebarPanel,
  SidebarProvider,
  SidebarTrigger,
  useSidebarActions,
  useSidebarState,
} from "./sidebar";

function Probe() {
  const { open, width, isNarrow } = useSidebarState();
  const { toggle } = useSidebarActions();
  return (
    <button type="button" onClick={toggle}>
      {`open=${open} width=${width} narrow=${isNarrow}`}
    </button>
  );
}

function renderShell() {
  return render(
    <SidebarProvider>
      <Sidebar>
        <Probe />
      </Sidebar>
      <SidebarPanel>main</SidebarPanel>
    </SidebarProvider>,
  );
}

const slot = (name: string) =>
  document.querySelector<HTMLElement>(`[data-slot=${name}]`);

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.removeProperty("--sidebar-width-user");
});
afterEach(cleanup);

describe("sidebar width", () => {
  it("clamps to Capy's 224 to 330 range", () => {
    expect(clampSidebarWidth(100)).toBe(224);
    expect(clampSidebarWidth(260)).toBe(260);
    expect(clampSidebarWidth(500)).toBe(330);
  });

  it("reads only finite stored widths", () => {
    expect(readStoredSidebarWidth()).toBeNull();
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "abc");
    expect(readStoredSidebarWidth()).toBeNull();
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "300");
    expect(readStoredSidebarWidth()).toBe(300);
  });
});

describe("SidebarProvider", () => {
  it("renders every sidebar slot", () => {
    renderShell();
    for (const name of [
      "sidebar-wrapper",
      "sidebar-gap",
      "sidebar-container",
      "sidebar-content",
      "sidebar-rail",
      "sidebar-panel",
    ])
      expect(slot(name)).not.toBeNull();
    expect(slot("sidebar-rail")?.tagName).toBe("BUTTON");
    expect(
      slot("sidebar-wrapper")?.style.getPropertyValue("--sidebar-width"),
    ).toBe("var(--sidebar-width-user, 240px)");
  });

  it("restores the stored width and open state, clamped", () => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, "900");
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    renderShell();
    expect(screen.getByRole("button", { name: /open=/ }).textContent).toBe(
      "open=false width=330 narrow=false",
    );
    expect(slot("sidebar-content")?.hasAttribute("inert")).toBe(true);
    expect(slot("sidebar-rail")?.tabIndex).toBe(-1);
    expect(slot("sidebar-container")?.className).toContain("-translate-x-full");
    expect(slot("sidebar-gap")?.className).toContain("w-0");
    expect(slot("sidebar-panel")?.className).toContain("md:ml-2");
  });

  it("toggles open and persists it", () => {
    renderShell();
    const probe = screen.getByRole("button", { name: /open=/ });
    act(() => probe.click());
    expect(probe.textContent).toContain("open=false");
    expect(localStorage.getItem(SIDEBAR_OPEN_KEY)).toBe("false");
    act(() => probe.click());
    expect(probe.textContent).toContain("open=true");
    expect(localStorage.getItem(SIDEBAR_OPEN_KEY)).toBe("true");
  });

  it("resizes from the rail with the arrow keys and resets on double click", () => {
    renderShell();
    const rail = screen.getByRole("button", { name: "Resize sidebar" });
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(localStorage.getItem(SIDEBAR_WIDTH_KEY)).toBe("248");
    expect(
      document.documentElement.style.getPropertyValue("--sidebar-width-user"),
    ).toBe("248px");
    fireEvent.keyDown(rail, { key: "ArrowLeft", shiftKey: true });
    expect(localStorage.getItem(SIDEBAR_WIDTH_KEY)).toBe("224");
    fireEvent.doubleClick(rail);
    expect(localStorage.getItem(SIDEBAR_WIDTH_KEY)).toBe("240");
  });

  it("labels the trigger by state", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Close sidebar" });
    expect(trigger.getAttribute("aria-pressed")).toBe("true");
    act(() => trigger.click());
    expect(
      screen
        .getByRole("button", { name: "Open sidebar" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("throws outside the provider", () => {
    expect(() => render(<Probe />)).toThrow(
      "useSidebarState must be inside SidebarProvider",
    );
  });
});
