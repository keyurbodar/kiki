import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { SettingsRow } from "./settings-row";

it("renders label, description and control in Capy's slots", () => {
  render(
    <SettingsRow label="Sidebar" description="Choose pages" icon={<svg />}>
      <button type="button">Pages</button>
    </SettingsRow>,
  );
  const row = screen.getByText("Sidebar").closest("[data-slot=settings-row]");
  expect(row?.className).toContain("min-h-15");
  expect(screen.getByText("Choose pages").className).toContain("text-xs");
  expect(screen.getByText("Choose pages").className).toContain(
    "text-muted-foreground-2",
  );
});

it("makes the whole row clickable through the label button", () => {
  const onClick = vi.fn();
  render(
    <SettingsRow label="Open" onClick={onClick} descriptionTone="strong" />,
  );
  screen.getByRole("button", { name: "Open" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});
