import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  boxFrom,
  captionFor,
  commentMeta,
  describeMark,
  formatClock,
  frameExcerpt,
  frameGroups,
  frameLabel,
  groupFrames,
  MEDIA_COMMENTS_KEY,
  type MediaCommentDraft,
  mediaCommentStore,
  mentionLabel,
  noteLines,
  numberIn,
  percentOf,
  sameFrame,
  scaleMark,
} from "./media-comments";

const draft = (
  overrides: Partial<MediaCommentDraft> = {},
): MediaCommentDraft => ({
  id: "d1",
  fileId: "f1",
  file: "shot.png",
  kind: "image",
  width: 800,
  height: 600,
  mark: { kind: "pin", x: 5, y: 6 },
  note: "note",
  thumb: "",
  ...overrides,
});

beforeEach(() => {
  mediaCommentStore.reset();
  localStorage.clear();
});

describe("geometry and formatting", () => {
  it("formats percentages and clocks", () => {
    expect(percentOf(1, 4)).toBe("25%");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65000)).toBe("1:05");
    expect(formatClock(-1000)).toBe("0:00");
  });

  it("normalises a reversed drag into a positive box", () => {
    expect(boxFrom({ x: 90, y: 80 }, { x: 10, y: 20 })).toEqual({
      kind: "box",
      x: 10,
      y: 20,
      w: 80,
      h: 60,
    });
  });

  it("describes each mark kind", () => {
    expect(describeMark({ kind: "box", x: 10, y: 20, w: 30, h: 40 })).toBe(
      "box at 10,20, 30×40",
    );
    expect(describeMark({ kind: "arrow", x1: 1, y1: 2, x2: 3, y2: 4 })).toBe(
      "arrow from 1,2 to 3,4",
    );
    expect(describeMark({ kind: "pin", x: 5, y: 6 })).toBe("pin at 5,6");
  });

  it("scales every coordinate of a mark", () => {
    expect(scaleMark({ kind: "box", x: 10, y: 20, w: 30, h: 40 }, 2)).toEqual({
      kind: "box",
      x: 20,
      y: 40,
      w: 60,
      h: 80,
    });
    expect(
      scaleMark({ kind: "arrow", x1: 1, y1: 2, x2: 3, y2: 4 }, 0.5),
    ).toEqual({ kind: "arrow", x1: 0.5, y1: 1, x2: 1.5, y2: 2 });
    expect(scaleMark({ kind: "pin", x: 5, y: 6 }, 3)).toEqual({
      kind: "pin",
      x: 15,
      y: 18,
    });
  });
});

describe("frame grouping and labels", () => {
  it("compares frames with a 0.05 second tolerance", () => {
    expect(
      sameFrame({ fileId: "f1", time: 1 }, { fileId: "f1", time: 1.04 }),
    ).toBe(true);
    expect(
      sameFrame({ fileId: "f1", time: 1 }, { fileId: "f1", time: 1.06 }),
    ).toBe(false);
    expect(
      sameFrame({ fileId: "f1", time: 1 }, { fileId: "f2", time: 1 }),
    ).toBe(false);
    expect(sameFrame({ fileId: "f1" }, { fileId: "f1" })).toBe(true);
    expect(sameFrame({ fileId: "f1", time: 1 }, { fileId: "f1" })).toBe(false);
  });

  it("groups unit items by frame and numbers within each group", () => {
    const a = draft({ id: "a", unit: 1, time: 1 });
    const b = draft({ id: "b", unit: 1, time: 1.02 });
    const c = draft({ id: "c", unit: 1, time: 3, fileId: "f2" });
    const loose = draft({ id: "l", number: 7 });
    expect(groupFrames([a, b, c])).toEqual([[a, b], [c]]);
    const groups = frameGroups([loose, a, b, c]);
    expect(groups).toEqual([[a, b], [c], [loose]]);
    expect(
      groups.map((group) => group.map((item) => numberIn(groups, item))),
    ).toEqual([[1, 2], [1], [7]]);
    expect(numberIn(groups, draft({ id: "x" }))).toBe(1);
  });

  it("builds labels and metadata", () => {
    expect(frameLabel({ file: "shot.png", time: 65 })).toBe("1:05 · shot.png");
    expect(frameLabel({ file: "shot.png" })).toBe("shot.png");
    expect(mentionLabel("x", 1)).toBe("x");
    expect(mentionLabel("x", 3)).toBe("x · 3 comments");
    expect(commentMeta({ file: "shot.png", time: 65 }, 1)).toBe("1:05");
    expect(commentMeta({ file: "shot.png" }, 2)).toBe("shot.png");
    expect(commentMeta({ file: "shot.png", time: 65 }, 2)).toBe(
      "shot.png at 1:05",
    );
    expect(captionFor({ file: "shot.png" })).toBe("shot.png");
    expect(captionFor({ file: "shot.png" }, 65)).toBe("shot.png at 1:05");
  });
});

