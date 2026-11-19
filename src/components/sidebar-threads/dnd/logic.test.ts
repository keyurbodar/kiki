import { describe, expect, it } from "vitest";
import { folderIdOf, insertionIndex, planDrop, withMoved } from "./logic";

describe("drag between sidebar sections", () => {
  it("reads a folder id out of a folder section id", () => {
    expect(folderIdOf("folder:fld_1")).toBe("fld_1");
    expect(folderIdOf("threads:recent")).toBeNull();
    expect(folderIdOf("closed:shelf:settled")).toBeNull();
  });

  it("moves a loose thread into a folder", () => {
    expect(planDrop("threads:recent", "folder:fld_1")).toEqual({
      kind: "move",
      folderId: "fld_1",
    });
  });

  it("moves a thread from one folder to another", () => {
    expect(planDrop("folder:fld_1", "folder:fld_2")).toEqual({
      kind: "move",
      folderId: "fld_2",
    });
  });

  it("reorders inside the folder the thread already sits in", () => {
    expect(planDrop("folder:fld_1", "folder:fld_1")).toEqual({
      kind: "reorder",
      folderId: "fld_1",
    });
  });

  it("unfiles a thread dropped on any unfiled section", () => {
    expect(planDrop("folder:fld_1", "threads:recent")).toEqual({
      kind: "unfile",
    });
    expect(planDrop("folder:fld_1", "closed:shelf:settled")).toEqual({
      kind: "unfile",
    });
  });

  it("does nothing when a loose thread is dropped on a loose section", () => {
    expect(planDrop("threads:recent", "threads:recent")).toEqual({
      kind: "none",
    });
  });
});

describe("insertion index", () => {
  it("lands above the row whose middle the pointer has not passed", () => {
    expect(insertionIndex(10, [100, 140, 180])).toBe(0);
    expect(insertionIndex(120, [100, 140, 180])).toBe(1);
    expect(insertionIndex(150, [100, 140, 180])).toBe(2);
    expect(insertionIndex(500, [100, 140, 180])).toBe(3);
  });
});

describe("reorder payload", () => {
  it("moves an id to an index and leaves the rest in order", () => {
    expect(withMoved(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
    expect(withMoved(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
  });

  it("appends an id that is not in the folder yet", () => {
    expect(withMoved(["a", "b"], "c", 1)).toEqual(["a", "c", "b"]);
    expect(withMoved([], "c", 0)).toEqual(["c"]);
  });

  it("clamps an index past the end", () => {
    expect(withMoved(["a", "b"], "c", 99)).toEqual(["a", "b", "c"]);
  });
});
