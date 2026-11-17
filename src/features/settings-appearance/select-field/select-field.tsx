import type { ReactNode } from "react";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";

/** A settings-row select: Capy's MenuSelect with a sm trigger and end-aligned items. */
export function SelectField<Value extends string>({
  label,
  value,
  items,
  onChange,
  className,
  disabled,
  children,
}: {
  label: string;
  value: Value;
  items: Readonly<Record<Value, string>>;
  onChange: (value: Value) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <MenuSelect
      items={items}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== null) onChange(next as Value);
      }}
    >
      <MenuSelectTrigger aria-label={label} className={className}>
        {children ?? <MenuSelectValue />}
      </MenuSelectTrigger>
      <MenuSelectContent align="end">
        {(Object.keys(items) as Value[]).map((item) => (
          <MenuSelectItem key={item} value={item}>
            {items[item]}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}

export function MultiSelectField<Value extends string>({
  label,
  value,
  items,
  onChange,
  className,
}: {
  label: string;
  value: ReadonlyArray<Value>;
  items: Readonly<Record<Value, string>>;
  onChange: (value: Value[]) => void;
  className?: string;
}) {
  const keys = Object.keys(items) as Value[];
  const selected = keys.filter((key) => value.includes(key));
  return (
    <MenuSelect
      multiple
      items={items}
      value={selected}
      onValueChange={(next) => onChange((next ?? []) as Value[])}
    >
      <MenuSelectTrigger aria-label={label} className={className}>
        <span className="min-w-0 truncate">
          {selected.length === 0
            ? "None"
            : selected.map((key) => items[key]).join(", ")}
        </span>
      </MenuSelectTrigger>
      <MenuSelectContent align="end">
        {keys.map((item) => (
          <MenuSelectItem key={item} value={item}>
            {items[item]}
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}
