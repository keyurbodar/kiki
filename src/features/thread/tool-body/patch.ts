/**
 * The unified diff a file-editing tool call implies, built from its own
 * arguments exactly as Capy's `patchForTool` does: `write` becomes a new file,
 * `edit` becomes one hunk of the old block replaced by the new, and
 * `apply_patch` is parsed out of its patch text. Any other tool has no diff.
 */

const field = (args: unknown, key: string): string | undefined => {
  if (typeof args !== "object" || args === null) return undefined;
  const value = (args as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
};

/** A text block's lines, without the trailing empty line a final newline leaves. */
const lines = (text: string) => {
  const all = text.split("\n");
  return all.length > 1 && all.at(-1) === "" ? all.slice(0, -1) : all;
};

const fileHeader = (from: string, to: string) =>
  [
    `diff --git a/${from} b/${to}`,
    `--- ${from === "/dev/null" ? from : `a/${from}`}`,
    `+++ ${to === "/dev/null" ? to : `b/${to}`}`,
  ].join("\n");

const addedFile = (path: string, content: string) => {
  const body = lines(content);
  return [
    `diff --git a/${path} b/${path}`,
    "new file mode 100644",
    "--- /dev/null",
    `+++ b/${path}`,
    `@@ -0,0 +1,${body.length} @@`,
    ...body.map((line) => `+${line}`),
  ].join("\n");
};

const removedFile = (path: string) =>
  [
    `diff --git a/${path} b/${path}`,
    "deleted file mode 100644",
    `--- a/${path}`,
    "+++ /dev/null",
  ].join("\n");

/** One hunk: every old line removed, every new line added, as Capy writes it. */
const editedFile = (path: string, before: string, after: string) => {
  const old = lines(before);
  const next = lines(after);
  return [
    fileHeader(path, path),
    `@@ -1,${old.length} +1,${next.length} @@`,
    ...old.map((line) => `-${line}`),
    ...next.map((line) => `+${line}`),
  ].join("\n");
};

/** `*** Begin Patch` text into a unified diff, hunk counters and all. */
export const patchFromPatchText = (text: string): string | undefined => {
  const source = text.split("\n");
  const out: string[] = [];
  let mode: "none" | "add" | "update" = "none";
  let hunk: string[] = [];
  let oldStart = 1;
  let newStart = 1;
  let header = "";

  const flush = (hunkHeader: string) => {
    if (hunk.length === 0) return;
    const oldCount = hunk.filter(
      (line) => line.startsWith(" ") || line.startsWith("-"),
    ).length;
    const newCount = hunk.filter(
      (line) => line.startsWith(" ") || line.startsWith("+"),
    ).length;
    out.push(
      `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@${hunkHeader === "" ? "" : ` ${hunkHeader}`}`,
      ...hunk,
    );
    oldStart += oldCount;
    newStart += newCount;
    hunk = [];
  };
  const flushAdded = () => {
    if (hunk.length === 0) return;
    out.push(`@@ -0,0 +1,${hunk.length} @@`, ...hunk);
    hunk = [];
  };
  const settle = () => {
    if (mode === "add") flushAdded();
    else flush(header);
  };

  for (const line of source) {
    if (
      line === "*** Begin Patch" ||
      line === "*** End Patch" ||
      line === "*** End of File" ||
      line.startsWith("*** Move to: ")
    )
      continue;
    if (line.startsWith("*** Add File: ")) {
      settle();
      const path = line.slice(14).trim();
      out.push(
        `diff --git a/${path} b/${path}`,
        "new file mode 100644",
        "--- /dev/null",
        `+++ b/${path}`,
      );
      mode = "add";
      continue;
    }
    if (line.startsWith("*** Delete File: ")) {
      settle();
      out.push(removedFile(line.slice(17).trim()));
      mode = "none";
      continue;
    }
    if (line.startsWith("*** Update File: ")) {
      settle();
      const path = line.slice(17).trim();
      out.push(fileHeader(path, path));
      mode = "update";
      oldStart = 1;
      newStart = 1;
      header = "";
      continue;
    }
    if (mode === "add") {
      hunk.push(line.startsWith("+") ? line : `+${line}`);
      continue;
    }
    if (mode === "update") {
      if (line.startsWith("@@")) {
        flush(header);
        header = line.slice(2).trim();
      } else {
        hunk.push(line);
      }
    }
  }
  settle();
  return out.length === 0 ? undefined : out.join("\n");
};

/** The diff a tool call carries, or undefined when the tool edits nothing. */
export const patchForTool = (
  toolName: string,
  args: unknown,
): string | undefined => {
  if (toolName === "write") {
    const path = field(args, "path");
    const content = field(args, "content");
    return path === undefined || content === undefined
      ? undefined
      : addedFile(path, content);
  }
  if (toolName === "edit") {
    const path = field(args, "path");
    const before = field(args, "old_string");
    const after = field(args, "new_string");
    return path === undefined || before === undefined || after === undefined
      ? undefined
      : editedFile(path, before, after);
  }
  if (toolName === "apply_patch") {
    const text = field(args, "patch_text");
    return text === undefined ? undefined : patchFromPatchText(text);
  }
  return undefined;
};

/** The path a patch's first file header names, for the card's label. */
export const patchPath = (patch: string) => {
  const match = patch.match(/^diff --git a\/(.+?) b\//m);
  return match?.[1] ?? "";
};

/** Capy expands a card in place up to this many patch lines, then opens the pane. */
export const EXPANDABLE_PATCH_LINES = 2_000;
