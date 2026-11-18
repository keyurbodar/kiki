import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { HttpApiError } from "effect/http-api";
import { afterEach, describe, expect, it, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const setReviewer = vi.hoisted(() => vi.fn());

vi.mock("@/primitives/toaster", async () => ({
  ...(await vi.importActual<typeof import("@/primitives/toaster")>(
    "@/primitives/toaster",
  )),

  toast: { error: toastError, success: toastSuccess },
}));
vi.mock("@effect/atom-react", () => ({
  useAtomSet: () => setReviewer,
  useAtomRefresh: () => refresh,
}));
vi.mock("@/data/client/ApiClient", () => ({
  ApiClient: { mutation: () => ({}) },
}));
vi.mock("@/components/pull-view/atoms", () => ({
  pullReviewersAtom: () => ({}),
}));

const { ReviewRowMenu } = await import("./review-row-menu");

const review = {
  githubReviewId: "ghr_1",
  reviewer: "jordan",
  state: "approved",
};

afterEach(() => {
  cleanup();
  toastError.mockReset();
  toastSuccess.mockReset();
  refresh.mockReset();
  setReviewer.mockReset();
});

describe("a review the server no longer has", () => {
  it("says the review is gone and refreshes the reviewer list", async () => {
    setReviewer.mockImplementation(() =>
      Promise.reject(new HttpApiError.NotFound({})),
    );
    render(
      <ReviewRowMenu
        pull={{ id: "pr", state: "open", author: "alex" }}
        review={review}
        orgId="org"
        defaultOpen
      />,
    );
    fireEvent.click(await screen.findByText("Re-request review"));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("This review no longer exists", {
      description: "It was deleted, so the list behind it is refreshing",
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("keeps GitHub refused for every other failure", async () => {
    setReviewer.mockImplementation(() =>
      Promise.reject(new Error("Bad credentials")),
    );
    render(
      <ReviewRowMenu
        pull={{ id: "pr", state: "open", author: "alex" }}
        review={review}
        orgId="org"
        defaultOpen
      />,
    );
    fireEvent.click(await screen.findByText("Re-request review"));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("GitHub refused", {
      description: "Bad credentials",
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
