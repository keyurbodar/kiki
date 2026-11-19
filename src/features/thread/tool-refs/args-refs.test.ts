import { describe, expect, it } from "vitest";
import { refsInArgs } from "./args-refs";

describe("refsInArgs", () => {
  it("finds a thread id at the top of the payload", () => {
    expect(refsInArgs({ threadId: "jam_sample_0002" })).toEqual({
      threadId: "jam_sample_0002",
    });
  });

  it("finds a thread id nested under params, as a jam id", () => {
    expect(refsInArgs({ params: { jamId: "jam_sample_0005" } })).toEqual({
      threadId: "jam_sample_0005",
    });
  });

  it("finds a snake_case thread id inside an array of filters", () => {
    expect(
      refsInArgs({ params: { filters: [{ thread_id: "jam_sample_0003" }] } }),
    ).toEqual({ threadId: "jam_sample_0003" });
  });

  it("reads a github pull url wherever it sits", () => {
    expect(
      refsInArgs({
        params: { url: "https://github.com/acme/web/pull/128" },
      }),
    ).toEqual({ pull: { repositoryFullName: "acme/web", number: 128 } });
  });

  it("reads a pull from a repo and a number on one record", () => {
    expect(refsInArgs({ repo: "acme/web", number: 128 })).toEqual({
      pull: { repositoryFullName: "acme/web", number: 128 },
    });
  });

  it("carries both a thread and a pull when the call names both", () => {
    expect(
      refsInArgs({
        jam_id: "jam_sample_0002",
        pull: { repoFullName: "acme/web", prNumber: 128 },
      }),
    ).toEqual({
      threadId: "jam_sample_0002",
      pull: { repositoryFullName: "acme/web", number: 128 },
    });
  });

  it("finds nothing in a payload that names neither", () => {
    expect(refsInArgs({ command: "bun test", cwd: "/repo" })).toEqual({});
  });

  it("ignores a thread key whose value is not a name", () => {
    expect(refsInArgs({ threadId: "", jamId: 42 })).toEqual({});
  });

  it("ignores a repo without a pull number", () => {
    expect(refsInArgs({ repo: "acme/web" })).toEqual({});
  });

  it("stops walking rather than recursing forever", () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let index = 0; index < 40; index += 1) {
      const next: Record<string, unknown> = {};
      cursor.next = next;
      cursor = next;
    }
    cursor.jamId = "jam_sample_0002";
    expect(refsInArgs(deep)).toEqual({});
  });
});
