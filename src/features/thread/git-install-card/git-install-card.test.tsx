import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type GitBridge,
  GitInstallCard,
  nextInstallState,
} from "./git-install-card";

afterEach(cleanup);

const bridge = (overrides: Partial<GitBridge> = {}): GitBridge => ({
  gitBash: vi.fn(() => Promise.resolve(false)),
  installGit: vi.fn(() => Promise.resolve({ installed: true as const })),
  ...overrides,
});

describe("nextInstallState", () => {
  it("maps every install result to the next state", () => {
    expect(nextInstallState({ installed: true })).toEqual({
      state: "installed",
    });
    expect(nextInstallState({ opened: true })).toEqual({ state: "opened" });
    expect(nextInstallState({ refused: "Access denied" })).toEqual({
      state: "missing",
      error: "Access denied",
    });
  });
});

describe("GitInstallCard", () => {
  it("shows the install prompt when Git Bash is missing", async () => {
    render(<GitInstallCard bridge={bridge()} isThisDevice />);
    expect(
      await screen.findByText("Install Git for Windows to continue"),
    ).toBeTruthy();
  });

  it("installs Git when the Install Git button is clicked", async () => {
    render(<GitInstallCard bridge={bridge()} isThisDevice />);
    fireEvent.click(await screen.findByRole("button", { name: "Install Git" }));
    expect(await screen.findByText("Git for Windows installed")).toBeTruthy();
  });

  it("shows a refused installation as an alert", async () => {
    render(
      <GitInstallCard
        bridge={bridge({
          installGit: vi.fn(() =>
            Promise.resolve({ refused: "Access denied" }),
          ),
        })}
        isThisDevice
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Install Git" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe("Access denied"),
    );
  });

  it("renders nothing when Git Bash is present", async () => {
    const { container } = render(
      <GitInstallCard
        bridge={bridge({ gitBash: vi.fn(() => Promise.resolve(true)) })}
        isThisDevice
      />,
    );
    await waitFor(() => expect(container.innerHTML).toBe(""));
  });
});
