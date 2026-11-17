import { expect, it } from "vitest";
import { appFileUrl, githubBlobUrl } from "./links";

const pull = {
  id: "pr",
  orgId: "org",
  repo: "acme/web",
  number: 7,
  url: "https://github.com/acme/web/pull/7",
  headSha: "aaa",
  diffPair: { base: "b", head: "ccc" },
};

it("builds file links", () => {
  expect(githubBlobUrl(pull, "src/a b.ts")).toBe(
    "https://github.com/acme/web/blob/ccc/src/a b.ts",
  );
  expect(githubBlobUrl({ ...pull, diffPair: null }, "x.ts")).toBe(
    "https://github.com/acme/web/blob/aaa/x.ts",
  );
  expect(appFileUrl("https://app.test", pull, "src/a b.ts")).toBe(
    "https://app.test/pull/acme/web/7?tab=diff#src/a%20b.ts",
  );
});
