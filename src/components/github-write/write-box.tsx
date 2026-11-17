import { type FormEvent, type ReactNode, useState } from "react";
import { ArrowUpIcon } from "@/components/pull-view/icons";
import { Button } from "@/primitives/button";

const cx = (...parts: ReadonlyArray<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export type WriteBoxProps = {
  placeholder: string;
  submitLabel: string;
  defaultValue?: string;
  disabled?: boolean;
  submitLocked?: boolean;
  autoFocus?: boolean;
  clearOnSubmit?: boolean;
  leftControls?: ReactNode;
  editorClassName?: string;
  onSubmit: (text: string) => void;
};

export function WriteBox({
  placeholder,
  submitLabel,
  defaultValue = "",
  disabled = false,
  submitLocked = false,
  autoFocus = false,
  clearOnSubmit = true,
  leftControls,
  editorClassName,
  onSubmit,
}: WriteBoxProps) {
  const [text, setText] = useState(defaultValue);
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (submitLocked || disabled || text.trim() === "") return;
    onSubmit(text);
    if (clearOnSubmit) setText("");
  };
  return (
    <form
      data-slot="write-box"
      onSubmit={submit}
      className="flex flex-col rounded-(--radius-card) border-hairline border-border-1 bg-composer-ground shadow-plate"
    >
      <textarea
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        // biome-ignore lint/a11y/noAutofocus: the editor opens on an explicit edit action
        autoFocus={autoFocus}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            submit();
          }
        }}
        className={cx(
          "field-sizing-content max-h-96 w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground-3",
          editorClassName,
        )}
      />
      <div className="flex min-h-11 items-center gap-1 px-2 pb-1">
        {leftControls}
        <span className="min-w-0 flex-1" />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={submitLabel}
          disabled={disabled || submitLocked || text.trim() === ""}
        >
          <ArrowUpIcon className="size-(--icon-sm)" />
        </Button>
      </div>
    </form>
  );
}
