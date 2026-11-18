import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { HttpApiError } from "effect/http-api";
import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const setStatus = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));
vi.mock("@effect/atom-react", () => ({
  useAtomSet: () => setStatus,
  useAtomRefresh: () => refresh,
  useAtomValue: () => undefined,
}));
vi.mock("@/components/diff-tab/atoms", () => ({
  updateFindingAtom: {},
  pullReviewAtom: () => ({}),
  pullReactivityKeys: { comments: (id: string) => `pull_comment:${id}` },
}));

const { useUpdateFinding } = await import("./finding-card");

const pull = {
  orgId: "org",
  id: "pull",
  repo: "acme/web",
  number: 128,
  url: "https://github.com/acme/web/pull/128",
  headSha: "abc123",
  diffPair: null,
};

afterEach(() => {
  cleanup();
  toastError.mockReset();
  refresh.mockReset();
  setStatus.mockReset();
});

describe("updating a finding the server no longer has", () => {
  it("says it is gone and refreshes the review instead of blaming the action", async () => {
    setStatus.mockImplementation(() =>
      Promise.reject(new HttpApiError.NotFound({})),
    );
    const { result } = renderHook(() => useUpdateFinding(pull, "finding_1"));
    result.current.setStatus("resolved");
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("This finding no longer exists", {
      description: "It was deleted, so the list behind it is refreshing",
    });
  });

  it("keeps the update message for every other failure", async () => {
    setStatus.mockImplementation(() =>
      Promise.reject(new Error("GitHub is down")),
    );
    const { result } = renderHook(() => useUpdateFinding(pull, "finding_1"));
    result.current.setStatus("resolved");
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Could not update the finding", {
      description: "Error: GitHub is down",
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
