import { HttpClientError } from "effect/http";
import { HttpApiError } from "effect/http-api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { goneMessage, goneOr, isGone } from "./gone";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("@/primitives/toaster", async () => ({
  ...(await vi.importActual<typeof import("@/primitives/toaster")>(
    "@/primitives/toaster",
  )),
  toast: { error: toastError },
}));

afterEach(() => {
  toastError.mockReset();
});

describe("a mutation that names a row the server no longer has", () => {
  it("recognises the declared 404 and a transport 404, and nothing else", () => {
    expect(isGone(new HttpApiError.NotFound({}))).toBe(true);
    expect(
      isGone(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.StatusCodeError({
            request: { method: "POST", url: "http://localhost/api" } as never,
            response: { status: 404 } as never,
          }),
        }),
      ),
    ).toBe(true);
    expect(isGone(new Error("boom"))).toBe(false);
    expect(isGone(undefined)).toBe(false);
  });

  it("says the row is gone rather than that the action was refused", () => {
    expect(goneMessage("This review")).toEqual({
      title: "This review no longer exists",
      description: "It was deleted, so the list behind it is refreshing",
    });
  });

  it("refreshes the list that carried the row, and leaves other errors alone", () => {
    const refresh = vi.fn();
    expect(goneOr(new HttpApiError.NotFound({}), "This finding", refresh)).toBe(
      true,
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("This finding no longer exists", {
      description: "It was deleted, so the list behind it is refreshing",
    });

    toastError.mockReset();
    const untouched = vi.fn();
    expect(goneOr(new Error("500"), "This finding", untouched)).toBe(false);
    expect(untouched).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
