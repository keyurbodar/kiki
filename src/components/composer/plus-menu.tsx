import { useRef } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  MenuContent,
  MenuSeparator,
  MenuTrigger,
  menuRowVariants,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { MENU_LABEL, MENU_LEADING, MENU_TRAILING } from "./menu-surface";
import type { MentionSource } from "./types";

export type PlusMenuProps = {
  sources: MentionSource[];
  onPickCategory: (category: string) => void;
  onAttach?: (files: File[]) => void;
  onNewSideThread?: () => void;
  newSideThreadShortcut?: string | null;
  attachShortcut?: string | null;
  environmentVariables?: { stagedCount: number; onOpen: () => void };
};

const ROW = menuRowVariants();

export const plusMenuLabel = (staged: number) =>
  staged > 0
    ? `Add to message, ${staged} environment ${staged === 1 ? "variable" : "variables"} staged`
    : "Add to message";

export function PlusMenu({
  sources,
  onPickCategory,
  onAttach,
  onNewSideThread,
  newSideThreadShortcut,
  attachShortcut,
  environmentVariables,
}: PlusMenuProps) {
  const input = useRef<HTMLInputElement>(null);
  const staged = environmentVariables?.stagedCount ?? 0;
  return (
    <>
      <ResponsiveMenu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative w-(--h-control-sm)!"
              aria-label={plusMenuLabel(staged)}
            >
              <Icon name="plus-medium" size="sm" />
              {staged > 0 ? (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-2xs font-medium text-primary-foreground tabular-nums"
                >
                  {staged}
                </span>
              ) : null}
            </Button>
          }
        />
        <MenuContent className="w-max min-w-56 max-w-sm" finalFocus={false}>
          {onNewSideThread !== undefined ? (
            <>
              <ResponsiveMenuItem className={ROW} onClick={onNewSideThread}>
                <span className={MENU_LEADING}>
                  <Icon name="chat-bubbles" />
                </span>
                <span className={MENU_LABEL}>New side thread</span>
                {newSideThreadShortcut ? (
                  <span className={MENU_TRAILING}>{newSideThreadShortcut}</span>
                ) : null}
              </ResponsiveMenuItem>
              <MenuSeparator />
            </>
          ) : null}
          <ResponsiveMenuItem
            className={ROW}
            disabled={onAttach === undefined}
            onClick={() => input.current?.click()}
          >
            <span className={MENU_LEADING}>
              <Icon name="paperclip-1" />
            </span>
            <span className={MENU_LABEL}>Upload attachment</span>
            {onAttach !== undefined && attachShortcut ? (
              <span className={MENU_TRAILING}>{attachShortcut}</span>
            ) : null}
          </ResponsiveMenuItem>
          {environmentVariables !== undefined ? (
            <ResponsiveMenuItem
              className={ROW}
              onClick={environmentVariables.onOpen}
            >
              <span className={MENU_LEADING}>
                <Icon name="key-1" />
              </span>
              Environment variables
            </ResponsiveMenuItem>
          ) : null}
          <MenuSeparator />
          {sources.map((source) => (
            <ResponsiveMenuItem
              key={source.category}
              className={ROW}
              onClick={() => onPickCategory(source.category)}
            >
              <span className={MENU_LEADING}>
                <source.icon />
              </span>
              {source.label}
            </ResponsiveMenuItem>
          ))}
        </MenuContent>
      </ResponsiveMenu>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          onAttach?.(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}
