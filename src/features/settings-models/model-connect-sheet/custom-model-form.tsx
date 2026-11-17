import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import { Switch } from "@/primitives/switch";
import { type DiscoveredModel, tokenFields } from "./helpers.ts";
import { cx, Field } from "./ui.tsx";

export type CustomModelInitial = {
  readonly id?: string;
  readonly name?: string;
  readonly context?: number;
  readonly output?: number;
  readonly reasoning?: boolean;
  readonly images?: boolean;
  readonly compactAt?: number;
};

export type CustomModelDraft = {
  readonly id: string;
  readonly name?: string;
  readonly context: number;
  readonly output?: number;
  readonly reasoning: boolean;
  readonly images: boolean;
  readonly compactAt?: number;
};

export type CustomModelFormProps = {
  connection: string;
  initial: CustomModelInitial;
  listed: ReadonlyArray<DiscoveredModel>;
  idProblem: (id: string) => string | undefined;
  compactable: boolean;
  editing: boolean;
  onSubmit: (model: CustomModelDraft) => void;
  onCancel: () => void;
};

export const revealNearest = (element: HTMLElement | null) =>
  element?.scrollIntoView?.({ block: "nearest" });

const formatTokens = (tokens: number | undefined) =>
  tokens?.toLocaleString("en-US") ?? "";

export function CustomModelForm({
  connection,
  initial,
  listed,
  idProblem,
  compactable,
  editing,
  onSubmit,
  onCancel,
}: CustomModelFormProps) {
  const [id, setId] = useState(initial.id ?? "");
  const [name, setName] = useState(initial.name ?? "");
  const [contextText, setContextText] = useState(() =>
    formatTokens(initial.context),
  );
  const [outputText, setOutputText] = useState(() =>
    formatTokens(initial.output),
  );
  const [compactText, setCompactText] = useState(() =>
    formatTokens(initial.compactAt),
  );
  const [reasoning, setReasoning] = useState(initial.reasoning === true);
  const [images, setImages] = useState(initial.images === true);
  const [picked, setPicked] = useState<DiscoveredModel>();
  const trimmedId = id.trim();
  const problem =
    editing || trimmedId === "" ? undefined : idProblem(trimmedId);
  const tokens = tokenFields(contextText, outputText, compactText);
  const ready =
    trimmedId !== "" &&
    problem === undefined &&
    tokens.context !== undefined &&
    tokens.outputProblem === undefined &&
    (!compactable || tokens.compactProblem === undefined);
  const suggestions = editing
    ? []
    : listed.filter((row) => row.providerModelId !== trimmedId).slice(0, 6);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready || tokens.context === undefined) return;
    onSubmit({
      id: trimmedId,
      name: name.trim() === "" ? undefined : name.trim(),
      context: tokens.context,
      output: tokens.output,
      reasoning,
      images,
      compactAt: compactable ? tokens.compactAt : initial.compactAt,
    });
  };
  const cancelOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
    }
  };
  return (
    <form
      ref={revealNearest}
      className="my-1 flex scroll-mb-12 flex-col gap-3 rounded-(--radius-inner) border-hairline border-border-1 p-3"
      onSubmit={submit}
      onKeyDown={cancelOnEscape}
    >
      <span className="text-sm font-medium">
        {editing
          ? `Edit ${initial.name ?? initial.id ?? "model"}`
          : "New custom model"}
      </span>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Model ID"
          problem={problem}
          hint={
            editing
              ? "Remove the model to change its id"
              : "Sent as the model in each request"
          }
        >
          <Input
            size="sm"
            autoFocus={!editing}
            autoComplete="off"
            spellCheck={false}
            disabled={editing}
            placeholder="qwen3-coder-30b"
            value={id}
            onChange={(event) => setId(event.currentTarget.value)}
          />
        </Field>
        <Field label="Display name" hint="Shown in the model picker">
          <Input
            size="sm"
            autoComplete="off"
            placeholder={trimmedId === "" ? "Optional" : trimmedId}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </Field>
      </div>
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-normal text-muted-foreground-2">
            {`Listed by ${connection}`}
          </span>
          {suggestions.map((row) => (
            <Button
              key={row.providerModelId}
              type="button"
              variant="soft"
              size="xs"
              onClick={() => {
                setId(row.providerModelId);
                if (name.trim() === "" || name === picked?.name)
                  setName(row.name ?? "");
                if (
                  contextText.trim() === "" ||
                  contextText === formatTokens(picked?.context)
                )
                  setContextText(formatTokens(row.context));
                setPicked(row);
              }}
            >
              {row.providerModelId}
            </Button>
          ))}
        </div>
      ) : null}
      <div
        className={cx(
          "grid gap-3",
          compactable ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        <Field label="Context window" problem={tokens.contextProblem}>
          <Input
            inputMode="numeric"
            size="sm"
            autoFocus={editing}
            autoComplete="off"
            placeholder="Tokens"
            value={contextText}
            onChange={(event) => setContextText(event.currentTarget.value)}
          />
        </Field>
        <Field label="Max output" problem={tokens.outputProblem}>
          <Input
            inputMode="numeric"
            size="sm"
            autoComplete="off"
            placeholder={tokens.outputPlaceholder.toLocaleString("en-US")}
            value={outputText}
            onChange={(event) => setOutputText(event.currentTarget.value)}
          />
        </Field>
        {compactable ? (
          <Field label="Compact at" problem={tokens.compactProblem}>
            <Input
              inputMode="numeric"
              size="sm"
              autoComplete="off"
              placeholder={
                tokens.context === undefined
                  ? "80% of context"
                  : tokens.defaultCompactAt.toLocaleString("en-US")
              }
              value={compactText}
              onChange={(event) => setCompactText(event.currentTarget.value)}
            />
          </Field>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm">Reasoning</span>
          <span className="text-xs font-normal text-muted-foreground-2">
            Sends a reasoning effort with each request
          </span>
        </div>
        <Switch
          checked={reasoning}
          aria-label="Reasoning"
          onCheckedChange={setReasoning}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm">Image input</span>
          <span className="text-xs font-normal text-muted-foreground-2">
            Sends images to the model instead of a text description
          </span>
        </div>
        <Switch
          checked={images}
          aria-label="Image input"
          onCheckedChange={setImages}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!ready}>
          {editing ? "Save model" : "Add model"}
        </Button>
      </div>
    </form>
  );
}
