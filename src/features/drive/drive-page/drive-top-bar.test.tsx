import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_OPEN_KEY, SidebarProvider } from "@/primitives/sidebar";
import { DriveTopBar } from "./drive-top-bar";

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

const bar = (trailing?: React.ReactNode) => (
  <SidebarProvider>
    <DriveTopBar
      title="Capy Drive"
      search={{
        value: "",
        placeholder: "Search Capy Drive",
        onValueChange: () => {},
      }}
      trailing={trailing}
    />
  </SidebarProvider>
);

describe("the drive top bar", () => {
  it("carries the shell's sidebar trigger while the sidebar is collapsed", () => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    render(bar());
    expect(screen.getByRole("button", { name: "Open sidebar" })).toBeTruthy();
  });

  it("keeps the title, the search toggle and the trailing actions", () => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, "false");
    render(bar(<a href="/drive/shared">Shared</a>));
    expect(screen.getByRole("heading", { name: "Capy Drive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Search" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Shared" })).toBeTruthy();
  });

  it("opens the search field behind the toggle", () => {
    render(bar());
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByPlaceholderText("Search Capy Drive")).toBeTruthy();
  });
});