describe("excerpts", () => {
  it("renders an exact media comment excerpt with all metadata", () => {
    const item = draft({
      time: 65,
      mark: { kind: "box", x: 10, y: 20, w: 30, h: 40 },
      attachment: { mediaType: "image/png", preview: true },
    });
    expect(
      frameExcerpt(item, [{ number: 2, mark: item.mark }], "selection-1.png"),
    ).toBe(
      '<excerpt source="shot.png" lang="media_comment">\n' +
        "time: 1:05\n" +
        "seconds: 65.000\n" +
        "size: 800×600 image\n" +
        "mark 2: box at 10,20, 30×40\n" +
        "frame: selection-1.png\n" +
        "file id: f1\n" +
        "media type: image/png\n" +
        "normalized preview: yes\n" +
        "</excerpt>",
    );
  });

  it("omits optional lines and escapes attribute values", () => {
    const item = draft({ file: 'a&b".png', kind: "video", time: undefined });
    expect(frameExcerpt(item, [], "frame.png")).toBe(
      '<excerpt source="a&amp;b&quot;.png" lang="media_comment">\n' +
        "size: 800×600 frame\n" +
        "frame: frame.png\n" +
        "</excerpt>",
    );
  });

  it("indents continuation lines in numbered notes", () => {
    expect(
      noteLines([
        { number: 1, note: "first\nsecond" },
        { number: 2, note: "third" },
      ]),
    ).toBe("\n\n1. first\n   second\n2. third");
  });
});

describe("mediaCommentStore", () => {
  it("updates, notifies and persists queues", () => {
    const listener = vi.fn();
    const unsubscribe = mediaCommentStore.subscribe(listener);
    const item = draft({ id: "a" });
    mediaCommentStore.update("q1", () => [item]);
    expect(mediaCommentStore.get()).toMatchObject({
      q1: { items: [item] },
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(localStorage.getItem(MEDIA_COMMENTS_KEY) ?? "null"),
    ).toMatchObject({ q1: { items: [item] } });

    const edited = { ...item, note: "changed" };
    mediaCommentStore.update("q1", (items) => items.map(() => edited));
    expect(mediaCommentStore.get().q1?.items[0]?.note).toBe("changed");

    mediaCommentStore.update("q1", () => []);
    expect(mediaCommentStore.get().q1).toBeUndefined();
    expect(
      JSON.parse(localStorage.getItem(MEDIA_COMMENTS_KEY) ?? "null"),
    ).toEqual({});
    unsubscribe();
    mediaCommentStore.update("q1", () => [item]);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("reads the persisted queues after a reset", () => {
    localStorage.setItem(
      MEDIA_COMMENTS_KEY,
      JSON.stringify({ q2: { items: [draft({ id: "b" })], updatedAt: 1 } }),
    );
    mediaCommentStore.reset();
    expect(mediaCommentStore.get().q2?.items[0]?.id).toBe("b");
  });
});
