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

describe("refsInArgs file references", () => {
  it("reads the path a file tool names", () => {
    expect(refsInArgs({ path: "src/checkout/retry.ts" })).toEqual({
      file: "src/checkout/retry.ts",
    });
  });

  it("reads a snake_case file path nested in a params record", () => {
    expect(
      refsInArgs({ params: { file_path: "/home/user/notes.md" } }),
    ).toEqual({ file: "/home/user/notes.md" });
  });

  it("carries a thread, a pull and a file together", () => {
    expect(
      refsInArgs({
        jamId: "jam_sample_0002",
        repo: "acme/web",
        number: 7,
        path: "src/app.tsx",
      }),
    ).toEqual({
      threadId: "jam_sample_0002",
      pull: { repositoryFullName: "acme/web", number: 7 },
      file: "src/app.tsx",
    });
  });

  it("ignores a url behind a path key and a bare word without a slash", () => {
    expect(refsInArgs({ path: "https://example.com/a/b.md" })).toEqual({});
    expect(refsInArgs({ file: "retry.ts" })).toEqual({});
  });

  it("does not read a path out of a command's prose", () => {
    expect(
      refsInArgs({ command: "bun run test:checkout", description: "suite" }),
    ).toEqual({});
  });
});
