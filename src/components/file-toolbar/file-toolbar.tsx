import { createContext, type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import { Button, type ButtonVariants } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { zoomIn, zoomOut, zoomPercent } from "./zoom";

const track = (owner: string) => `shared/files/file-toolbar.tsx#${owner}`;

export type FileToolbarButtonProps = {
  "data-track-owner"?: string;
  label: string;
  size?: ButtonVariants["size"];
  disabled?: boolean;
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function FileToolbarButton({
  label,
  size = "icon-xs",
  disabled,
  pressed,
  onClick,
  children,
}: FileToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        data-track-owner={track("FileToolbarButton:TooltipTrigger.1")}
        render={
          <Button
            data-track-owner={track(
              "FileToolbarButton:Button[onClick=onClick]",
            )}
            variant="ghost"
            size={size}
            aria-label={label}
            disabled={disabled}
            aria-pressed={pressed}
            data-selected={pressed === true ? "" : undefined}
            onClick={onClick}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export type FileZoomControlsProps = {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoom: (zoom: number) => void;
  onReset: () => void;
};

export function FileZoomControls({
  zoom,
  minZoom,
  maxZoom,
  onZoom,
  onReset,
}: FileZoomControlsProps) {
  return (
    <>
      <FileToolbarButton
        data-track-owner={track("FileZoomControls:FileToolbarButton[Zoom out]")}
        label="Zoom out"
        disabled={zoom <= minZoom}
        onClick={() => onZoom(zoomOut(zoom, minZoom))}
      >
        <Icon name="square-minus" size="sm" />
      </FileToolbarButton>
      <FileToolbarButton
        data-track-owner={track(
          "FileZoomControls:FileToolbarButton[Reset zoom]",
        )}
        label="Reset zoom"
        size="xs"
        onClick={onReset}
      >
        <span className="tabular-nums">{zoomPercent(zoom)}%</span>
      </FileToolbarButton>
      <FileToolbarButton
        data-track-owner={track("FileZoomControls:FileToolbarButton[Zoom in]")}
        label="Zoom in"
        disabled={zoom >= maxZoom}
        onClick={() => onZoom(zoomIn(zoom, maxZoom))}
      >
        <Icon name="square-plus" size="sm" />
      </FileToolbarButton>
    </>
  );
}

export const FileToolbarSlotContext = createContext<
  HTMLElement | null | undefined
>(undefined);

export type FileToolbarSlotProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function FileToolbarSlot({ children, fallback }: FileToolbarSlotProps) {
  const slot = useContext(FileToolbarSlotContext);
  if (slot === undefined)
    return (
      fallback ?? (
        <div className="flex h-9 shrink-0 items-center justify-end gap-0.5 border-b-hairline border-border-1 px-2">
          {children}
        </div>
      )
    );
  if (slot === null) return null;
  return createPortal(
    <div
      className="flex items-center gap-0.5"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    slot,
  );
}
