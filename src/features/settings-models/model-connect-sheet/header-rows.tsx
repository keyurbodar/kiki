import {
  type KeyboardEvent,
  type Ref,
  type SyntheticEvent,
  useRef,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  MenuContent,
  MenuSearchRow,
  MenuTrigger,
  menuRowVariants,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { PlusGlyph } from "../model-routing/glyphs.tsx";
import {
  type HeaderDraft,
  type HeaderTag,
  headerProblem,
  headerTags,
  isHeaderTag,
  maxHeaders,
  nearestEdge,
  nextHeaderId,
  previewValue,
  tagDescriptions,
  tagRanges,
  valueParts,
} from "./helpers.ts";
import { cx, searchInputClass, TrashGlyph } from "./ui.tsx";

const keepMenuKeys = (event: KeyboardEvent<HTMLInputElement>) => {
  if (
    event.key !== "Escape" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  )
    event.stopPropagation();
};

export type TagPickerProps = { onPick: (tag: HeaderTag) => void };

export function TagPicker({ onPick }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const tags = headerTags.filter(
    (tag) =>
      needle === "" ||
      tag.includes(needle) ||
      tagDescriptions[tag].toLowerCase().includes(needle),
  );
  return (
    <ResponsiveMenu
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <MenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Insert tag">
            <Icon name="code-brackets" />
          </Button>
        }
      />
      <MenuContent align="end" className="w-80">
        <MenuSearchRow>
          <input
            className={searchInputClass}
            aria-label="Search tags"
            placeholder="Search tags"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={keepMenuKeys}
          />
        </MenuSearchRow>
        {tags.length === 0 ? (
          <div className="px-2 py-3 text-center text-sm font-normal text-muted-foreground-2">
            No results
          </div>
        ) : (
          tags.map((tag) => (
            <ResponsiveMenuItem
              key={tag}
              className={menuRowVariants({ density: "rich" })}
              onClick={() => onPick(tag)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm text-foreground">{`\${${tag}}`}</span>
                <span className="truncate text-xs font-normal text-muted-foreground-2">
                  {tagDescriptions[tag]}
                </span>
              </span>
            </ResponsiveMenuItem>
          ))
        )}
      </MenuContent>
    </ResponsiveMenu>
  );
}

export type HeaderValueInputProps = {
  value: string;
  invalid: boolean;
  label: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
};

export function HeaderValueInput({
  value,
  invalid,
  label,
  placeholder = "Value",
  inputRef,
  onChange,
}: HeaderValueInputProps) {
  const overlay = useRef<HTMLSpanElement>(null);
  const ranges = tagRanges(value);
  const snapSelection = (input: HTMLInputElement) => {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    const inside = (caret: number) =>
      ranges.find((range) => range.start < caret && caret < range.end);
    const from = inside(start);
    const to = inside(end);
    if (from === undefined && to === undefined) return;
    const anchor =
      from === undefined
        ? start
        : start === end
          ? nearestEdge(start, from)
          : from.start;
    const focus = to === undefined ? end : start === end ? anchor : to.end;
    input.setSelectionRange(anchor, focus);
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const input = event.currentTarget;
    const caret = input.selectionStart ?? 0;
    if (caret !== (input.selectionEnd ?? caret)) return;
    const before = ranges.find((range) => range.end === caret);
    const after = ranges.find((range) => range.start === caret);
    if (event.key === "ArrowLeft" && before !== undefined) {
      event.preventDefault();
      input.setSelectionRange(before.start, before.start);
      return;
    }
    if (event.key === "ArrowRight" && after !== undefined) {
      event.preventDefault();
      input.setSelectionRange(after.end, after.end);
      return;
    }
    const removed =
      event.key === "Backspace"
        ? before
        : event.key === "Delete"
          ? after
          : undefined;
    if (removed === undefined) return;
    event.preventDefault();
    onChange(`${value.slice(0, removed.start)}${value.slice(removed.end)}`);
    requestAnimationFrame(() =>
      input.setSelectionRange(removed.start, removed.start),
    );
  };
  return (
    <span className="relative min-w-0">
      <Input
        font="mono"
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid}
        className="text-transparent caret-foreground"
        value={value}
        ref={inputRef}
        onChange={(event) => onChange(event.currentTarget.value)}
        onSelect={(event: SyntheticEvent<HTMLInputElement>) =>
          snapSelection(event.currentTarget)
        }
        onScroll={(event) => {
          if (overlay.current !== null)
            overlay.current.style.transform = `translateX(${-event.currentTarget.scrollLeft}px)`;
        }}
        onKeyDown={keyDown}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-2.5"
      >
        <span
          ref={overlay}
          className="flex shrink-0 items-center font-mono text-xs whitespace-pre text-foreground"
        >
          {valueParts(value).map((part) =>
            "tag" in part ? (
              <span
                key={part.start}
                style={{ width: `${part.width}ch` }}
                className="flex shrink-0"
              >
                <span
                  className={cx(
                    "inline-flex h-4.5 w-full items-center justify-center overflow-hidden rounded-(--radius-sm) border-hairline text-2xs leading-none",
                    isHeaderTag(part.tag)
                      ? "border-border-2 bg-secondary text-foreground"
                      : "border-destructive/40 bg-destructive/10 text-destructive",
                  )}
                >
                  {part.tag}
                </span>
              </span>
            ) : (
              <span key={part.start}>{part.text}</span>
            ),
          )}
        </span>
      </span>
    </span>
  );
}

