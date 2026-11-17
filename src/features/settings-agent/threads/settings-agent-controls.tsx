import { useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { SettingsPage } from "@/components/settings-page";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  InheritedMenu,
  InheritedMenuTrigger,
} from "@/primitives/inherited-menu";
import { Input } from "@/primitives/input";
import { MenuContent, MenuItem } from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  orgScopeHash,
  resolveNumberDraft,
  type SettingsAgentPageId,
  type SettingsScope,
  settingsAgentPageCopy,
} from "./agent-settings";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted";
export const menuCheckClass = "size-(--icon-sm) shrink-0 text-foreground";
const buttonIconClass = "size-(--icon-sm) shrink-0";

/** Capy's menu row body: label, optional description (rich density) and trailing content. */
export function MenuOption({
  label,
  description,
  trailing,
}: {
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        {description === undefined ? null : (
          <span className="text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      {trailing === undefined ? null : (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-muted-foreground-1">
          {trailing}
        </span>
      )}
    </>
  );
}

function InheritedTag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 text-xs text-muted-foreground-2">{children}</span>
  );
}

export type InheritedSelectOption<V extends string> = {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
  trailing?: ReactNode;
};

export type InheritedSelectProps<V extends string> = {
  value: V | undefined;
  inherits?: boolean;
  inherited?: V;
  inheritedLabel?: string;
  inheritedTag?: string;
  options: ReadonlyArray<InheritedSelectOption<V>>;
  variant?: ButtonVariants["variant"];
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (value: V | undefined) => void;
};

/**
 * Capy's InheritedMenu: a select whose empty value falls back to an inherited
 * one (the org default), shown with an "Org" tag. Built on the InheritedMenu
 * contract parts until P14 fills them with this API.
 */
export function InheritedSelect<V extends string>({
  value,
  inherits = false,
  inherited,
  inheritedLabel = "Org default",
  inheritedTag = "Org",
  options,
  variant = "solid",
  disabled = false,
  disabledReason,
  className,
  "aria-label": ariaLabel,
  onChange,
}: InheritedSelectProps<V>) {
  const usesInherited = inherits && value === undefined;
  const labelOf = (option: V | undefined) =>
    options.find((candidate) => candidate.value === option)?.label ?? "";
  const shown = usesInherited
    ? inherited === undefined
      ? inheritedLabel
      : labelOf(inherited)
    : labelOf(value ?? options[0]?.value);
  return (
    <InheritedMenu>
      <InheritedMenuTrigger
        render={
          <Button
            variant={variant}
            size="sm"
            className={className ?? "justify-between"}
            disabled={disabled}
            title={disabledReason}
            aria-label={ariaLabel}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{shown}</span>
          {usesInherited && inherited !== undefined ? (
            <InheritedTag>{inheritedTag}</InheritedTag>
          ) : null}
        </span>
        <Icon name="chevron-down-small" className={buttonIconClass} />
      </InheritedMenuTrigger>
      <MenuContent align="end">
        {inherits ? (
          <MenuItem onClick={() => onChange(undefined)}>
            <MenuOption
              label={inheritedLabel}
              trailing={
                <>
                  {inherited === undefined ? null : labelOf(inherited)}
                  {usesInherited ? (
                    <Icon name="checkmark-1" className={menuCheckClass} />
                  ) : null}
                </>
              }
            />
          </MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            disabled={option.disabled}
            density={option.description === undefined ? undefined : "rich"}
            onClick={() => onChange(option.value)}
          >
            <MenuOption
              label={option.label}
              description={option.description}
              trailing={
                <>
                  {option.trailing}
                  {value === option.value ? (
                    <Icon name="checkmark-1" className={menuCheckClass} />
                  ) : null}
                </>
              }
            />
          </MenuItem>
        ))}
      </MenuContent>
    </InheritedMenu>
  );
}

export type InheritedNumberFieldProps = {
  value: number | undefined;
  inherited: number;
  inheritedTag?: string;
  inheritedLabel?: string;
  min?: number;
  max: number;
  saving?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (value: number | undefined) => void;
};

