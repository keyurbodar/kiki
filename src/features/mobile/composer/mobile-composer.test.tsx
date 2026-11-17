import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  composerMenuFor,
  filterCommands,
  filterMentions,
  MobileComposer,
  type MobileComposerProps,
} from "./index";

afterEach(cleanup);

function Harness(props: Partial<MobileComposerProps>) {
  const [value, setValue] = useState("");
  return (
    <MobileComposer
      value={value}
      onValueChange={setValue}
      onSend={() => {}}
      {...props}
    />
  );
}

const type = (text: string) =>
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: text },
  });

describe("composerMenuFor", () => {
  it("opens commands on a leading slash word", () => {
    expect(composerMenuFor("/")).toEqual({ kind: "command", query: "" });
    expect(composerMenuFor("/fo")).toEqual({ kind: "command", query: "fo" });
    expect(composerMenuFor("/fork now").kind).toBe("none");
    expect(composerMenuFor("a /x").kind).toBe("none");
  });

  it("opens mentions on a trailing @ word", () => {
    expect(composerMenuFor("@")).toEqual({
      kind: "mention",
      query: "",
      start: 0,
    });
    expect(composerMenuFor("ask @Pe")).toEqual({
      kind: "mention",
      query: "Pe",
      start: 4,
    });
    expect(composerMenuFor("mail@x").kind).toBe("none");
  });

  it("filters commands and mentions by label", () => {
    expect(filterCommands("fork").map((c) => c.id)).toEqual([
      "fork",
      "fork-summary",
    ]);
    expect(filterMentions("pull").map((c) => c.id)).toEqual(["pulls"]);
  });
});

describe("MobileComposer", () => {
  it("shows voice alone when empty, and send once there is text", () => {
    const onSend = vi.fn();
    render(<Harness onSend={onSend} />);
    expect(screen.getByLabelText("Voice input")).toBeTruthy();
    expect(screen.queryByLabelText("Send")).toBeNull();
    type("hello ");
    fireEvent.click(screen.getByLabelText("Send"));
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(
      (screen.getByLabelText("Message") as HTMLTextAreaElement).value,
    ).toBe("");
  });

  it("shows stop while the agent works", () => {
    const onStop = vi.fn();
    render(<Harness working onStop={onStop} />);
    fireEvent.click(screen.getByLabelText("Stop run"));
    expect(onStop).toHaveBeenCalled();
  });

  it("lists slash commands and runs the highlighted one on Enter", () => {
    const onCommand = vi.fn();
    render(<Harness onCommand={onCommand} />);
    type("/");
    const menu = screen.getByRole("listbox", { name: "Commands" });
    expect(menu.closest("[data-slot=composer-command-menu]")).toBeTruthy();
    expect(screen.getAllByRole("option")[0]?.textContent).toContain(
      "Plan mode",
    );
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Enter" });
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: "model" }),
    );
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("lists mention categories and closes on Escape", () => {
    const onMention = vi.fn();
    render(<Harness onMention={onMention} />);
    type("see @");
    expect(
      screen
        .getByRole("listbox", { name: "Mentions" })
        .closest("[data-slot=composer-mention-menu]"),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Captains"));
    expect(onMention).toHaveBeenCalledWith(
      expect.objectContaining({ id: "captains" }),
    );
    expect(
      (screen.getByLabelText("Message") as HTMLTextAreaElement).value,
    ).toBe("see ");
    type("see @");
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
