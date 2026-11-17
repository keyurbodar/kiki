import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewSkillDialog, VolumeAddMenu } from "./volume-authoring";

afterEach(cleanup);

describe("VolumeAddMenu", () => {
  it("renders the Add trigger", () => {
    render(
      <VolumeAddMenu
        hasInstructions={false}
        onNewFile={vi.fn()}
        onNewSkill={vi.fn()}
        onAddInstructions={vi.fn()}
        onUploads={vi.fn()}
      />,
    );
    const add = screen.getByRole("button", { name: "Add" });
    expect(add.querySelector("svg")).not.toBeNull();
  });
});

describe("NewSkillDialog", () => {
  it("slugs the name, previews the path and blocks taken names", () => {
    render(
      <NewSkillDialog
        open
        onOpenChange={vi.fn()}
        existing={new Set(["triage"])}
        onCreate={vi.fn(() => Promise.resolve(true))}
      />,
    );
    const name = screen.getByPlaceholderText(
      "release-check",
    ) as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Release Check" } });
    expect(name.value).toBe("release-check");
    expect(screen.getByText(/skills\/release-check\/SKILL\.md/)).toBeTruthy();
    fireEvent.change(name, { target: { value: "triage" } });
    expect(
      screen.getByText("A skill with this name already exists"),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Create skill",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
