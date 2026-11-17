import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps, ReactNode } from "react";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuContent, MenuRow, menuCheckClassName } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";

export type InheritedMenuOption<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
};

export type InheritedMenuPickerProps<Value extends string = string> = {
  value: Value | undefined;
  inherits?: boolean;
  inherited?: Value;
  inheritedLabel?: string;
  inheritedTag?: string;
  options: ReadonlyArray<InheritedMenuOption<Value>>;
  variant?: ButtonVariants["variant"];
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  "aria-label"?: string;
  onChange: (value: Value | undefined) => void;
};

export type InheritedMenuRootProps = ComponentProps<typeof BaseMenu.Root>;

export type InheritedMenuProps<Value extends string = string> =
  | InheritedMenuPickerProps<Value>
  | InheritedMenuRootProps;

export type InheritedMenuTriggerProps = ComponentProps<typeof BaseMenu.Trigger>;

export function InheritedMenuTrigger(props: InheritedMenuTriggerProps) {
  return <BaseMenu.Trigger data-slot="menu-trigger" {...props} />;
}

export type InheritedTagProps = { children: ReactNode };

export function InheritedTag({ children }: InheritedTagProps) {
  return (
    <span className="shrink-0 text-xs text-muted-foreground-2">{children}</span>
  );
}

function Check() {
  return <Icon name="checkmark-1" size={null} className={menuCheckClassName} />;
}

export function InheritedMenu<Value extends string = string>(
  props: InheritedMenuProps<Value>,
) {
  if (!("options" in props)) return <BaseMenu.Root {...props} />;
  return <InheritedMenuPicker {...props} />;
}

function InheritedMenuPicker<Value extends string>({
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
}: InheritedMenuPickerProps<Value>) {
  const usesInherited = inherits && value === undefined;
  const labelOf = (key: Value | undefined) =>
    options.find((option) => option.value === key)?.label ?? "";
  const shown = usesInherited
    ? inherited === undefined
      ? inheritedLabel
      : labelOf(inherited)
    : labelOf(value ?? options[0]?.value);

  return (
    <ResponsiveMenu>
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
        <Icon name="chevron-down-small" size={null} />
      </InheritedMenuTrigger>
      <MenuContent align="end">
        {inherits ? (
          <ResponsiveMenuItem onClick={() => onChange(undefined)}>
            <MenuRow
              label={inheritedLabel}
              trailing={
                <>
                  {inherited === undefined ? null : labelOf(inherited)}
                  {usesInherited ? <Check /> : null}
                </>
              }
            />
          </ResponsiveMenuItem>
        ) : null}
        {options.map((option) => (
          <ResponsiveMenuItem
            key={option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            <MenuRow
              label={option.label}
              description={option.description}
              density={option.description === undefined ? undefined : "rich"}
              trailing={
                <>
                  {option.trailing}
                  {value === option.value ? <Check /> : null}
                </>
              }
            />
          </ResponsiveMenuItem>
        ))}
      </MenuContent>
    </ResponsiveMenu>
  );
}
