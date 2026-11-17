import type { ComponentProps, ReactNode } from "react";
import {
  CommandMenuFooter,
  CommandMenuInput,
  type CommandMenuInputProps,
  CommandMenuItem,
  type CommandMenuItemProps,
} from "@/primitives/command-menu";
import { Kbd } from "@/primitives/kbd";
import {
  paletteFooterClass,
  paletteHintClass,
  paletteInputClass,
  paletteInputRowClass,
  paletteInputTrailingClass,
  paletteItemVariants,
  paletteKbdClass,
  paletteKeysClass,
  paletteSeparatorClass,
} from "./classes";

const join = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function PaletteKeys({
  keys,
}: {
  keys: string | ReadonlyArray<string>;
}) {
  const list = typeof keys === "string" ? [keys] : keys;
  return (
    <span className={paletteKeysClass}>
      {list.map((key, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: keys can repeat
        <Kbd key={index} variant="chip" className={paletteKbdClass}>
          {key}
        </Kbd>
      ))}
    </span>
  );
}

export type PaletteHintProps = {
  keys: string | ReadonlyArray<string>;
  label: string;
};

export function PaletteHint({ keys, label }: PaletteHintProps) {
  return (
    <span className={paletteHintClass}>
      <PaletteKeys keys={keys} />
      {label}
    </span>
  );
}

export type PaletteFooterProps = ComponentProps<"div">;

export function PaletteFooter({ className, ...props }: PaletteFooterProps) {
  return (
    <CommandMenuFooter
      className={join(paletteFooterClass, className)}
      {...props}
    />
  );
}

export type PaletteInputProps = CommandMenuInputProps & {
  trailing?: ReactNode;
};

export const isPaletteToggle = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) &&
  !event.altKey &&
  !event.shiftKey &&
  event.key.toLowerCase() === "k";

export function PaletteInput({
  className,
  onKeyDown,
  trailing,
  ...props
}: PaletteInputProps) {
  return (
    <>
      <div className={paletteInputRowClass}>
        <CommandMenuInput
          autoFocus
          className={join(
            paletteInputClass,
            typeof className === "string" && className,
          )}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              isPaletteToggle(event.nativeEvent) ||
              event.nativeEvent.isComposing
            )
              return;
            if (event.key !== "Escape") event.stopPropagation();
          }}
          {...props}
        />
        {trailing === undefined ? null : (
          <div className={paletteInputTrailingClass}>{trailing}</div>
        )}
      </div>
      <div className={paletteSeparatorClass} />
    </>
  );
}

export type PaletteItemProps = Omit<CommandMenuItemProps, "className"> & {
  className?: string;
  intent?: "danger";
};

export function PaletteItem({
  className,
  intent,
  value,
  ...props
}: PaletteItemProps) {
  return (
    <CommandMenuItem
      data-intent={intent}
      data-value={typeof value === "string" ? value : undefined}
      value={value}
      className={paletteItemVariants({
        intent: intent ?? "neutral",
        className,
      })}
      {...props}
    />
  );
}
