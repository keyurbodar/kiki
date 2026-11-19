import { cx } from "class-variance-authority";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Crown,
  Files,
  issueMenuIcon,
  Microphone,
  Paperclip,
  People,
  PlusMedium,
  PullRequest,
  Sparkle,
  Threads,
} from "@/components/issue-parts";
import { Button } from "@/primitives/button";
import { Kbd } from "@/primitives/kbd";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";

/** The mention sources the "+" menu offers, in Capy's order. */
export const composerSources = [
  { category: "people", label: "People", icon: People },
  { category: "captains", label: "Captains", icon: Crown },
  { category: "threads", label: "Threads", icon: Threads },
  { category: "prs", label: "Pull requests", icon: PullRequest },
  { category: "skills", label: "Skills", icon: Sparkle },
  { category: "files", label: "Files", icon: Files },
] as const;

/** "Add to message": upload an attachment or start a mention. */
export function ComposerPlusMenu({
  onPickCategory,
}: {
  onPickCategory: (category: string) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Add to message"
          />
        }
      >
        <PlusMedium />
      </MenuTrigger>
      <MenuContent className="w-max min-w-56 max-w-sm" finalFocus={false}>
        <MenuItem disabled>
          <span className={issueMenuIcon}>
            <Paperclip />
          </span>
          <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap">
            Upload attachment
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1">
            <Kbd>⌘/</Kbd>
          </span>
        </MenuItem>
        <MenuSeparator />
        {composerSources.map((source) => (
          <MenuItem
            key={source.category}
            onClick={() => onPickCategory(source.category)}
          >
            <span className={issueMenuIcon}>
              <source.icon />
            </span>
            {source.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

/**
 * The issue page's message box: a plain-text stand-in with Capy's composer
 * frame, "+" menu, voice and send controls, until the shared composer lands.
 */
export function IssueComposer({
  placeholder,
  submitLabel,
  defaultValue = "",
  autoFocus,
  disabled,
  editorClassName,
  quote,
  onSubmit,
}: {
  placeholder: string;
  submitLabel: string;
  defaultValue?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  editorClassName?: string;
  /** A passage quoted from the issue, appended and focused when it arrives. */
  quote?: { text: string; nonce: number } | null;
  onSubmit: (text: string) => Promise<boolean> | undefined;
}) {
  const [text, setText] = useState(defaultValue);
  const input = useRef<HTMLTextAreaElement>(null);
  const seeded = useRef<number | null>(null);
  useEffect(() => {
    if (quote == null || seeded.current === quote.nonce) return;
    seeded.current = quote.nonce;
    const block = quote.text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    setText((current) =>
      current.trim() === "" ? `${block}\n\n` : `${current}\n\n${block}\n\n`,
    );
    input.current?.focus();
    input.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [quote]);
  const empty = text.trim() === "";
  const submit = () => {
    if (empty || disabled) return;
    void onSubmit(text.trim())?.then((sent) => {
      if (sent && defaultValue === "") setText("");
    });
  };
  return (
    <div
      data-slot="composer"
      className="flex flex-col rounded-(--radius-card) bg-(--composer-ground) shadow-(--sh-composer)"
    >
      <textarea
        ref={input}
        aria-label={placeholder}
        placeholder={placeholder}
        value={text}
        disabled={disabled}
        // biome-ignore lint/a11y/noAutofocus: Capy focuses the box it opens for editing
        autoFocus={autoFocus}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
        className={cx(
          "field-sizing-content w-full resize-none bg-transparent px-4 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground-3",
          editorClassName,
        )}
      />
      <div className="flex items-center gap-1 p-2">
        <ComposerPlusMenu
          onPickCategory={(category) => setText(`${text}@${category}:`)}
        />
        <span className="min-w-0 flex-1" />
        <Button variant="ghost" size="icon-sm" aria-label="Voice input">
          <Microphone />
        </Button>
        {!empty && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={submitLabel}
            disabled={disabled}
            onClick={submit}
          >
            <ArrowUp />
          </Button>
        )}
      </div>
    </div>
  );
}
