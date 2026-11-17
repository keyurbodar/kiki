import type { ReactNode } from "react";

export type ChoiceRowGroupProps = {
  label: string;
  children?: ReactNode;
};

export function ChoiceRowGroup({ label, children }: ChoiceRowGroupProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {children}
    </div>
  );
}

export type ChoiceRowProps = {
  layout?: "row" | "tile";
  checked: boolean;
  tabStop?: boolean;
  onSelect?: () => void;
  icon?: ReactNode;
  avatar?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  wrapDescription?: boolean;
};

export function ChoiceRow({
  checked,
  tabStop = false,
  onSelect,
  icon,
  avatar,
  label,
  description,
  badge,
  disabled = false,
}: ChoiceRowProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: Capy renders choices as button radios
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      tabIndex={checked || tabStop ? 0 : -1}
      onClick={onSelect}
    >
      {icon}
      {avatar}
      <span>
        <span>
          {label}
          {badge}
        </span>
        <span>{description}</span>
      </span>
    </button>
  );
}
