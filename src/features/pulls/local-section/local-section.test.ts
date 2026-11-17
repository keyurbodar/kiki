import { describe, expect, it } from "vitest";
import { decodeLocalPulls, groupLocalPulls } from "./data";

describe("local pull decoding", () => {
  it("reads the mock's rows and derives the GitHub url", () => {
    expect(
      decodeLocalPulls([
        {
          id: "localpull_1",
          number: 214,
          title: "Polish the dark mode toggle",
          state: "draft",
          repo: "acme/web",
          branch: "feat/dark-mode",
          authorLogin: "sam",
          threadId: "jam_1",
          updatedAt: "2026-03-10T11:42:00Z",
        },
        { nope: true },
      ]),
    ).toEqual([
      {
        id: "localpull_1",
        number: 214,
        title: "Polish the dark mode toggle",
        state: "draft",
        repo: "acme/web",
        branch: "feat/dark-mode",
        author: "sam",
        threadId: "jam_1",
        updatedAt: Date.parse("2026-03-10T11:42:00Z"),
        url: "https://github.com/acme/web/pull/214",
      },
    ]);
    expect(decodeLocalPulls(undefined)).toEqual([]);
  });

  it("groups by repository and orders each group newest first", () => {
    const rows = decodeLocalPulls([
      { id: "a", number: 1, repo: "acme/web", updatedAt: 10 },
      { id: "b", number: 2, repo: "acme/api", updatedAt: 30 },
      { id: "c", number: 3, repo: "acme/web", updatedAt: 20 },
    ]);
    expect(groupLocalPulls(rows)).toMatchObject([
      { repo: "acme/api", pulls: [{ id: "b" }] },
      { repo: "acme/web", pulls: [{ id: "c" }, { id: "a" }] },
    ]);
  });
});
