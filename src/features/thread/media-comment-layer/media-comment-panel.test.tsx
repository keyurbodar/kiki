import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MediaCommentPanel,
  type MediaCommentSessionOptions,
  useMediaCommentSession,
} from "./media-comment-layer";
import {
  type MediaCommentDraft,
  type MediaCommentTarget,
  mediaCommentStore,
} from "./media-comments";

const targets: MediaCommentTarget[] = [
  { fileId: "f1", file: "shot.png", kind: "image" },
];

const draft = (
  id: string,
  note: string,
  number: number,
): MediaCommentDraft => ({
  id,
  fileId: "f1",
  file: "shot.png",
  kind: "image",
  width: 800,
  height: 600,
  mark: { kind: "pin", x: 5, y: 6 },
  note,
  thumb: "",
  number,
});

function PanelHarness({
  options,
}: {
  options: Omit<MediaCommentSessionOptions, "targets" | "index">;
}) {
  const session = useMediaCommentSession({ ...options, targets, index: 0 });
  return <MediaCommentPanel session={session} />;
}

beforeEach(() => {
  mediaCommentStore.reset();
  localStorage.clear();
  mediaCommentStore.update("q1", () => [
    draft("a", "first note", 1),
    draft("b", "second note", 2),
  ]);
});

afterEach(cleanup);

describe("MediaCommentPanel", () => {
  it("renders a row for each queued draft", () => {
    render(
      <PanelHarness options={{ queueKey: "q1", onIndexChange: () => {} }} />,
    );
    expect(screen.getByRole("region", { name: "Comments" })).toBeTruthy();
    expect(screen.getByText("first note")).toBeTruthy();
    expect(screen.getByText("second note")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit comment 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit comment 2" })).toBeTruthy();
  });

  it("shows the marking hint when there are no drafts", () => {
    mediaCommentStore.update("q1", () => []);
    render(
      <PanelHarness options={{ queueKey: "q1", onIndexChange: () => {} }} />,
    );
    expect(screen.getByText("Click to pin, drag to box")).toBeTruthy();
  });

  it("removes a draft from the store", () => {
    render(
      <PanelHarness options={{ queueKey: "q1", onIndexChange: () => {} }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove comment 1" }));
    expect(mediaCommentStore.get().q1?.items.map((item) => item.id)).toEqual([
      "b",
    ]);
  });
});
