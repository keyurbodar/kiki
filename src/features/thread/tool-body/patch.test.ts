import { expect, it } from "vitest";
import { patchForTool, patchFromPatchText, patchPath } from "./patch";

it("builds a new-file diff for a write call", () => {
  const patch = patchForTool("write", {
    path: "src/a.ts",
    content: "const a = 1;\nconst b = 2;\n",
  });
  expect(patch).toBe(
    [
      "diff --git a/src/a.ts b/src/a.ts",
      "new file mode 100644",
      "--- /dev/null",
      "+++ b/src/a.ts",
      "@@ -0,0 +1,2 @@",
      "+const a = 1;",
      "+const b = 2;",
    ].join("\n"),
  );
});

it("builds one replaced hunk for an edit call", () => {
  const patch = patchForTool("edit", {
    path: "src/a.ts",
    old_string: "const a = 1;",
    new_string: "const a = 2;",
  });
  expect(patch).toBe(
    [
      "diff --git a/src/a.ts b/src/a.ts",
      "--- a/src/a.ts",
      "+++ b/src/a.ts",
      "@@ -1,1 +1,1 @@",
      "-const a = 1;",
      "+const a = 2;",
    ].join("\n"),
  );
});

it("parses an apply_patch add, update and delete", () => {
  const patch = patchFromPatchText(
    [
      "*** Begin Patch",
      "*** Add File: src/new.ts",
      "+export const x = 1;",
      "*** Update File: src/old.ts",
      "@@ export const y = 1;",
      " export const y = 1;",
      "-export const z = 2;",
      "+export const z = 3;",
      "*** Delete File: src/gone.ts",
      "*** End Patch",
    ].join("\n"),
  );
  expect(patch).toBe(
    [
      "diff --git a/src/new.ts b/src/new.ts",
      "new file mode 100644",
      "--- /dev/null",
      "+++ b/src/new.ts",
      "@@ -0,0 +1,1 @@",
      "+export const x = 1;",
      "diff --git a/src/old.ts b/src/old.ts",
      "--- a/src/old.ts",
      "+++ b/src/old.ts",
      "@@ -1,2 +1,2 @@ export const y = 1;",
      " export const y = 1;",
      "-export const z = 2;",
      "+export const z = 3;",
      "diff --git a/src/gone.ts b/src/gone.ts",
      "deleted file mode 100644",
      "--- a/src/gone.ts",
      "+++ /dev/null",
    ].join("\n"),
  );
});

it("counts hunk lines across a multi-hunk update", () => {
  const patch = patchFromPatchText(
    [
      "*** Begin Patch",
      "*** Update File: src/a.ts",
      "@@",
      " keep",
      "-old",
      "+new",
      "@@",
      " keep two",
      "+added",
      "*** End Patch",
    ].join("\n"),
  );
  expect(patch?.split("\n").filter((line) => line.startsWith("@@"))).toEqual([
    "@@ -1,2 +1,2 @@",
    "@@ -3,1 +3,2 @@",
  ]);
});

it("has no diff for a tool that edits nothing", () => {
  expect(patchForTool("bash", { command: "ls" })).toBeUndefined();
  expect(patchForTool("edit", { path: "a.ts" })).toBeUndefined();
  expect(patchFromPatchText("*** Begin Patch\n*** End Patch")).toBeUndefined();
});

it("reads the path out of the patch header", () => {
  const patch = patchForTool("write", { path: "src/a.ts", content: "x" });
  expect(patchPath(patch ?? "")).toBe("src/a.ts");
});
