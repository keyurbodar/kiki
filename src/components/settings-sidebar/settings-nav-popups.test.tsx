import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsNavPopups } from "./settings-nav-popups";

const rows = [
  { to: "/settings/general", label: "General" },
  { to: "/settings/appearance", label: "Appearance" },
];

function Harness() {
  return (
    <SettingsNavPopups className="flex flex-col">
      <nav aria-label="Settings">
        {rows.map((row) => (
          <a
            key={row.to}
            href={row.to}
            data-slot="context-menu-trigger"
            data-nav-row={row.to}
            data-nav-label={row.label}
          >
            {row.label}
          </a>
        ))}
      </nav>
    </SettingsNavPopups>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("settings nav context menu", () => {
  it("opens Capy's row menu on right-click and opens the page in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    render(<Harness />);
    fireEvent.contextMenu(screen.getByText("General"));
    expect(await screen.findByText("Open in new tab")).toBeTruthy();
    expect(screen.getByText("Copy link")).toBeTruthy();
    fireEvent.click(screen.getByText("Open in new tab"));
    expect(openSpy).toHaveBeenCalledWith("/settings/general", "_blank");
  });

  it("copies the row's absolute link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<Harness />);
    fireEvent.contextMenu(screen.getByText("Appearance"));
    fireEvent.click(await screen.findByText("Copy link"));
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/settings/appearance`,
    );
  });

  it("opens nothing when the right-click misses a row", async () => {
    render(<Harness />);
    const nav = document.querySelector("nav");
    if (nav === null) throw new Error("no nav");
    fireEvent.contextMenu(nav);
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(screen.queryByText("Open in new tab")).toBeNull();
  });

  it("resolves the row under the pointer, not the first row", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    render(<Harness />);
    fireEvent.contextMenu(screen.getByText("Appearance"));
    fireEvent.click(await screen.findByText("Open in new tab"));
    expect(window.open).toHaveBeenCalledWith("/settings/appearance", "_blank");
    expect(window.open).not.toHaveBeenCalledWith("/settings/general", "_blank");
  });
});
