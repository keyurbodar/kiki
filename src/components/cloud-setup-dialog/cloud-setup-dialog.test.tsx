import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CloudSetupDialog,
  type CloudSetupDialogProps,
  devicePlatform,
  guidanceTitle,
} from "./cloud-setup-dialog";

afterEach(cleanup);

const base: CloudSetupDialogProps = {
  open: true,
  onOpenChange: () => {},
  repos: [
    { repoFullName: "acme/web", covered: true },
    { repoFullName: "acme/api", covered: false },
  ],
  userConnected: false,
  installed: false,
  starting: false,
  onConnectUser: () => {},
  onManageInstall: () => {},
};

describe("guidanceTitle", () => {
  it("words each refusal for the device", () => {
    expect(guidanceTitle("auth", "Mac")).toBe(
      "GitHub is signed out on this Mac",
    );
    expect(guidanceTitle("missing", "PC")).toBe(
      "GitHub CLI is not installed on this PC",
    );
    expect(guidanceTitle("timeout", "computer")).toBe(
      "GitHub CLI can't answer on this computer",
    );
  });
});

describe("devicePlatform", () => {
  it("maps user agents to platforms", () => {
    expect(devicePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X)")).toBe(
      "darwin",
    );
    expect(devicePlatform("Mozilla/5.0 (Windows NT 10.0)")).toBe("win32");
    expect(devicePlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux");
  });
});

describe("CloudSetupDialog", () => {
  it("asks to connect GitHub before anything else", () => {
    const onConnectUser = vi.fn();
    render(<CloudSetupDialog {...base} onConnectUser={onConnectUser} />);
    expect(screen.getByText("Connect GitHub", { selector: "h2" })).toBeTruthy();
    expect(screen.getByText("Capy acts as you on GitHub")).toBeTruthy();
    expect(screen.getByText("Install the GitHub App")).toBeTruthy();
    expect(screen.queryByText("acme/web")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));
    expect(onConnectUser).toHaveBeenCalledOnce();
  });

  it("lists repo coverage once the user is connected", () => {
    const onManageInstall = vi.fn();
    render(
      <CloudSetupDialog
        {...base}
        projectName="Acme Web"
        userConnected
        installed
        onManageInstall={onManageInstall}
      />,
    );
    expect(screen.getByText("Set up cloud for Acme Web")).toBeTruthy();
    expect(
      screen.getByText("Grant the App access to these repos"),
    ).toBeTruthy();
    expect(screen.getByText("Covered")).toBeTruthy();
    expect(screen.getByText("Not covered")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Manage GitHub access" }),
    );
    expect(onManageInstall).toHaveBeenCalledOnce();
  });

  it("shows CLI guidance and the opening state", () => {
    render(
      <CloudSetupDialog
        {...base}
        starting
        guidance={{ refused: "missing", message: "Install gh to continue." }}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "GitHub CLI is not installed on this",
    );
    const opening = screen.getByRole("button", { name: "Opening GitHub" });
    expect(opening.hasAttribute("disabled")).toBe(true);
  });
});
