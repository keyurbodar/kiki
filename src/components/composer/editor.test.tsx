import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Composer } from "./composer";
import {
  type ComposerFieldHeight,
  EDITOR_FIELD_HEIGHT_CLASS,
  editorFieldClass,
} from "./editor";
import { ToolbarAction } from "./toolbar-action";
import { VoiceControl } from "./voice-control";

afterEach(cleanup);

const field = async (fieldHeight?: ComposerFieldHeight) => {
  const { container } = render(
    <Composer onSubmit={() => true} fieldHeight={fieldHeight} />,
  );
  await waitFor(() =>
    expect(container.querySelector("[contenteditable]")).not.toBeNull(),
  );
  return container.querySelector("[contenteditable]") as HTMLElement;
};

describe("composer field height", () => {
  it("maps the two densities onto the spacing scale", () => {
    expect(EDITOR_FIELD_HEIGHT_CLASS).toEqual({
      single: "min-h-6",
      multi: "min-h-16",
    });
  });

  it("keeps the caller's editor classes alongside the density", () => {
    const className = editorFieldClass("multi", "min-h-12");
    expect(className).toContain("min-h-16");
    expect(className).toContain("min-h-12");
    expect(className).toContain("whitespace-pre-wrap");
  });

  it("defaults the field to a single line", async () => {
    const className = (await field()).className;
    expect(className).toContain("min-h-6");
    expect(className).not.toContain("min-h-16");
  });

  it("gives the multi field the taller height", async () => {
    const className = (await field("multi")).className;
    expect(className).toContain("min-h-16");
    expect(className).not.toContain("min-h-6");
  });
});

describe("composer control hitboxes", () => {
  it("keeps toolbar and voice controls square at the control height", () => {
    const { container } = render(
      <>
        <ToolbarAction label="Bold">
          <span />
        </ToolbarAction>
        <VoiceControl empty={false} ready={false} />
      </>,
    );
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.className).toContain("size-(--h-control-sm)");
      expect(button.className).not.toContain("w-(");
    }
  });
});
