import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setColorMode } from "@/lib/appearance";
import { formatToastDescription, Toaster, toast } from ".";

const toasterElement = () =>
  document.querySelector<HTMLElement>("[data-sonner-toaster]");

afterEach(() => {
  act(() => {
    toast.dismiss();
    setColorMode("system");
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

  it("follows the appearance mode unless a theme is given", async () => {
    act(() => {
      setColorMode("dark");
    });
    const { unmount } = render(<Toaster />);
    act(() => {
      toast("Saved");
    });
    await waitFor(() =>
      expect(toasterElement()?.dataset.sonnerTheme).toBe("dark"),
    );
    unmount();
    render(<Toaster theme="light" />);
    act(() => {
      toast("Saved");
    });
    await waitFor(() =>
      expect(toasterElement()?.dataset.sonnerTheme).toBe("light"),
    );
  });

  it("keeps Capy's 382px toast width from the spacing token", async () => {
    render(<Toaster />);
    act(() => {
      toast("Saved");
    });
    await waitFor(() =>
      expect(toasterElement()?.style.getPropertyValue("--width")).toBe(
        "calc(var(--spacing) * 95.5)",
      ),
    );
  });
});

describe("Toast layout", () => {
  it("puts a lone action in the title row", async () => {
    render(<Toaster />);
    act(() => {
      toast("Branch pushed", { action: { label: "Open", onClick: vi.fn() } });
    });
    const action = await screen.findByText("Open");
    expect(action.closest(".flex-wrap")).not.toBeNull();
  });

  it("gives an action a row of its own when there is a description", async () => {
    render(<Toaster />);
    act(() => {
      toast("Branch pushed", {
        description: "Upstream moved",
        action: { label: "Open", onClick: vi.fn() },
        cancel: { label: "Dismiss" },
      });
    });
    const action = await screen.findByText("Open");
    const cancel = screen.getByText("Dismiss");
    expect(action.closest(".flex-wrap")).toBeNull();
    expect(action.parentElement).toBe(cancel.parentElement);
  });

  it("runs the cancel handler and dismisses unless prevented", async () => {
    const onClick = vi.fn((event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    });
    render(<Toaster />);
    act(() => {
      toast("Branch pushed", {
        description: "Upstream moved",
        cancel: { label: "Dismiss", onClick },
      });
    });
    fireEvent.click(await screen.findByText("Dismiss"));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Branch pushed")).not.toBeNull();
  });
});

describe("formatToastDescription", () => {
  it("keeps plain text and nodes as they are", () => {
    expect(formatToastDescription("")).toBe("");
    const node = <b>x</b>;
    expect(formatToastDescription(node)).toBe(node);
  });
});
