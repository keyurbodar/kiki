import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComposerHandle } from "@/components/composer";
import { resolveCommandRows } from "@/components/composer/command-rows";
import { resolveMentionState } from "@/components/composer/mention-rows";
import {
  composerCommands,
  MobileComposer,
  mentionCategories,
  mentionSources,
} from "./index";

afterEach(cleanup);

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

const commandRows = (
  term: string,
  onRun: (command: unknown) => void = () => {},
) =>
  resolveCommandRows({
    commands: composerCommands((command) => onRun(command)),
    picker: undefined,
    skills: mentionSources().find((source) => source.kind === "skill"),
    skillsMode: false,
    skillItems: [],
    term,
  }).rows;

const commandNames = (term: string) =>
  commandRows(term).flatMap((row) =>
    row.type === "command" ? [row.command.name] : [],
  );

const mentionState = (term: string) => {
  const state = resolveMentionState(mentionSources(), null, term);
  if (state instanceof Promise)
    throw new Error("mention sources resolve synchronously");
  return state;
};

const mentionLabels = (term: string) =>
  mentionState(term).rows.flatMap((row) =>
    row.type === "category" ? [row.source.label] : [],
  );

async function open() {
  const ref = createRef<ComposerHandle>();
  render(<MobileComposer ref={ref} onSend={() => {}} onCommand={() => {}} />);
  const editor = await screen.findByLabelText("Message");
  const type = async (text: string) => {
    act(() => ref.current?.typeCharacter(text));
    await settle();
  };
  return { ref, editor, type };
}

describe("phone composer commands", () => {
  it("lists every command after /, with skills last", () => {
    expect(commandNames("")).toEqual([
      "plan",
      "model",
      "reasoning",
      "fast",
      "new",
      "subscriber",
      "compact",
      "side",
      "fork",
      "fork-summary",
    ]);
    expect(commandRows("").at(-1)).toEqual({
      type: "skills",
      source: expect.objectContaining({ label: "Skills" }),
    });
  });

  it("filters on the typed word", () => {
    expect(commandNames("fork")).toEqual(["fork", "fork-summary"]);
    expect(commandNames("new")).toEqual(["new", "side"]);
  });

  it("opens the command menu on /", async () => {
    const { type } = await open();
    await type("/");
    const menu = document.querySelector('[data-slot="composer-command-menu"]');
    expect(menu?.textContent).toContain("Plan mode");
    expect(menu?.textContent).toContain("/fork-summary");
    expect(menu?.textContent).toContain("Skills");
  });
});

describe("phone composer mentions", () => {
  it("lists every @ category with its description", () => {
    expect(mentionLabels("")).toEqual(
      mentionCategories.map((category) => category.label),
    );
    expect(mentionState("").rows[1]).toEqual({
      type: "category",
      source: expect.objectContaining({
        category: "captains",
        description: "Hand work to a Captain and its crew",
      }),
    });
  });

  it("narrows to the category that matches the typed word", () => {
    expect(mentionLabels("pull")).toEqual(["Pull requests"]);
  });

  it("opens the mention menu on @ and closes it on Escape", async () => {
    const { editor, type } = await open();
    await type("see @");
    const menu = document.querySelector('[data-slot="composer-mention-menu"]');
    expect(menu?.textContent).toContain("Captains");
    expect(menu?.textContent).toContain("Hand work to a Captain and its crew");
    fireEvent.keyDown(editor, { key: "Escape" });
    expect(
      document.querySelector('[data-slot="composer-mention-menu"]'),
    ).toBeNull();
  });
});

describe("MobileComposer", () => {
  it("renders the shared composer with the phone's triggers", async () => {
    render(
      <MobileComposer
        onSend={() => {}}
        addMenu={<button type="button">Add</button>}
        modelMenu={<button type="button">Model</button>}
      />,
    );
    expect(document.querySelector('[data-slot="composer"]')).toBeTruthy();
    expect(await screen.findByLabelText("Message")).toBeTruthy();
    expect(screen.getByLabelText("Voice input")).toBeTruthy();
    expect(screen.queryByLabelText("Send")).toBeNull();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Model" })).toBeTruthy();
  });

  it("runs the highlighted command on Enter", async () => {
    const onCommand = vi.fn();
    const ref = createRef<ComposerHandle>();
    render(
      <MobileComposer ref={ref} onSend={() => {}} onCommand={onCommand} />,
    );
    const editor = await screen.findByLabelText("Message");
    act(() => ref.current?.typeCharacter("/"));
    await settle();
    fireEvent.keyDown(editor, { key: "ArrowDown" });
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: "model" }),
    );
    expect(
      document.querySelector('[data-slot="composer-command-menu"]'),
    ).toBeNull();
  });

  it("sends the trimmed draft and clears it", async () => {
    const onSend = vi.fn();
    const ref = createRef<ComposerHandle>();
    render(<MobileComposer ref={ref} onSend={onSend} />);
    await screen.findByLabelText("Message");
    act(() => ref.current?.typeCharacter("hello "));
    fireEvent.click(await screen.findByLabelText("Send"));
    expect(onSend).toHaveBeenCalledWith("hello");
    expect(ref.current?.getPayload().text).toBe("");
  });

  it("stops the run while the agent works", async () => {
    const onStop = vi.fn();
    render(<MobileComposer onSend={() => {}} working onStop={onStop} />);
    fireEvent.click(await screen.findByLabelText("Stop run"));
    expect(onStop).toHaveBeenCalled();
  });
});
