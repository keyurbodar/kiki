import { type ComponentProps, type ReactNode, type Ref, useMemo } from "react";
import {
  Composer,
  type ComposerHandle,
  type ComposerPayload,
  type ComposerVoice,
} from "@/components/composer";
import type { ComposerCommandId } from "@/features/composer/composer-commands";
import { Button } from "@/primitives/button";
import { MobileIcon } from "../thread/mobile-icon";
import { composerCommands, mentionSources } from "./composer-catalog";

export type MobileComposerProps = {
  ref?: Ref<ComposerHandle>;
  /** The text the draft starts with; the Composer owns it from then on. */
  defaultValue?: string;
  /** The draft, as it changes. */
  onChange?: (payload: ComposerPayload) => void;
  /** The trimmed draft, on send. */
  onSend: (text: string) => void;
  /** The agent is running: the primary button stops it. */
  working?: boolean;
  onStop?: () => void;
  /** Starts voice input. */
  onVoice?: () => void;
  onCommand?: (command: ComposerCommandId) => void;
  /** "Add to message" drawer, with its trigger. */
  addMenu?: ReactNode;
  /** Model drawer, with its trigger. */
  modelMenu?: ReactNode;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

const idleVoice = (start: () => void): ComposerVoice => ({
  state: { phase: "idle" },
  supported: true,
  start,
  cancel: () => undefined,
  accept: () => undefined,
});

/** The phone composer: the shared Composer with the phone's commands, mentions and triggers. */
export function MobileComposer({
  ref,
  defaultValue,
  onChange,
  onSend,
  working = false,
  onStop,
  onVoice,
  onCommand,
  addMenu,
  modelMenu,
  placeholder = "Ask anything",
  autoFocus = false,
  className,
}: MobileComposerProps) {
  const initial = useMemo(
    () => ({ text: defaultValue ?? "", mentions: [], files: [] }),
    [defaultValue],
  );
  const commands = useMemo(
    () => composerCommands((command) => onCommand?.(command)),
    [onCommand],
  );
  const sources = useMemo(mentionSources, []);
  const voice = useMemo(
    () => (onVoice === undefined ? undefined : idleVoice(onVoice)),
    [onVoice],
  );
  return (
    <Composer
      ref={ref}
      ariaLabel="Message"
      submitLabel="Send"
      placeholder={placeholder}
      className={className}
      defaultValue={initial}
      onChange={onChange}
      onSubmit={(payload) => {
        const text = payload.text.trim();
        if (text === "") return false;
        onSend(text);
      }}
      commands={commands}
      sources={sources}
      voice={voice}
      stop={working && onStop !== undefined ? { onStop } : undefined}
      autoFocus={autoFocus}
      leftControls={
        <>
          {addMenu}
          <span className="ml-1 flex min-w-0 items-center gap-0.5">
            {modelMenu}
          </span>
        </>
      }
    />
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
