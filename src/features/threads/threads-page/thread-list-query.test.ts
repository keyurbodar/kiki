import { describe, expect, it } from "vitest";
import { threadListQuery } from "./model";

describe("thread list query", () => {
  it("keeps filed threads in the archived request", () => {
    expect(
      threadListQuery({ archivedView: true, showFiledThreads: false }),
    ).toEqual({ archived: true, excludeFiled: false });
  });

  it("drops filed threads from the active list when duplicates are off", () => {
    expect(
      threadListQuery({ archivedView: false, showFiledThreads: false }),
    ).toEqual({ archived: false, excludeFiled: true });
    expect(
      threadListQuery({ archivedView: false, showFiledThreads: true }),
    ).toEqual({ archived: false, excludeFiled: false });
  });
});
