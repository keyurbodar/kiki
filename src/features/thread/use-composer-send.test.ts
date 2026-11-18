import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const sent: Array<{ payload: Record<string, unknown> }> = [];

vi.mock("@effect/atom-react", () => ({
  useAtomValue: (atom: { kind?: string }) =>
    atom.kind === "organizations"
      ? { _tag: "Success", value: [{ id: "org_sample" }] }
      : "org_sample",
  useAtomSet: () => (input: { payload: Record<string, unknown> }) => {
    sent.push(input);
    return Promise.resolve({});
  },
}));

vi.mock("@/data/atoms/session", () => ({
  organizationsAtom: { kind: "organizations" },
  selectedOrgIdAtom: { kind: "selected" },
  resolveActiveOrgId: () => "org_sample",
}));

vi.mock("@/data/atoms/events", () => ({
  jamEventKey: (jamId: string) => `jam_event:${jamId}`,
  sendMessageAtom: { kind: "send" },
}));

const { useComposerSend } = await import("./use-composer-send");

const payload = { text: "reworded", mentions: [], files: [] };

describe("useComposerSend", () => {
  it("sends a new message as text alone", () => {
    const { result } = renderHook(() => useComposerSend("jam_sample"));
    expect(result.current(payload)).toBe(true);
    expect(sent.at(-1)?.payload).toEqual({ text: "reworded" });
  });

  it("names the replaced message when the send is an edit", () => {
    const { result } = renderHook(() =>
      useComposerSend("jam_sample", "01JAAAAAAAAAAAAAAAAAAAAAAA" as never),
    );
    result.current(payload);
    expect(sent.at(-1)?.payload).toEqual({
      text: "reworded",
      editOf: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    });
  });

  it("keeps the text when there is no thread to send to", () => {
    const before = sent.length;
    const { result } = renderHook(() => useComposerSend(undefined));
    expect(result.current(payload)).toBe(false);
    expect(sent.length).toBe(before);
  });
});
