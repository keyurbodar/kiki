import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Input } from "@/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  type CustomEmoji,
  type EmojiEntry,
  type EmojiGroup,
  filterEmojiGroups,
  groupTitle,
  matchCustomEmoji,
  useEmojiGroups,
  useFrequentEmoji,
} from "./emoji-data";

const tileClass = cx(
  "grid size-8 cursor-pointer place-items-center rounded select-none",
  "transition-colors duration-100 hover:bg-secondary",
  "outline-none focus-visible:outline-ring-inset",
);

const headingClass = "px-1 text-xs font-normal text-muted-foreground-2";

const gridClass = "-m-0.5 grid grid-cols-8 gap-0.5 p-0.5";

type EmojiGridProps = {
  title: string;
  emojis: ReadonlyArray<EmojiEntry>;
  onPick: (emoji: string) => void;
};

function EmojiGrid({ title, emojis, onPick }: EmojiGridProps) {
  return (
    <div className="flex flex-col gap-1 [content-visibility:auto] [contain-intrinsic-size:auto_var(--contain-intrinsic-emoji-group)]">
      <span className={headingClass}>{groupTitle(title)}</span>
      <div className={gridClass}>
        {emojis.map((entry) => (
          <button
            key={entry.emoji}
            type="button"
            aria-label={entry.name}
            title={entry.name}
            className={cx(tileClass, "text-base")}
            onClick={() => onPick(entry.emoji)}
          >
            {entry.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export type EmojiPickerProps = Omit<ComponentProps<"div">, "onSubmit"> & {
  /** Emoji groups; when omitted the picker loads Unicode's groups itself. */
  groups?: ReadonlyArray<EmojiGroup> | null;
  /** Recently used emoji; when omitted the picker reads Capy's stored list. */
  frequent?: ReadonlyArray<string>;
  include?: (emoji: string) => boolean;
  onPick?: (emoji: string) => void;
  custom?: {
    entries: ReadonlyArray<CustomEmoji>;
    onPick: (name: string) => void;
  };
  /** Enter submits the typed name; return an error to show it. */
  onSubmit?: (name: string) => string | undefined;
};

/** Capy's EmojiPanel: search, workspace emoji, frequently used and every group. */
export function EmojiPicker({
  groups: groupsProp,
  frequent: frequentProp,
  include,
  onPick,
  custom,
  onSubmit,
  className,
  ...props
}: EmojiPickerProps) {
  const loaded = useEmojiGroups(groupsProp === undefined);
  const stored = useFrequentEmoji();
  const groups = groupsProp === undefined ? loaded : groupsProp;
  const frequent = (frequentProp ?? stored.frequent).filter(
    (emoji) => include === undefined || include(emoji),
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [shown, setShown] = useState(1);
  const needle = query.trim().toLowerCase();
  const customMatches = matchCustomEmoji(custom?.entries ?? [], needle);
  const visible =
    groups === null ? null : filterEmojiGroups(groups, needle, include);

  useEffect(() => {
    if (visible === null || needle !== "" || shown >= visible.length) return;
    const timer = window.setTimeout(() => setShown((count) => count + 1), 16);
    return () => window.clearTimeout(timer);
  }, [visible, needle, shown]);

  const pick = (emoji: string) => {
    if (frequentProp === undefined) stored.remember(emoji);
    onPick?.(emoji);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || onSubmit === undefined || query.trim() === "")
      return;
    event.preventDefault();
    const result = onSubmit(query.trim());
    setError(result);
    if (result === undefined) setQuery("");
  };

  return (
    <div
      data-slot="emoji-picker"
      className={cx("flex min-h-0 flex-1 flex-col gap-2", className)}
      {...props}
    >
      <Input
        size="sm"
        placeholder={
          onSubmit === undefined ? "Search emoji" : "Search or type a name"
        }
        aria-label="Search emoji"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setError(undefined);
        }}
        onKeyDown={onKeyDown}
      />
      {error === undefined ? null : (
        <p className="px-1 text-xs font-normal text-destructive">{error}</p>
      )}
      <div className="flex max-h-72 min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain md:scroll-fade-y">
        {visible === null ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm font-normal text-muted-foreground-2">
            <DotGridIcon size="sm" />
            Loading emoji
          </div>
        ) : (
          <>
            {custom !== undefined && customMatches.length > 0 ? (
              <div className="flex flex-col gap-1">
                <span className={headingClass}>Workspace</span>
                <div className={gridClass}>
                  {customMatches.map((entry) => (
                    <button
                      key={entry.name}
                      type="button"
                      aria-label={entry.name}
                      title={`:${entry.name}:`}
                      className={tileClass}
                      onClick={() => custom.onPick(entry.name)}
                    >
                      <img
                        src={entry.url}
                        alt=""
                        className="size-5 object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {needle === "" && frequent.length > 0 ? (
              <EmojiGrid
                title="Frequently used"
                emojis={frequent.map((emoji) => ({ emoji, name: emoji }))}
                onPick={pick}
              />
            ) : null}
            {visible.length === 0 && customMatches.length === 0 ? (
              <p className="p-3 text-center text-sm font-normal text-muted-foreground-2">
                No emoji match
              </p>
            ) : (
              (needle === "" ? visible.slice(0, shown) : visible).map(
                (group) => (
                  <EmojiGrid
                    key={group.name}
                    title={group.name}
                    emojis={group.emojis}
                    onPick={pick}
                  />
                ),
              )
            )}
            {needle === "" && visible.length > shown ? (
              <div className="flex items-center justify-center py-3">
                <DotGridIcon size="sm" />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export type EmojiPickerPopoverProps = {
  onPick: (emoji: string) => void;
  clear?: { label: string; onClear: () => void };
  include?: (emoji: string) => boolean;
  onOpen?: () => void;
  children: ReactElement;
  defaultOpen?: boolean;
};

/** Capy's EmojiPickerPopover: the picker in a popover that closes on pick. */
export function EmojiPickerPopover({
  onPick,
  clear,
  include,
  onOpen,
  children,
  defaultOpen = false,
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(defaultOpen);
  const groups = useEmojiGroups(open);
  const { frequent, remember } = useFrequentEmoji();
  useEffect(() => {
    if (open) onOpen?.();
  }, [open, onOpen]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent align="start" className="w-80 gap-2 p-2">
        {clear === undefined ? null : (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => {
              clear.onClear();
              setOpen(false);
            }}
          >
            {clear.label}
          </Button>
        )}
        <EmojiPicker
          groups={groups}
          frequent={frequent}
          include={include}
          onPick={(emoji) => {
            remember(emoji);
            onPick(emoji);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
