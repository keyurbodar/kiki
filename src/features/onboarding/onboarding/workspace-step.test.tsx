import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pressStepPrimary } from "./shell";
import { WorkspaceStep } from "./workspace-step";

afterEach(cleanup);

describe("WorkspaceStep", () => {
  it("creates a personal workspace from the audience view", () => {
    const onChoose = vi.fn();
    render(
      <WorkspaceStep
        invitations={[]}
        joinableOrganizations={[]}
        personalName="Alex Morgan"
        onChoose={onChoose}
      />,
    );
    expect(screen.getByText("Who is this workspace for?")).toBeTruthy();
    const proceed = screen.getByRole("button", { name: /Continue/ });
    expect((proceed as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: /Just me/ }));
    fireEvent.click(proceed);
    expect(onChoose).toHaveBeenCalledWith("Alex Morgan", "personal");
  });

  it("names a team workspace and picks sharing", () => {
    const onChoose = vi.fn();
    render(
      <WorkspaceStep
        invitations={[]}
        joinableOrganizations={[]}
        personalName="Alex Morgan"
        onChoose={onChoose}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /My team/ }));
    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(screen.getByText("How Acme shares work")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Keep it shared/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(onChoose).toHaveBeenCalledWith("Acme", "team", {
      defaultVisibility: "org",
      privateWork: false,
    });
  });

  it("opens on invitations when there are any", () => {
    render(
      <WorkspaceStep
        invitations={[
          {
            id: "inv_1",
            orgId: "org_1",
            orgName: "Acme",
            inviterName: "Sam Lee",
          },
        ]}
        joinableOrganizations={[]}
        personalName="Alex Morgan"
        onChoose={vi.fn()}
      />,
    );
    expect(screen.getByText("You've been invited to Acme")).toBeTruthy();
    expect(screen.getByText("Sam Lee invited you")).toBeTruthy();
  });
});

describe("pressStepPrimary", () => {
  it("clicks the last primary button on Enter", () => {
    const click = vi.fn();
    const panel = document.createElement("div");
    panel.innerHTML =
      '<span data-step-primary data-step-key="enter"><button type="button">Go</button></span>';
    panel.querySelector("button")?.addEventListener("click", click);
    document.body.append(panel);
    pressStepPrimary(panel, new KeyboardEvent("keydown", { key: "Enter" }));
    expect(click).toHaveBeenCalledTimes(1);
    pressStepPrimary(panel, new KeyboardEvent("keydown", { key: "Escape" }));
    expect(click).toHaveBeenCalledTimes(1);
    panel.remove();
  });

  it("needs the modifier when the step asks for mod-enter", () => {
    const click = vi.fn();
    const panel = document.createElement("div");
    panel.innerHTML =
      '<span data-step-primary data-step-key="mod-enter"><button type="button">Go</button></span>';
    panel.querySelector("button")?.addEventListener("click", click);
    document.body.append(panel);
    pressStepPrimary(panel, new KeyboardEvent("keydown", { key: "Enter" }));
    expect(click).not.toHaveBeenCalled();
    pressStepPrimary(
      panel,
      new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }),
    );
    expect(click).toHaveBeenCalledTimes(1);
    panel.remove();
  });
});
