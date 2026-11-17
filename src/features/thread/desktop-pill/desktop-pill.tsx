import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import {
  moveCorner,
  type PillCorner,
  pillCornerClass,
} from "./desktop-pill-logic.ts";

export type DesktopPillProps = {
  readonly corner?: PillCorner;
  readonly audioRunning?: boolean;
  readonly onMute?: () => void;
  readonly onUnmute?: () => void;
  readonly touchMode?: "touch" | "trackpad";
  readonly onTouchModeChange?: (mode: "touch" | "trackpad") => void;
};

export function DesktopPill({
  corner = "top-right",
  audioRunning = false,
  onMute,
  onUnmute,
  touchMode = "trackpad",
  onTouchModeChange,
}: DesktopPillProps) {
  const [position, setPosition] = useState(corner);
  return (
    <div
      className={`pointer-events-auto absolute flex items-stretch gap-1.5 rounded-(--radius-card) border-hairline border-border-2 bg-popover px-1.5 py-1 shadow-overlay ${pillCornerClass[position]}`}
    >
      <span className="flex items-center gap-1.5 pl-1.5">
        <span className="size-1.5 rounded-full bg-success" />
        <span className="text-xs font-medium text-foreground">Live</span>
      </span>
      <Menu>
        <MenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Desktop options">
              <Icon name="settings-slider-hor" size="sm" />
            </Button>
          }
        />
        <MenuContent
          align={position.endsWith("right") ? "end" : "start"}
          className="w-56"
        >
          <MenuItem
            onClick={() =>
              onTouchModeChange?.(
                touchMode === "trackpad" ? "touch" : "trackpad",
              )
            }
          >
            <span className="flex items-center gap-2">
              <Icon name="hand-4-finger" size="sm" />
              Trackpad mode: {touchMode}
            </span>
          </MenuItem>
          <MenuItem
            onClick={() =>
              onTouchModeChange?.(
                touchMode === "trackpad" ? "touch" : "trackpad",
              )
            }
          >
            <span className="flex items-center gap-2">
              <Icon name="gauge" size="sm" />
              Show stats
            </span>
          </MenuItem>
          <MenuItem onClick={audioRunning ? onMute : onUnmute}>
            <span className="flex items-center gap-2">
              <Icon
                name={audioRunning ? "microphone" : "voice-high"}
                size="sm"
              />
              {audioRunning ? "Mute" : "Unmute"}
            </span>
          </MenuItem>
        </MenuContent>
      </Menu>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Move desktop controls"
        className="touch-none cursor-grab active:cursor-grabbing"
        onKeyDown={(event) => {
          const next = moveCorner(position, event.key);
          if (next !== undefined) {
            event.preventDefault();
            setPosition(next);
          }
        }}
      >
        <Icon name="chevron-grabber-vertical" size="sm" />
      </Button>
    </div>
  );
}
