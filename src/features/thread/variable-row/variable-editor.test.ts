import { describe, expect, it } from "vitest";
import {
  initialRows,
  mergeVariables,
  toVariablePayload,
  variableProblem,
} from "./variable-editor";

describe("variable editor", () => {
  it("builds locked rows from the requested names", () => {
    expect(initialRows(undefined, ["A", "B"]).map((row) => row.name)).toEqual([
      "A",
      "B",
    ]);
    expect(initialRows(undefined, undefined)).toHaveLength(1);
  });

  it("fills matching rows and drops unknown names when locked", () => {
    let id = 10;
    const next = () => ({
      id: ++id,
      name: "",
      value: "",
      description: "",
      descriptionTouched: false,
    });
    const rows = initialRows(undefined, ["A"]).map((row) => ({
      ...row,
      value: "old",
    }));
    const locked = mergeVariables(
      rows,
      [
        { name: "A", value: "new" },
        { name: "B", value: "x" },
      ],
      "paste",
      true,
      next,
    );
    expect(locked.filled[0]?.value).toBe("new");
    expect(locked.filled[0]?.replaced).toBe("paste");
    expect(locked.added).toEqual([]);
    const open = mergeVariables(
      rows,
      [{ name: "B", value: "x" }],
      "import",
      false,
      next,
    );
    expect(open.added.map((row) => row.name)).toEqual(["B"]);
  });

  it("reports the first problem with a row", () => {
    const row = {
      id: 0,
      name: "",
      value: "",
      description: "",
      descriptionTouched: false,
    };
    expect(variableProblem(row, [])).toBe("Name is required");
    expect(variableProblem({ ...row, name: "1A" }, [])).toMatch(
      /shell identifiers/,
    );
    const a = { ...row, name: "A" };
    expect(variableProblem(a, [a, { ...a, id: 1 }])).toBe("Duplicate name: A");
    expect(variableProblem(a, [a])).toBeUndefined();
  });

  it("sends descriptions only when touched", () => {
    const base = {
      id: 0,
      name: "A",
      value: "1",
      description: "",
      descriptionTouched: false,
    };
    expect(
      toVariablePayload({
        filled: [base, { ...base, id: 1, name: "B", descriptionTouched: true }],
      }),
    ).toEqual([
      { name: "A", value: "1", description: undefined },
      { name: "B", value: "1", description: null },
    ]);
  });
});
