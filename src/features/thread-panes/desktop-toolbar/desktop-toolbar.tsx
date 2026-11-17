import type { ComponentProps } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { modifierKeys, specialKeys } from "./desktop-toolbar-logic.ts";

export type DesktopToolbarProps = ComponentProps<"div">;

const modifierLabels: Record<string, string> = {
  ControlLeft: "Ctrl",
  AltLeft: "Alt",
  MetaLeft: "Cmd",
  ShiftLeft: "Shift",
};
const specialLabels: Record<string, string> = {
  Escape: "Esc",
  Tab: "Tab",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowRight: "→",
};

export function DesktopToolbar({ className, ...props }: DesktopToolbarProps) {
  return (
    <div
      data-slot="desktop-toolbar"
      className={`pointer-events-auto fixed inset-x-0 z-(--z-overlay-content) flex items-center gap-1 border-t-hairline border-border-2 bg-popover px-1.5 ${className ?? ""}`}
      {...props}
    >
      <Button variant="ghost" size="icon-sm" aria-label="Show keyboard">
        <Icon name="keyboard" size="sm" />
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {modifierKeys.map((key) => (
          <Button key={key} variant="soft" size="sm" className="shrink-0">
            {modifierLabels[key]}
          </Button>
        ))}
        <span className="mx-0.5 h-4 w-px shrink-0 bg-border-1" />
        {specialKeys.map((key) => (
          <Button key={key} variant="soft" size="sm" className="shrink-0">
            {specialLabels[key]}
          </Button>
        ))}
      </div>
      <span className="flex shrink-0 items-center gap-1.5 pl-1">
        <span className="size-1.5 rounded-full bg-success" />
        <Button variant="ghost" size="icon-sm" aria-label="Desktop options">
          <Icon name="settings-slider-hor" size="sm" />
        </Button>
      </span>
    </div>
  );
}
