import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewFileDialog } from "./new-file-dialog";

afterEach(cleanup);

const setup = (onCreate = vi.fn(async () => true)) => {
  const onOpenChange = vi.fn();
  render(
    <NewFileDialog
      open
      onOpenChange={onOpenChange}
      directory="docs"
      existing={new Set(["docs/a.md"])}
      onCreate={onCreate}
    />,
  );
  return { onCreate, onOpenChange };
};

describe("NewFileDialog", () => {
  it("describes the target directory", () => {
    setup();
    expect(screen.getByText("New file")).toBeTruthy();
    expect(screen.getByText("In docs/")).toBeTruthy();
  });

  it("warns on collisions and keeps Create file disabled", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("notes/release-plan.md"), {
      target: { value: "a.md" },
    });
    expect(
      screen.getByText("This path collides with an existing file or folder"),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Create file" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("creates the joined path and closes", async () => {
    const { onCreate, onOpenChange } = setup();
    fireEvent.change(screen.getByPlaceholderText("notes/release-plan.md"), {
      target: { value: "plan.md" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create file" }));
    });
    expect(onCreate).toHaveBeenCalledWith("docs/plan.md");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
