import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const sent: Array<Record<string, unknown>> = [];
const appended: Array<Record<string, unknown>> = [];
const removed: Array<string> = [];
const refreshed: unknown[] = [];
let failNextSend = false;
let failRefreshes = 0;

vi.mock("@effect/atom-react", () => ({
  useAtomValue: (atom: { kind?: string }) =>
    atom.kind === "organizations"
      ? { _tag: "Success", value: [{ id: "org_sample" }] }
      : atom.kind === "currentUser"
        ? { _tag: "Success", value: { id: "user_sample" } }
        : "org_sample",
  useAtomSet:
    (atom: { kind?: string }) =>
    (input?: unknown): unknown => {
      switch (atom.kind) {
        case "send":
          sent.push(input as Record<string, unknown>);
          return failNextSend
            ? Promise.reject(new Error("send refused"))
            : Promise.resolve({ id: "01M7PK3X2N00000000000000W5" });
        case "append":
          appended.push(input as Record<string, unknown>);
          return undefined;
        case "remove":
          removed.push(input as string);
          return undefined;
        case "refresh":
          refreshed.push(input);
          if (failRefreshes > 0) {
            failRefreshes -= 1;
            return Promise.reject(new Error("refresh refused"));
          }
          return Promise.resolve(undefined);
        default:
          return undefined;
      }
    },
}));

vi.mock("@/data/atoms/session", () => ({
  organizationsAtom: { kind: "organizations" },
  selectedOrgIdAtom: { kind: "selected" },
  currentUserAtom: { kind: "currentUser" },
  resolveActiveOrgId: () => "org_sample",
}));

vi.mock("@/data/atoms/events", () => ({
  jamEventKey: (jamId: string) => `jam_event:${jamId}`,
  sendMessageAtom: { kind: "send" },
}));

vi.mock("@/features/thread/timeline", () => ({
  threadKey: (orgId: string, jamId: string) => `${orgId}/${jamId}`,
  appendPendingAtom: () => ({ kind: "append" }),
  removePendingAtom: () => ({ kind: "remove" }),
  refreshNewestAtom: () => ({ kind: "refresh" }),
}));

vi.mock("@/primitives/toaster", async () => ({
  ...(await vi.importActual<typeof import("@/primitives/toaster")>(
    "@/primitives/toaster",
  )),
  toast: { error: vi.fn() },
}));

const { useComposerSend } = await import("./use-composer-send");
const { toast } = await import("@/primitives/toaster");

const payload = { text: "reworded", mentions: [], files: [] };

/** The payload of the newest send, as the mutation received it. */
const lastSentPayload = () =>
  (sent.at(-1)?.payload ?? {}) as Record<string, unknown>;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The messages toasted since `mark`, so a test sees only its own. */
const toastsSince = (mark: number) =>
  vi
    .mocked(toast.error)
    .mock.calls.slice(mark)
    .map((call) => call[0]);

describe("useComposerSend", () => {
  it("appends the row optimistically and sends the gesture with a client key", async () => {
    const { result } = renderHook(() => useComposerSend("jam_sample"));
    expect(result.current(payload, "steer")).toBe(true);
    const sentPayload = lastSentPayload();
    const clientKey = sentPayload.clientKey;
    expect(sentPayload).toMatchObject({ text: "reworded", delivery: "steer" });
    expect(typeof clientKey).toBe("string");
    expect(appended.at(-1)).toMatchObject({
      clientKey,
      text: "reworded",
      delivery: "steer",
      userId: "user_sample",
    });
    await flush();
    expect(refreshed.length).toBeGreaterThan(0);
  });

  it("sends itself when the composer names no gesture", () => {
    const { result } = renderHook(() => useComposerSend("jam_sample"));
    result.current(payload);
    expect(lastSentPayload().delivery).toBe("steer");
  });

  it("names the replaced message when the send is an edit", () => {
    const { result } = renderHook(() =>
      useComposerSend("jam_sample", "01JAAAAAAAAAAAAAAAAAAAAAAA" as never),
    );
    result.current(payload, "interrupt");
    expect(sent.at(-1)?.payload).toMatchObject({
      text: "reworded",
      editOf: "01JAAAAAAAAAAAAAAAAAAAAAAA",
      delivery: "interrupt",
    });
  });

  it("keeps the text when there is no thread to send to", () => {
    const before = sent.length;
    const { result } = renderHook(() => useComposerSend(undefined));
    expect(result.current(payload)).toBe(false);
    expect(sent.length).toBe(before);
  });

  it("drops the pending row and hands the text back when the send fails", async () => {
    failNextSend = true;
    const restored: Array<unknown> = [];
    const { result } = renderHook(() =>
      useComposerSend("jam_sample", undefined, (failed) =>
        restored.push(failed),
      ),
    );
    result.current(payload, "steer");
    const clientKey = lastSentPayload().clientKey;
    await flush();
    expect(removed.at(-1)).toBe(clientKey);
    expect(restored.at(-1)).toEqual(payload);
    failNextSend = false;
  });

  it("keeps the row when only the follow-up refresh fails, and retries it", async () => {
    failRefreshes = 1;
    const refreshedBefore = refreshed.length;
    const toastsBefore = vi.mocked(toast.error).mock.calls.length;
    const restored: Array<unknown> = [];
    const { result } = renderHook(() =>
      useComposerSend("jam_sample", undefined, (failed) =>
        restored.push(failed),
      ),
    );
    result.current(payload, "steer");
    const clientKey = lastSentPayload().clientKey;
    await flush();
    await flush();
    expect(removed).not.toContain(clientKey);
    expect(appended.at(-1)).toMatchObject({ clientKey });
    expect(restored).toEqual([]);
    expect(refreshed.length - refreshedBefore).toBe(2);
    expect(toastsSince(toastsBefore)).toEqual([]);
  });

  it("reports a refresh that keeps failing as a refresh, not a send", async () => {
    failRefreshes = 2;
    const toastsBefore = vi.mocked(toast.error).mock.calls.length;
    const removedBefore = removed.length;
    const { result } = renderHook(() => useComposerSend("jam_sample"));
    result.current(payload, "steer");
    const clientKey = lastSentPayload().clientKey;
    await flush();
    await flush();
    expect(removed.length).toBe(removedBefore);
    expect(removed).not.toContain(clientKey);
    expect(toastsSince(toastsBefore)).toEqual([
      "Message sent, but the timeline could not refresh",
    ]);
  });
});
