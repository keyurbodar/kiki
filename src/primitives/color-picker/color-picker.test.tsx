import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HEX_COLOR,
  hexChannels,
  isChannel,
  replaceChannel,
  toHex,
  withChannel,
} from "./color";
import { ColorPicker } from "./color-picker";

afterEach(cleanup);

describe("color helpers", () => {
  it("accepts six-digit hex colours only", () => {
    expect(HEX_COLOR.test("#3a7bd5")).toBe(true);
    expect(HEX_COLOR.test("#3A7BD5")).toBe(true);
    expect(HEX_COLOR.test("#3a7")).toBe(false);
    expect(HEX_COLOR.test("3a7bd5")).toBe(false);
  });

  it("converts between hex and channels", () => {
    expect(toHex(0, 0, 0)).toBe("#000000");
    expect(toHex(58, 123, 213)).toBe("#3a7bd5");
    expect(hexChannels("#3a7bd5")).toEqual(["58", "123", "213"]);
  });

  it("validates channel text", () => {
    expect(isChannel("0")).toBe(true);
    expect(isChannel("255")).toBe(true);
    expect(isChannel("256")).toBe(false);
    expect(isChannel("")).toBe(false);
    expect(isChannel("1a")).toBe(false);
    expect(isChannel("0255")).toBe(false);
  });

  it("swaps one channel", () => {
    expect(withChannel("#3a7bd5", 0, "255")).toBe("#ff7bd5");
    expect(withChannel("#3a7bd5", 2, "0")).toBe("#3a7b00");
    expect(replaceChannel(["1", "2", "3"], 1, "9")).toEqual(["1", "9", "3"]);
  });
});

describe("ColorPicker", () => {
  const open = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Pick accent color" }));
    return screen.findByRole("textbox", { name: "Accent hex color" });
  };

  it("labels the swatch trigger and the popup", async () => {
    render(
      <ColorPicker label="Accent" value="#3a7bd5" onValueChange={vi.fn()} />,
    );
    const trigger = screen.getByRole("button", { name: "Pick accent color" });
    const swatch = trigger.querySelector(".color-picker__swatch");
    expect(swatch).not.toBeNull();
    const input = await open();
    expect((input as HTMLInputElement).value).toBe("#3a7bd5");
    expect(screen.getByText("Accent").id).not.toBe("");
    expect(document.querySelector("[data-slot=color-picker]")).not.toBeNull();
  });

  it("commits valid hex text and flags invalid text", async () => {
    const onValueChange = vi.fn();
    render(
      <ColorPicker
        label="Accent"
        value="#3a7bd5"
        onValueChange={onValueChange}
      />,
    );
    const input = await open();
    fireEvent.change(input, { target: { value: "#12" } });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "#123456" } });
    expect(onValueChange).toHaveBeenCalledWith("#123456");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("offers theme colours as swatches", async () => {
    const onValueChange = vi.fn();
    render(
      <ColorPicker
        label="Accent"
        value="#3a7bd5"
        onValueChange={onValueChange}
        colors={[{ label: "Sky", value: "#5fa8e8" }]}
      />,
    );
    await open();
    expect(screen.getByRole("group", { name: "Theme colors" })).toBeTruthy();
    const swatch = screen.getByRole("button", { name: "Use sky color" });
    expect(swatch.title).toBe("Sky · #5fa8e8");
    fireEvent.click(swatch);
    expect(onValueChange).toHaveBeenCalledWith("#5fa8e8");
  });

  it("closes from the header button", async () => {
    render(
      <ColorPicker label="Accent" value="#3a7bd5" onValueChange={vi.fn()} />,
    );
    await open();
    fireEvent.click(screen.getByRole("button", { name: "Close color picker" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "Accent hex color" }),
      ).toBeNull(),
    );
  });
});
