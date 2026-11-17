import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatToastDescription, Toaster, toast } from ".";

afterEach(() => {
  act(() => {
    toast.dismiss();
  });
  cleanup();
});

describe("Toaster", () => {
  it("renders Capy's toast card with title, description and icon", async () => {
    render(<Toaster />);
    act(() => {
      toast.success("Saved", { description: "Synced **3** files" });
    });
    const title = await screen.findByText("Saved");
    expect(title.className).toContain("font-medium");
    expect(screen.getByText("3").className).toContain("font-semibold");
    const card = title.closest(".bg-popover");
    expect(card?.querySelector("[data-icon=circle-check]")).not.toBeNull();
    expect(screen.getByLabelText("Dismiss notification")).toBeTruthy();
  });

  it("runs the action and dismisses unless prevented", async () => {
    const onClick = vi.fn();
    render(<Toaster />);
    act(() => {
      toast("Branch pushed", { action: { label: "Open", onClick } });
    });
    fireEvent.click(await screen.findByText("Open"));
    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Branch pushed")).toBeNull());
  });

  it("shimmers the loading title", async () => {
    render(<Toaster />);
    act(() => {
      toast.loading("Uploading");
    });
    expect((await screen.findByText("Uploading")).dataset.slot).toBe(
      "shimmer-text",
    );
  });
});

describe("formatToastDescription", () => {
  it("keeps plain text and nodes as they are", () => {
    expect(formatToastDescription("")).toBe("");
    const node = <b>x</b>;
    expect(formatToastDescription(node)).toBe(node);
  });
});
