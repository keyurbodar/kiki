import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { MenuContent } from "@/primitives/menu";
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

export type InheritedMenuProps<Value extends string = string> = {
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

type RowProps = {
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  rich: boolean;
};

function Row({ label, description, trailing, rich }: RowProps) {
  return (
    <span
      data-slot="menu-row"
      className="flex min-w-0 flex-1 items-center gap-2 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground in-data-[intent=danger]:text-destructive">
          {label}
        </span>
        {description ? (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span
          className={cx(
            "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1",
            rich && "h-5 self-start",
          )}
        >
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

function Check() {
  return <Icon name="checkmark-1" size="sm" className="text-foreground" />;
}

export function InheritedMenu<Value extends string = string>({
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
}: InheritedMenuProps<Value>) {
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
            <Row
              label={inheritedLabel}
              rich={false}
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
            <Row
              label={option.label}
              description={option.description}
              rich={option.description !== undefined}
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
