import {
  createContext,
  type ReactNode,
  type SVGProps,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { Button, type ButtonProps } from "@/primitives/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";

export const FileToolbarSlotContext = createContext<
  HTMLElement | null | undefined
>(undefined);

export function FileToolbarSlot({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const target = useContext(FileToolbarSlotContext);
  if (target === undefined) {
    return (
      fallback ?? (
        <div className="flex h-9 shrink-0 items-center justify-end gap-0.5 border-b-hairline border-border-1 px-2">
          {children}
        </div>
      )
    );
  }
  if (target === null) return null;
  return createPortal(
    <div
      className="flex items-center gap-0.5"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    target,
  );
}

export type FileToolbarButtonProps = {
  label: string;
  size?: ButtonProps["size"];
  disabled?: boolean;
  pressed?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function FileToolbarButton({
  label,
  size,
  disabled,
  pressed,
  onClick,
  children,
}: FileToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size ?? "icon-xs"}
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

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children">;

function MinusGlyph(props: GlyphProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusGlyph(props: GlyphProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M12 4V12M12 12V20M12 12H4M12 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ZOOM_STEP = 1.25;

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
        label="Zoom out"
        disabled={zoom <= minZoom}
        onClick={() => onZoom(Math.max(minZoom, zoom / ZOOM_STEP))}
      >
        <MinusGlyph />
      </FileToolbarButton>
      <FileToolbarButton label="Reset zoom" size="xs" onClick={onReset}>
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
      </FileToolbarButton>
      <FileToolbarButton
        label="Zoom in"
        disabled={zoom >= maxZoom}
        onClick={() => onZoom(Math.min(maxZoom, zoom * ZOOM_STEP))}
      >
        <PlusGlyph />
      </FileToolbarButton>
    </>
  );
}
