import { cx } from "class-variance-authority";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { Textarea } from "@/primitives/textarea";
import { isQuoted } from "./parse-env";
import {
  isFilled,
  type VariableDraft,
  type VariableEditor,
} from "./variable-editor";

export type VariableRowsProps = {
  editor: VariableEditor;
  existingVariables: ReadonlyMap<string, string>;
  idPrefix: string;
  descriptions?: boolean;
};

const notesFor = (
  editor: VariableEditor,
  existingVariables: ReadonlyMap<string, string>,
  row: VariableDraft,
) => {
  const problem = editor.showErrors ? editor.problemOf(row) : undefined;
  const replacesExisting =
    problem === undefined && row.name !== "" && existingVariables.has(row.name);
  return [
    ...(problem === undefined ? [] : [{ text: problem, error: true }]),
    ...(replacesExisting
      ? [{ text: `Replaces the existing ${row.name}`, error: false }]
      : []),
    ...(row.replaced === undefined
      ? []
      : [{ text: `Value replaced by the ${row.replaced}`, error: false }]),
    ...(isQuoted(row.value)
      ? [{ text: "The quotes around this value are part of it", error: false }]
      : []),
  ].map((note) => (
    <p
      key={note.text}
      className={cx(
        "text-xs font-normal",
        note.error ? "text-destructive" : "text-muted-foreground-2",
      )}
    >
      {note.text}
    </p>
  ));
};

export function VariableRows({
  editor,
  existingVariables,
  idPrefix,
  descriptions = true,
}: VariableRowsProps) {
  if (editor.locked)
    return (
      <div className="@container/rows flex flex-col gap-3">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-2 text-xs font-medium text-muted-foreground-1 @max-[30rem]/rows:hidden">
          <span>Key</span>
          <span>Value</span>
        </div>
        {editor.rows.map((row) => (
          <div
            key={row.id}
            data-slot="variable-row"
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-x-2 gap-y-1.5 @max-[30rem]/rows:grid-cols-1"
          >
            <span className="flex min-h-(--h-control-base) items-center text-sm break-all text-foreground @max-[30rem]/rows:min-h-0">
              {row.name}
            </span>
            <Textarea
              id={`${idPrefix}-value-${row.id}`}
              rows={1}
              size="base"
              aria-label={`Value of ${row.name}`}
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste value"
              className="max-h-40"
              value={row.value}
              onChange={(event) =>
                editor.update(row.id, { value: event.target.value })
              }
              onPaste={(event) => editor.pasteInto("value")(row.id, event)}
            />
            <div className="col-start-2 flex flex-col gap-1 empty:hidden @max-[30rem]/rows:col-start-1">
              {notesFor(editor, existingVariables, row)}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {editor.rows.map((row, index) => {
        const problem = editor.showErrors ? editor.problemOf(row) : undefined;
        return (
          <div
            key={row.id}
            data-slot="variable-row"
            className={cx(
              "flex flex-col gap-3",
              index > 0 && "border-t-hairline border-border-1 pt-4",
            )}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex min-h-6 items-center justify-between">
                <Label htmlFor={`${idPrefix}-key-${row.id}`}>Key</Label>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Remove variable"
                  disabled={editor.rows.length === 1 && !isFilled(row)}
                  onClick={() => editor.remove(row.id)}
                >
                  <Icon name="x" />
                </Button>
              </div>
              <Input
                id={`${idPrefix}-key-${row.id}`}
                size="base"
                aria-invalid={problem !== undefined || undefined}
                autoComplete="off"
                spellCheck={false}
                placeholder="CLIENT_KEY"
                value={row.name}
                onChange={(event) => {
                  const name = event.target.value;
                  editor.update(row.id, {
                    name,
                    ...(row.descriptionTouched
                      ? {}
                      : { description: existingVariables.get(name) ?? "" }),
                  });
                }}
                onPaste={(event) => editor.pasteInto("name")(row.id, event)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${idPrefix}-value-${row.id}`}>Value</Label>
              <Textarea
                id={`${idPrefix}-value-${row.id}`}
                rows={1}
                size="base"
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter a value"
                className="max-h-40"
                value={row.value}
                onChange={(event) =>
                  editor.update(row.id, { value: event.target.value })
                }
                onPaste={(event) => editor.pasteInto("value")(row.id, event)}
              />
            </div>
            {descriptions && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-description-${row.id}`}>
                  Description
                  <span className="font-normal text-muted-foreground-2">
                    Optional
                  </span>
                </Label>
                <Input
                  id={`${idPrefix}-description-${row.id}`}
                  size="base"
                  autoComplete="off"
                  placeholder="When should Capy use this"
                  value={row.description}
                  onChange={(event) =>
                    editor.update(row.id, {
                      description: event.target.value,
                      descriptionTouched: true,
                    })
                  }
                />
              </div>
            )}
            {notesFor(editor, existingVariables, row)}
          </div>
        );
      })}
    </div>
  );
}
