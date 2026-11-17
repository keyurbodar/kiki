import type { ReactNode } from "react";
import { Button } from "@/primitives/button";

export function PreviewIconButton({
  label,
  icon,
  onClick,
  disabled,
  selected,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      aria-pressed={selected}
      data-selected={selected === true ? "" : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </Button>
  );
}
