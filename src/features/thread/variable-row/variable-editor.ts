import { useRef, useState } from "react";
import { toast } from "@/primitives/toaster";
import {
  byteLength,
  isVariableName,
  MAX_DESCRIPTION_BYTES,
  MAX_VALUE_BYTES,
  NAME_RULE,
  type ParsedVariable,
  parseEnv,
} from "./parse-env";

export type VariableDraft = {
  id: number;
  name: string;
  value: string;
  description: string;
  descriptionTouched: boolean;
  replaced?: "paste" | "import";
};

export type InitialVariable = {
  name: string;
  value: string;
  description?: string;
};

type IncomingVariable = ParsedVariable & { description?: string };

const blankRow = (id: number): VariableDraft => ({
  id,
  name: "",
  value: "",
  description: "",
  descriptionTouched: false,
});

export const initialRows = (
  initial: ReadonlyArray<InitialVariable> | undefined,
  lockedNames: ReadonlyArray<string> | undefined,
): VariableDraft[] =>
  lockedNames === undefined
    ? initial === undefined || initial.length === 0
      ? [blankRow(0)]
      : initial.map((variable, id) => ({
          id,
          name: variable.name,
          value: variable.value,
          description: variable.description ?? "",
          descriptionTouched: variable.description !== undefined,
        }))
    : lockedNames.map((name, id) => ({ ...blankRow(id), name }));

export const isFilled = (row: VariableDraft) =>
  row.name !== "" || row.value !== "" || row.description !== "";

export const variableProblem = (
  row: VariableDraft,
  filled: ReadonlyArray<VariableDraft>,
) => {
  if (row.name === "") return "Name is required";
  if (!isVariableName(row.name)) return NAME_RULE;
  if (filled.some((other) => other.id !== row.id && other.name === row.name))
    return `Duplicate name: ${row.name}`;
  if (byteLength(row.value) > MAX_VALUE_BYTES)
    return "Values must fit in 32,768 bytes";
  if (byteLength(row.description) > MAX_DESCRIPTION_BYTES)
    return "Descriptions must fit in 4,096 bytes";
  return undefined;
};

export const mergeVariables = (
  rows: ReadonlyArray<VariableDraft>,
  incoming: ReadonlyArray<IncomingVariable>,
  source: "paste" | "import",
  locked: boolean,
  nextRow: () => VariableDraft,
) => {
  const matched = new Map<number, IncomingVariable>();
  const added = incoming.flatMap((variable) => {
    const row = rows.find(
      (candidate) =>
        candidate.name === variable.name && !matched.has(candidate.id),
    );
    if (row !== undefined) {
      matched.set(row.id, variable);
      return [];
    }
    if (locked) return [];
    return [
      {
        ...nextRow(),
        ...variable,
        description: variable.description ?? "",
        descriptionTouched: variable.description !== undefined,
      },
    ];
  });
  return {
    filled: rows.map((row) => {
      const variable = matched.get(row.id);
      if (variable === undefined) return row;
      const replaced =
        row.value !== "" && row.value !== variable.value
          ? source
          : row.replaced;
      return { ...row, value: variable.value, replaced };
    }),
    added,
  };
};

export const toVariablePayload = (editor: {
  filled: ReadonlyArray<VariableDraft>;
}) =>
  editor.filled.map((row) => ({
    name: row.name,
    value: row.value,
    description: row.descriptionTouched
      ? row.description === ""
        ? null
        : row.description
      : undefined,
  }));

export type VariableEditorOptions = {
  initial?: ReadonlyArray<InitialVariable>;
  lockedNames?: ReadonlyArray<string>;
};

export type VariableEditor = ReturnType<typeof useVariableEditor>;

export function useVariableEditor({
  initial,
  lockedNames,
}: VariableEditorOptions = {}) {
  const locked = lockedNames !== undefined;
  const lastId = useRef(
    Math.max(initial?.length ?? 0, lockedNames?.length ?? 0, 1),
  );
  const [rows, setRows] = useState(() => initialRows(initial, lockedNames));
  const [showErrors, setShowErrors] = useState(false);

  const nextRow = () => {
    lastId.current += 1;
    return blankRow(lastId.current);
  };

  const reset = () => {
    setRows(locked ? initialRows(undefined, lockedNames) : [nextRow()]);
    setShowErrors(false);
  };

  const update = (id: number, patch: Partial<VariableDraft>) =>
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, ...patch, replaced: undefined } : row,
      ),
    );

  const remove = (id: number) =>
    setRows((current) => {
      const remaining = current.filter((row) => row.id !== id);
      return remaining.length === 0 ? [nextRow()] : remaining;
    });

  const add = () => setRows((current) => [...current, nextRow()]);

  const spliceAt = (id: number, incoming: ReadonlyArray<ParsedVariable>) =>
    setRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      const { filled, added } = mergeVariables(
        current,
        incoming,
        "paste",
        locked,
        nextRow,
      );
      const row = filled[index];
      const keep = row !== undefined && isFilled(row);
      return [
        ...filled.slice(0, index + (keep ? 1 : 0)),
        ...added,
        ...filled.slice(index + 1),
      ];
    });

  const merge = (
    incoming: ReadonlyArray<ParsedVariable>,
    source: "paste" | "import",
  ) =>
    setRows((current) => {
      const { filled, added } = mergeVariables(
        current,
        incoming,
        source,
        locked,
        nextRow,
      );
      return [...(locked ? filled : filled.filter(isFilled)), ...added];
    });

  const filled = rows.filter(isFilled);
  const problemOf = (row: VariableDraft) => variableProblem(row, filled);
  const problems = filled.some((row) => problemOf(row) !== undefined);

  const pasteInto =
    (field: "name" | "value") =>
    (
      id: number,
      event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const text = event.clipboardData.getData("text/plain");
      const parsed = parseEnv(text);
      if (parsed === null) return;
      if (field === "value" && !(parsed.complete && text.trim().includes("\n")))
        return;
      event.preventDefault();
      spliceAt(id, parsed.entries);
    };

  const pasteText = (text: string) => {
    const parsed = parseEnv(text);
    if (parsed === null) return false;
    merge(parsed.entries, "paste");
    return true;
  };

  const importFile = (file: Blob) => {
    file
      .text()
      .catch(() => {
        toast.error("Could not read the file");
        return "";
      })
      .then((text) => {
        if (text === "") return;
        const parsed = parseEnv(text);
        if (parsed === null) toast.error("No variables found in the file");
        else merge(parsed.entries, "import");
      });
  };

  return {
    rows,
    filled,
    locked,
    problems,
    problemOf,
    showErrors,
    setShowErrors,
    update,
    remove,
    add,
    pasteInto,
    pasteText,
    importFile,
    reset,
  };
}
