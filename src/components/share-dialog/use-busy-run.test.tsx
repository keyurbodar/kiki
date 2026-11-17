import { act, cleanup, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBusyRun } from "./use-busy-run";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useBusyRun", () => {
  it("is busy while work runs and toasts success with an undo action", async () => {
    const { result } = renderHook(() => useBusyRun());
    const noop = () => {};
    let finish: () => void = noop;
    const work = () => new Promise<void>((resolve) => (finish = resolve));
    const undo = vi.fn(() => Promise.resolve());
    let outcome: Promise<boolean> = Promise.resolve(false);
    act(() => {
      outcome = result.current.run({
        work,
        success: "Sam added",
        failure: "Could not add person",
        undo,
      });
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      await vi.waitFor(() => expect(finish).not.toBe(noop));
      finish();
      await outcome;
    });
    expect(await outcome).toBe(true);
    expect(result.current.busy).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("Sam added", {
      action: { label: "Undo", onClick: expect.any(Function) },
    });

    const options = vi.mocked(toast.success).mock.calls[0]?.[1] as unknown as {
      action: { onClick: () => void };
    };
    await act(async () => {
      options.action.onClick();
      await Promise.resolve();
    });
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Change undone", {
        action: undefined,
      }),
    );
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("toasts the failure copy and resolves false when work fails", async () => {
    const { result } = renderHook(() => useBusyRun());
    let ok = true;
    await act(async () => {
      ok = await result.current.run({
        work: () => Promise.reject(new Error("boom")),
        success: "Access updated",
        failure: "Could not change thread access",
      });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Could not change thread access");
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.busy).toBe(false);
  });

  it("runs steps one after another", async () => {
    const { result } = renderHook(() => useBusyRun());
    const order: string[] = [];
    let releaseFirst: () => void = () => {};
    const first = () =>
      new Promise<void>((resolve) => {
        order.push("first:start");
        releaseFirst = () => {
          order.push("first:end");
          resolve();
        };
      });
    const second = () => {
      order.push("second");
      return Promise.resolve();
    };
    let done: Promise<boolean> = Promise.resolve(false);
    act(() => {
      void result.current.run({ work: first, success: "a", failure: "a" });
      done = result.current.run({ work: second, success: "b", failure: "b" });
    });
    await act(async () => {
      await vi.waitFor(() => expect(order).toEqual(["first:start"]));
      releaseFirst();
      await done;
    });
    expect(order).toEqual(["first:start", "first:end", "second"]);
    expect(result.current.busy).toBe(false);
  });
});
