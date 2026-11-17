import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarEditor, type AvatarEditorProps } from "./avatar-editor";

afterEach(cleanup);

const renderEditor = (props: Partial<AvatarEditorProps> = {}) => {
  const handlers = { onImage: vi.fn(), onRemove: vi.fn() };
  const view = render(
    <AvatarEditor
      src={null}
      name="Northwind Labs"
      label="Change organization image"
      title="Adjust organization image"
      {...handlers}
      {...props}
    />,
  );
  const input = view.container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  return { ...handlers, ...view, input };
};

const classes = (element: Element) => Array.from(element.classList);

const editButton = () =>
  screen.getByRole("button", { name: "Change organization image" });

const chooseFile = (input: HTMLInputElement, file: File) =>
  fireEvent.change(input, { target: { files: [file] } });

const controls = (container: HTMLElement) =>
  container.querySelector('[data-slot="avatar"]')?.parentElement as Element;

describe("AvatarEditor", () => {
  it("draws the base avatar with its initials and a 28px edit button", () => {
    const { container } = renderEditor();
    const avatar = screen.getByRole("img", { name: "Northwind Labs" });
    expect(avatar.textContent).toBe("NL");
    expect(classes(avatar)).toContain("size-8");
    expect(container.querySelector('[data-slot="avatar"] img')).toBeNull();

    expect(classes(controls(container))).toEqual(["contents"]);

    const edit = editButton();
    expect(classes(edit)).toContain("size-(--h-control-sm)");
    const icon = edit.querySelector('[data-slot="button-icon"]');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector("svg")?.getAttribute("data-icon")).toBe(
      "edit-small-1",
    );
  });

  it("shows the image instead of the initials and keeps the name", () => {
    const { container } = renderEditor({ src: "https://cdn.test/org.png" });
    expect(
      container.querySelector('[data-slot="avatar"] img')?.getAttribute("alt"),
    ).toBe("Northwind Labs");
    expect(
      classes(container.querySelector('[data-slot="avatar"]') as Element),
    ).toContain("size-8");
  });

  it("grows the avatar and moves the edit button onto its corner at lg", () => {
    const { container } = renderEditor({ size: "lg" });
    const avatar = screen.getByRole("img", { name: "Northwind Labs" });
    expect(classes(avatar)).toContain("size-16");
    expect(classes(avatar)).toContain("rounded-md");
    expect(classes(controls(container))).toContain("relative");
    expect(classes(editButton())).toContain("absolute");
    expect(classes(editButton())).toContain("-right-2");
  });

  it("has no remove control when there is no image", () => {
    renderEditor();
    expect(screen.queryByRole("button", { name: "Remove image" })).toBeNull();
  });

  it("removes the image through its own control", () => {
    const { onRemove } = renderEditor({ src: "https://cdn.test/org.png" });
    const remove = screen.getByRole("button", { name: "Remove image" });
    expect(remove.querySelector('[data-slot="button-icon"]')).toBeTruthy();
    fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("hands a GIF straight to onImage", () => {
    const { input, onImage } = renderEditor();
    const gif = new File(["gif"], "logo.gif", { type: "image/gif" });
    chooseFile(input, gif);
    expect(onImage).toHaveBeenCalledWith(gif);
  });

  it("crops other pictures before handing them to onImage", () => {
    const { input, onImage } = renderEditor();
    chooseFile(input, new File(["png"], "logo.png", { type: "image/png" }));
    expect(onImage).not.toHaveBeenCalled();
    expect(screen.getByText("Adjust organization image")).toBeTruthy();
  });

  it("refuses a file that is not a picture", () => {
    const { input, onImage } = renderEditor();
    chooseFile(input, new File(["csv"], "rows.csv", { type: "text/csv" }));
    expect(onImage).not.toHaveBeenCalled();
    expect(screen.queryByText("Adjust organization image")).toBeNull();
  });

  it("shows the upload state on the edit button while busy", () => {
    renderEditor({ src: "https://cdn.test/org.png", busy: true });
    const edit = editButton();
    expect(edit.getAttribute("aria-busy")).toBe("true");
    expect((edit as HTMLButtonElement).disabled).toBe(true);
    expect(edit.textContent).toContain("Uploading");
    expect(
      (
        screen.getByRole("button", {
          name: "Remove image",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("locks both controls when disabled", () => {
    renderEditor({ src: "https://cdn.test/org.png", disabled: true });
    expect((editButton() as HTMLButtonElement).disabled).toBe(true);
    expect(editButton().getAttribute("aria-busy")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Remove image",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