export type HeaderRowsProps = {
  headers: ReadonlyArray<HeaderDraft>;
  recipient: string;
  onChange: (headers: Array<HeaderDraft>) => void;
};

export function HeaderRows({ headers, recipient, onChange }: HeaderRowsProps) {
  const inputs = useRef(new Map<number, HTMLInputElement>());
  const problems = headers.map((header) => headerProblem(header, headers));
  const named = headers.filter((header) => header.name.trim() !== "");
  const update = (id: number, patch: Partial<HeaderDraft>) =>
    onChange(
      headers.map((header) =>
        header.id === id ? { ...header, ...patch } : header,
      ),
    );
  const insertTag = (header: HeaderDraft, tag: HeaderTag) => {
    const input = inputs.current.get(header.id);
    const start = input?.selectionStart ?? header.value.length;
    const end = input?.selectionEnd ?? start;
    const text = `\${${tag}}`;
    update(header.id, {
      value: `${header.value.slice(0, start)}${text}${header.value.slice(end)}`,
    });
    if (input !== undefined)
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
      });
  };
  return (
    <>
      {headers.map((header, index) => {
        const problem = problems[index];
        const redacted = header.secret === true && header.value === "";
        return (
          <div key={header.id} className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
              <Input
                placeholder="Name"
                aria-label={`Header ${index + 1} name`}
                aria-invalid={problem?.field === "name"}
                value={header.name}
                onChange={(event) =>
                  update(header.id, { name: event.currentTarget.value })
                }
              />
              <HeaderValueInput
                label={`Header ${index + 1} value`}
                invalid={problem?.field === "value"}
                placeholder={redacted ? "Saved, type to replace" : "Value"}
                value={header.value}
                inputRef={(element) => {
                  if (element === null) inputs.current.delete(header.id);
                  else inputs.current.set(header.id, element);
                }}
                onChange={(value) =>
                  update(header.id, {
                    value,
                    secret: value === "" ? header.secret : undefined,
                  })
                }
              />
              <span className="flex items-center gap-0.5">
                <TagPicker onPick={(tag) => insertTag(header, tag)} />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove header"
                  onClick={() =>
                    onChange(headers.filter((other) => other.id !== header.id))
                  }
                >
                  <TrashGlyph />
                </Button>
              </span>
            </div>
            {problem === undefined ? null : (
              <p className="text-xs font-normal text-destructive">
                {problem.text}
              </p>
            )}
          </div>
        );
      })}
      {headers.length < maxHeaders ? (
        <Button
          variant="soft"
          size="sm"
          className="w-full"
          onClick={() =>
            onChange([
              ...headers,
              { id: nextHeaderId(headers), name: "", value: "" },
            ])
          }
        >
          <PlusGlyph />
          Add header
        </Button>
      ) : null}
      {named.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-(--radius-card) bg-secondary px-2.5 py-2 text-xs">
          <span className="font-normal text-muted-foreground-2">
            {`${recipient} will receive`}
          </span>
          <div className="flex flex-col gap-0.5">
            {named.map((header) => (
              <span key={header.id} className="truncate">
                <span className="text-foreground">{header.name.trim()}</span>
                {": "}
                {header.secret === true && header.value === ""
                  ? "the saved value"
                  : previewValue(header.value)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
