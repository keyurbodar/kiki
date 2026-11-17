import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_OPEN_KEY, SidebarProvider } from "@/primitives/sidebar";
import { AppTopBar } from "./app-top-bar";

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

const bar = () => document.querySelector("header");

describe("AppTopBar", () => {
  it("renders the title in Capy's sticky bar", () => {
    render(<AppTopBar title="Threads" />);
    const heading = screen.getByRole("heading", { name: "Threads" });
    expect(heading.tagName).toBe("H1");
    expect(heading.className).toContain("truncate");
    expect(bar()?.className).toContain("sticky");
    expect(bar()?.className).toContain("border-b-hairline");
  });

  it("keeps a caller's bar classes instead of the default ones", () => {
    render(<AppTopBar className="flex px-3" />);
    expect(bar()?.className).toBe("flex px-3");
  });

  it("renders the leading breadcrumb and the trailing actions", () => {
    render(
      <AppTopBar
        leading={<a href="/projects">Projects</a>}
        title="Threads"
        trailing={<button type="button">New</button>}
      />,
    );
    expect(screen.getByRole("link", { name: "Projects" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New" })).toBeTruthy();
  });

  it("shows the sidebar trigger when the sidebar is collapsed", () => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    render(
      <SidebarProvider>
        <AppTopBar title="Threads" />
      </SidebarProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    expect(trigger.closest("span")?.className).toContain("w-(--h-control-sm)");
  });

  it("collapses the trigger rail to nothing while the sidebar is open", () => {
    render(
      <SidebarProvider>
        <AppTopBar title="Threads" />
      </SidebarProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Close sidebar" });
    expect(trigger.closest("span")?.className).toContain("w-0");
  });

  it("renders without a sidebar trigger outside a SidebarProvider", () => {
    render(<AppTopBar title="Settings" />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