/**
 * Capy's InheritedNumber: shows the inherited number with its tag until you
 * edit it; an override gets a reset button back to the inherited value.
 */
export function InheritedNumberField({
  value,
  inherited,
  inheritedTag = "Org",
  inheritedLabel = "Use org default",
  min = 1,
  max,
  saving = false,
  disabled = false,
  disabledReason,
  className,
  "aria-label": ariaLabel,
  onChange,
}: InheritedNumberFieldProps) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<{ value: number | undefined }>();
  useEffect(() => {
    if (!saving) setPending(undefined);
  }, [saving]);
  const current = pending === undefined ? value : pending.value;
  const [draft, setDraft] = useState(String(current ?? inherited));
  const open = () => {
    setDraft(String(current ?? inherited));
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const next = resolveNumberDraft(draft, { current, inherited, min, max });
    if (next.kind === "revert") setDraft(String(current ?? inherited));
    if (next.kind !== "set") return;
    setPending({ value: next.value });
    onChange(next.value);
  };
  const reset = () => {
    setEditing(false);
    setDraft(String(inherited));
    if (current === undefined) return;
    setPending({ value: undefined });
    onChange(undefined);
  };
  if (current === undefined && !editing) {
    return (
      <Button
        variant="solid"
        size="sm"
        className={cx("tabular-nums", className)}
        disabled={disabled || saving}
        title={disabledReason}
        aria-label={ariaLabel}
        onClick={open}
      >
        {inherited}
        <InheritedTag>{inheritedTag}</InheritedTag>
        <Icon name="edit-small-1" className={buttonIconClass} />
      </Button>
    );
  }
  const resetLabel = `${inheritedLabel} (${inherited})`;
  return (
    <div className={cx("relative", className)}>
      <Input
        size="sm"
        className="w-23 pr-8 text-right tabular-nums"
        type="number"
        min={min}
        max={max}
        value={editing ? draft : String(current ?? inherited)}
        aria-label={ariaLabel}
        disabled={disabled || saving}
        title={disabledReason}
        autoFocus={editing}
        onFocus={(event) => {
          if (!editing) open();
          event.currentTarget.select();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(current ?? inherited));
            event.currentTarget.blur();
          }
        }}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={resetLabel}
              disabled={disabled || saving}
              className="absolute inset-y-0 right-2 flex items-center text-icon-muted outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none"
              onMouseDown={(event) => event.preventDefault()}
              onClick={reset}
            />
          }
        >
          <Icon
            name="arrow-rotate-counter-clockwise"
            className={buttonIconClass}
          />
        </TooltipTrigger>
        <TooltipContent>{resetLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * Capy's SettingsAgentPage shell, shared by the Threads and Git & pull
 * requests pages: title, description and the You / Org scope switch.
 */
export function SettingsAgentPage({
  page,
  children,
}: {
  page: SettingsAgentPageId;
  children: (scope: SettingsScope) => ReactNode;
}) {
  const navigate = useNavigate();
  const hash = useRouterState({ select: (state) => state.location.hash });
  const [selected, setSelected] = useState<SettingsScope>("you");
  const scope = hash === orgScopeHash ? "org" : selected;
  const copy = settingsAgentPageCopy[page];
  const choose = (next: SettingsScope) => {
    setSelected(next);
    if (hash !== "") void navigate({ to: copy.to, hash: "", replace: true });
  };
  return (
    <SettingsPage title={copy.title} description={copy.description}>
      {/* biome-ignore lint/a11y/useSemanticElements: Capy's scope switch is a div group of toggle buttons */}
      <div
        className="-mx-2 flex gap-1"
        role="group"
        aria-label="Settings scope"
      >
        <Button
          variant="ghost"
          size="sm"
          data-selected={scope === "you" ? "" : undefined}
          aria-pressed={scope === "you"}
          onClick={() => choose("you")}
        >
          You
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-selected={scope === "org" ? "" : undefined}
          aria-pressed={scope === "org"}
          onClick={() => choose("org")}
        >
          Org
        </Button>
      </div>
      {children(scope)}
    </SettingsPage>
  );
}
