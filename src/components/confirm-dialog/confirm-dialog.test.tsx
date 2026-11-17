import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

afterEach(cleanup);

const base = {
  open: true,
  title: "Delete project?",
  description: "This removes the project for everyone.",
  confirmLabel: "Delete",
};

describe("ConfirmDialog", () => {
  it("renders the title, description and both actions", () => {
    render(
      <ConfirmDialog {...base} onOpenChange={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByText("Delete project?")).toBeTruthy();
    expect(
      screen.getByText("This removes the project for everyone."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("confirms and closes by default", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...base}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open when closeOnConfirm is false", () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...base}
        closeOnConfirm={false}
        onOpenChange={onOpenChange}
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("cancel closes without confirming", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...base}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("locks both actions and shows the loading label while loading", () => {
    render(
      <ConfirmDialog
        {...base}
        loading
        loadingLabel="Deleting"
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />,
    );
    const confirm = screen.getByRole("button", { name: "Deleting" });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Cancel" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
