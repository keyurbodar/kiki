import { describe, expect, it } from "vitest";
import {
  linkedThreadIds,
  newestOwnThread,
  type PanelPull,
  pullChatDraft,
  pullChatSubtitle,
  pullThreadTitle,
  selectionFromSearch,
  triggerSelection,
} from "./selection";

const pull: PanelPull = {
  id: "pr_sample_128",
  number: 128,
  title: "Add dark mode to settings",
  repo: "Acme/web",
  headRef: "feat/dark-mode",
  projectId: "proj_sample_web",
  threadId: null,
};

describe("selectionFromSearch", () => {
  it("prefers a thread over the chat flag", () => {
    expect(selectionFromSearch({ thread: "jam_1", chat: "true" })).toEqual({
      kind: "thread",
      jamId: "jam_1",
    });
    expect(selectionFromSearch({ chat: "true" })).toEqual({ kind: "chat" });
    expect(selectionFromSearch({})).toBeNull();
  });
});

describe("linkedThreadIds", () => {
  it("reads ids from linked rows", () => {
    expect(linkedThreadIds([{ id: "jam_1" }, "jam_2", { x: 1 }], null)).toEqual(
      ["jam_1", "jam_2"],
    );
  });

  it("falls back to the pull's own thread until links load", () => {
    expect(linkedThreadIds(undefined, "jam_9")).toEqual(["jam_9"]);
    expect(linkedThreadIds(undefined, null)).toEqual([]);
  });
});

describe("newestOwnThread", () => {
  it("picks the viewer's most recent thread", () => {
    expect(
      newestOwnThread(
        [
          { id: "jam_old", userId: "me", createdAt: "2026-01-01T00:00:00Z" },
          { id: "jam_other", userId: "you", createdAt: "2026-03-01T00:00:00Z" },
          { id: "jam_new", userId: "me", createdAt: "2026-02-01T00:00:00Z" },
        ],
        "me",
      ),
    ).toBe("jam_new");
    expect(newestOwnThread([], "me")).toBeNull();
  });
});

describe("triggerSelection", () => {
  it("waits while the viewer's thread is loading", () => {
    expect(
      triggerSelection({
        ownThreadId: undefined,
        pending: false,
        chatable: true,
      }),
    ).toBeNull();
  });

  it("opens the viewer's thread when there is one", () => {
    expect(
      triggerSelection({
        ownThreadId: "jam_1",
        pending: true,
        chatable: false,
      }),
    ).toEqual({ kind: "thread", jamId: "jam_1" });
  });

  it("offers a chat only once links settle and the project is reachable", () => {
    expect(
      triggerSelection({ ownThreadId: null, pending: true, chatable: true }),
    ).toBeNull();
    expect(
      triggerSelection({ ownThreadId: null, pending: false, chatable: true }),
    ).toEqual({ kind: "chat" });
    expect(
      triggerSelection({ ownThreadId: null, pending: false, chatable: false }),
    ).toBeNull();
  });
});

describe("chat copy", () => {
  it("titles the thread after the pull", () => {
    expect(pullThreadTitle(pull)).toBe("#128 Add dark mode to settings");
  });

  it("starts the draft with a mention of the pull", () => {
    expect(pullChatDraft(pull)).toEqual({
      text: "@#128 Add dark mode to settings ",
      mentions: [
        {
          kind: "pr",
          id: "acme/web#128",
          label: "#128 Add dark mode to settings",
          start: 0,
          end: 31,
          text: "@#128 Add dark mode to settings",
        },
      ],
      files: [],
    });
  });

  it("names the pull by repository and number", () => {
    expect(pullChatSubtitle(pull)).toBe("web#128");
    expect(pullChatSubtitle({ repo: "web", number: 3 })).toBe("web#3");
  });
});
