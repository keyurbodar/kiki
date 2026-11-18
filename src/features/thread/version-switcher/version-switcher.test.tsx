import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventId, MessageVersion } from "@/data/events";
import { VersionSwitcherControls } from "./version-switcher";

afterEach(cleanup);

const id = (suffix: string) => EventId.make(`01JA${"0".repeat(16)}${suffix}`);

const version = (suffix: string, text: string, live: boolean) =>
  new MessageVersion({
    id: id(suffix),
    text,
    createdAt: new Date(2026, 10, 17, 9, 0),
    live,
  });

const root = id("00000A");
const versions = [
  version("00000A", "the live text", true),
  version("00000B", "an earlier text", false),
];

describe("VersionSwitcherControls", () => {
  it("reads its position from the version on screen", () => {
    render(
      <VersionSwitcherControls
        versions={versions}
        eventId={root}
        root={root}
      />,
    );
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("renders nothing for a message with one version", () => {
    const { container } = render(
      <VersionSwitcherControls
        versions={[versions[0] as MessageVersion]}
        eventId={root}
        root={root}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("falls back to the live version when the row is not one of them", () => {
    render(
      <VersionSwitcherControls
        versions={versions}
        eventId={id("00000C")}
        root={root}
      />,
    );
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("hands the picked version and its root to the thread", () => {
    const onView = vi.fn();
    render(
      <VersionSwitcherControls
        versions={versions}
        eventId={root}
        root={root}
        onView={onView}
      />,
    );
    fireEvent.click(screen.getByLabelText("Next version"));
    expect(onView).toHaveBeenCalledWith(versions[1], root);
  });

  it("disables the step that runs off either end of the list", () => {
    const { rerender } = render(
      <VersionSwitcherControls
        versions={versions}
        eventId={root}
        root={root}
        onView={() => {}}
      />,
    );
    expect(screen.getByLabelText("Previous version")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByLabelText("Next version")).toHaveProperty(
      "disabled",
      false,
    );
    rerender(
      <VersionSwitcherControls
        versions={versions}
        eventId={id("00000B")}
        root={root}
        onView={() => {}}
      />,
    );
    expect(screen.getByText("2/2")).toBeTruthy();
    expect(screen.getByLabelText("Previous version")).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByLabelText("Next version")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("disables both steps when the thread cannot show a version", () => {
    render(
      <VersionSwitcherControls
        versions={versions}
        eventId={root}
        root={root}
      />,
    );
    expect(screen.getByLabelText("Previous version")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByLabelText("Next version")).toHaveProperty(
      "disabled",
      true,
    );
  });
});
