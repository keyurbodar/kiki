import { render, screen } from "@testing-library/react";
import { AsyncResult } from "effect/reactivity";
import { describe, expect, it, vi } from "vitest";
import {
  deletedSummary,
  formatRelative,
  MissingFileState,
  missingFileStatus,
} from "./missing-file";

const now = Date.parse("2026-03-10T12:00:00Z");

describe("missingFileStatus", () => {
  it("is checking while history loads and unchecked when it fails", () => {
    expect(missingFileStatus(AsyncResult.initial(true))).toEqual({
      kind: "checking",
    });
    expect(missingFileStatus(AsyncResult.fail("down"))).toEqual({
      kind: "unchecked",
    });
  });

  it("is absent without versions and deleted with the newest one", () => {
    expect(missingFileStatus(AsyncResult.success([]))).toEqual({
      kind: "absent",
    });
    expect(
      missingFileStatus(
        AsyncResult.success([
          {
            versionId: "ver_2",
            removedBy: {
              createdAt: "2026-03-10T09:00:00Z",
              threadTitle: null,
              authorName: "Alex Morgan",
            },
          },
          { versionId: "ver_1" },
        ]),
      ),
    ).toEqual({
      kind: "deleted",
      lastVersionId: "ver_2",
      removedAt: "2026-03-10T09:00:00Z",
      thread: null,
      author: "Alex Morgan",
    });
  });
});

describe("deletedSummary", () => {
  const base = {
    kind: "deleted" as const,
    lastVersionId: "ver_1",
    removedAt: "2026-03-10T09:00:00Z",
    thread: null,
    author: null,
  };

  it("prefers the thread, then the author", () => {
    expect(deletedSummary(base, now)).toBe("Deleted 3h ago");
    expect(deletedSummary({ ...base, author: "Sam Lee" }, now)).toBe(
      "Deleted 3h ago by Sam Lee",
    );
    expect(
      deletedSummary(
        { ...base, author: "Sam Lee", thread: "Fix retries" },
        now,
      ),
    ).toBe("Deleted 3h ago in Fix retries");
  });

  it("explains an aged-out removal", () => {
    expect(deletedSummary({ ...base, removedAt: null }, now)).toBe(
      "Its removal has aged out of this drive's history",
    );
  });
});

describe("formatRelative", () => {
  it("buckets like Capy", () => {
    expect(formatRelative(now - 2000, now)).toBe("just now");
    expect(formatRelative(now - 90_000, now)).toBe("1m ago");
    expect(formatRelative(now - 3 * 86_400_000, now)).toBe("3d ago");
    expect(formatRelative(now + 2 * 3_600_000, now)).toBe("in 2h");
  });
});

describe("MissingFileState", () => {
  it("offers the last version of a deleted file", () => {
    const onOpenVersion = vi.fn();
    render(
      <MissingFileState
        state={{
          kind: "deleted",
          lastVersionId: "ver_9",
          removedAt: null,
          thread: null,
          author: null,
        }}
        absent="Not in this drive yet"
        onRetry={() => {}}
        onOpenVersion={onOpenVersion}
      />,
    );
    expect(screen.getByText("File deleted")).toBeTruthy();
    screen.getByText("Open last version").click();
    expect(onOpenVersion).toHaveBeenCalledWith("ver_9");
  });

  it("shows the absent copy with a retry", () => {
    const onRetry = vi.fn();
    render(
      <MissingFileState
        state={{ kind: "absent" }}
        absent="Not in this drive yet"
        onRetry={onRetry}
        onOpenVersion={() => {}}
      />,
    );
    expect(screen.getByText("File not found")).toBeTruthy();
    expect(screen.getByText("Not in this drive yet")).toBeTruthy();
    screen.getByText("Retry").click();
    expect(onRetry).toHaveBeenCalled();
  });
});
