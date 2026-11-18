import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Composer } from "./composer";

afterEach(cleanup);

const file = new File(["#"], "capy-shot.png", { type: "image/png" });

/*
 * happy-dom builds a DataTransfer with the file's own type instead of `Files`
 * and drops `dataTransfer` from a DragEvent's init, so the drag carries the
 * fields the handlers read instead of a real transfer.
 */
const drag = (type: string, target: EventTarget, files: File[] = [file]) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: { types: ["Files"], files, dropEffect: "none" },
  });
  Object.defineProperty(event, "relatedTarget", { value: null });
  target.dispatchEvent(event);
  return event;
};

const overlay = () =>
  document.querySelector<HTMLElement>(
    "div.fixed.inset-0.z-\\(--z-overlay-content\\)",
  );

const mount = async (onFilesAdded = vi.fn()) => {
  const { container } = render(
    <Composer
      onSubmit={() => true}
      onFilesAdded={onFilesAdded}
      attachments={<span>strip</span>}
    />,
  );
  const root = container.querySelector("[data-slot='composer']") as HTMLElement;
  await waitFor(() =>
    expect(container.querySelector("[contenteditable]")).not.toBeNull(),
  );
  return { root, onFilesAdded };
};

describe("composer file drag", () => {
  it("shows the page-wide target with Capy's copy while files are dragged", async () => {
    const { root } = await mount();
    expect(overlay()).toBeNull();

    drag("dragenter", root);

    await waitFor(() => expect(overlay()).not.toBeNull());
    const card = overlay()?.firstElementChild as HTMLElement;
    expect(overlay()?.className).toContain("z-(--z-overlay-content)");
    expect(card.className).toContain("border-dashed");
    expect(card.textContent).toContain("Drop files to attach");
    expect(card.textContent).toContain("Up to 250 MB per file");
  });

  it("takes the dragged files once and puts the target away", async () => {
    const { root, onFilesAdded } = await mount();
    drag("dragenter", root);
    await waitFor(() => expect(overlay()).not.toBeNull());

    drag("drop", root);

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded.mock.calls[0]?.[0]).toEqual([file]);
    await waitFor(() => expect(overlay()).toBeNull());
  });

  it("puts the target away when the drag ends without a drop", async () => {
    const { root } = await mount();
    drag("dragenter", root);
    await waitFor(() => expect(overlay()).not.toBeNull());

    window.dispatchEvent(new Event("pointermove"));

    await waitFor(() => expect(overlay()).toBeNull());
  });

  it("gives the drop to the composer under the pointer", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(
      <Composer
        onSubmit={() => true}
        onFilesAdded={first}
        attachments={<span>strip</span>}
      />,
    );
    const other = render(
      <Composer
        onSubmit={() => true}
        onFilesAdded={second}
        attachments={<span>strip</span>}
      />,
    );
    const target = other.container.querySelector(
      "[data-slot='composer']",
    ) as HTMLElement;
    await waitFor(() =>
      expect(view.container.querySelector("[contenteditable]")).not.toBeNull(),
    );

    drag("drop", target);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stays quiet without an attachments slot to fill", async () => {
    const onFilesAdded = vi.fn();
    render(<Composer onSubmit={() => true} onFilesAdded={onFilesAdded} />);
    drag("dragenter", document.body);
    expect(overlay()).toBeNull();
  });
});
