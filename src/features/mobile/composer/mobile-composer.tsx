import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import { Button } from "@/primitives/button";
import { drawerIconSlotClass, MobileDrawerRow } from "../drawers/mobile-drawer";
import { MobileIcon } from "../thread/mobile-icon";
import {
  type ComposerCommand,
  composerMenuFor,
  filterCommands,
  filterMentions,
  type MentionCategory,
} from "./composer-menus";

const optionClass =
  "relative flex h-(--h-menu-row) w-full min-w-0 cursor-pointer items-center gap-2 rounded px-2 text-left text-sm font-normal text-foreground outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-sm) data-[highlighted]:bg-[var(--menu-row-highlight,var(--popover-hover))]";

const listboxClass =
  "flex w-80 flex-col overflow-hidden rounded-(--radius-overlay) border-(length:--border-width-hairline) border-border-2 bg-popover p-1 text-foreground shadow-overlay";

export type MobileComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (text: string) => void;
  /** The agent is running: the primary button stops it. */
  working?: boolean;
  onStop?: () => void;
  onVoice?: () => void;
  onCommand?: (command: ComposerCommand) => void;
  onMention?: (category: MentionCategory) => void;
  /** "Add to message" drawer, with its trigger. */
  addMenu?: ReactNode;
  /** Model drawer, with its trigger. */
  modelMenu?: ReactNode;
  placeholder?: string;
};

/** The phone composer: text, add and model drawers, voice and send or stop, with the / and @ menus. */
export function MobileComposer({
  value,
  onValueChange,
  onSend,
  working = false,
  onStop,
  onVoice,
  onCommand,
  onMention,
  addMenu,
  modelMenu,
  placeholder = "Ask anything",
}: MobileComposerProps) {
  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const menu =
    dismissed === value ? { kind: "none" as const } : composerMenuFor(value);
  const commands = menu.kind === "command" ? filterCommands(menu.query) : [];
  const mentions = menu.kind === "mention" ? filterMentions(menu.query) : [];
  const count = menu.kind === "command" ? commands.length : mentions.length;
  const active = count === 0 ? -1 : Math.min(highlight, count - 1);
  const hasText = value.trim() !== "";

  const change = (next: string) => {
    setHighlight(0);
    setDismissed(null);
    onValueChange(next);
  };
  const runCommand = (command: ComposerCommand) => {
    change("");
    onCommand?.(command);
  };
  const pickMention = (category: MentionCategory) => {
    if (menu.kind !== "mention") return;
    change(value.slice(0, menu.start));
    onMention?.(category);
  };
  const send = () => {
    if (!hasText) return;
    onSend(value.trim());
    change("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (count > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setHighlight((active + step + count) % count);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const command = commands[active];
        const mention = mentions[active];
        if (command) runCommand(command);
        else if (mention) pickMention(mention);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDismissed(value);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div data-slot="composer" className="relative">
      {menu.kind === "command" && commands.length > 0 && (
        <div
          data-slot="composer-command-menu"
          className="absolute bottom-full left-5 z-(--z-overlay-content) mb-2 outline-none"
        >
          <div
            role="listbox"
            aria-label="Commands"
            className={cx(listboxClass, "max-h-80")}
          >
            <div className="-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1">
              {commands.map((command, index) => (
                <div
                  key={command.id}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === active}
                  data-highlighted={index === active ? "" : undefined}
                  className={optionClass}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => runCommand(command)}
                  onKeyDown={undefined}
                >
                  <span className={drawerIconSlotClass}>
                    <MobileIcon name={command.icon} />
                  </span>
                  <span className="min-w-0 truncate">{command.label}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-2 text-sm font-normal text-muted-foreground-1">
                    {command.slash ?? (
                      <MobileIcon
                        name="chevron-right"
                        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {menu.kind === "mention" && mentions.length > 0 && (
        <div
          data-slot="composer-mention-menu"
          className="absolute bottom-full left-5 z-(--z-overlay-content) mb-2 outline-none"
        >
          <div
            role="listbox"
            aria-label="Mentions"
            className={cx(listboxClass, "max-h-120")}
          >
            <div className="-m-1 min-h-0 overflow-x-hidden overflow-y-auto p-1">
              {mentions.map((category, index) => (
                <div
                  key={category.id}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === active}
                  data-highlighted={index === active ? "" : undefined}
                  className={cx(optionClass, "h-auto min-h-9 py-1")}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => pickMention(category)}
                  onKeyDown={undefined}
                >
                  <MobileDrawerRow
                    icon={<MobileIcon name={category.icon} />}
                    label={category.label}
                    description={category.description}
                    trailing={
                      <MobileIcon
                        name="chevron-right"
                        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
                      />
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="relative">
        <textarea
          aria-label="Message"
          rows={1}
          value={value}
          placeholder={placeholder}
          className="field-sizing-content max-h-56 min-h-6 w-full resize-none overflow-y-auto overscroll-contain bg-transparent p-1 text-base font-normal text-foreground outline-none [overflow-wrap:anywhere] placeholder:text-muted-foreground-3"
          onChange={(event) => change(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="-mx-1 -mb-1 flex items-center gap-2 pt-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          {addMenu}
          <span className="ml-1 flex min-w-0 items-center gap-0.5">
            {modelMenu}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant={hasText || working ? "ghost" : "solid"}
            intent={hasText || working ? "neutral" : "accent"}
            size="icon-sm"
            aria-label="Voice input"
            onClick={onVoice}
          >
            <MobileIcon name="microphone" />
          </Button>
          {working ? (
            <Button
              intent="accent"
              size="icon-sm"
              aria-label="Stop run"
              onClick={onStop}
            >
              <MobileIcon name="stop" />
            </Button>
          ) : (
            hasText && (
              <Button
                intent="accent"
                size="icon-sm"
                aria-label="Send"
                onClick={send}
              >
                <MobileIcon name="arrow-up" />
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export type MobileComposerAddTriggerProps = Omit<
  ComponentProps<typeof Button>,
  "children"
>;

/** The "+" that opens the add drawer. */
export function MobileComposerAddTrigger(props: MobileComposerAddTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Add to message"
      {...props}
    >
      <MobileIcon name="plus" />
    </Button>
  );
}

export type MobileComposerModelTriggerProps = Omit<
  ComponentProps<typeof Button>,
  "children"
> & { label: string; icon?: string };

/** The model name button that opens the model drawer. */
export function MobileComposerModelTrigger({
  label,
  icon = "agent",
  ...props
}: MobileComposerModelTriggerProps) {
  return (
    <Button variant="ghost" size="auto-sm" aria-label="Model" {...props}>
      <span className="-ml-0.5 flex shrink-0 text-primary-ink">
        <MobileIcon name={icon} />
      </span>
      <span>{label}</span>
      <MobileIcon name="chevron-down" className="text-muted-foreground-3" />
    </Button>
  );
}
