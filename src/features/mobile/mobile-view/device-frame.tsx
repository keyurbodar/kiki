import { cx } from "class-variance-authority";
import type {
  ClipboardEventHandler,
  CSSProperties,
  KeyboardEventHandler,
  PointerEventHandler,
  ReactNode,
  Ref,
} from "react";
import { ShimmerText } from "@/primitives/shimmer-text";
import {
  type DeviceFold,
  type DeviceFrameStyle,
  type DeviceOs,
  type DeviceSize,
  percentOf,
  resolveDeviceFrame,
} from "./device-frames";

export type DeviceFrameProps = {
  device: DeviceSize;
  os: DeviceOs;
  model?: string;
  fold?: DeviceFold;
  frameStyle: DeviceFrameStyle;
  frameRef?: Ref<HTMLDivElement>;
  focusable?: boolean;
  className?: string;
  children?: ReactNode;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  onPaste?: ClipboardEventHandler<HTMLDivElement>;
};

export function DeviceFrame({
  device,
  os,
  model,
  fold,
  frameStyle,
  frameRef,
  focusable = false,
  className,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  onPaste,
}: DeviceFrameProps) {
  const skinned = frameStyle === "device";
  const frame = resolveDeviceFrame(
    os,
    model,
    fold,
    device.width > device.height,
  );
  const { size, screen } = frame;
  const borderRadius = frame.corners
    .map(
      (corner) => `calc(var(--frame-w) * ${(corner / size.width).toFixed(5)})`,
    )
    .join(" ");
  const inset = (bleed: number): CSSProperties => ({
    left: percentOf(screen.x - size.width * bleed, size.width),
    top: percentOf(screen.y - size.height * bleed, size.height),
    width: percentOf(screen.width + size.width * bleed * 2, size.width),
    height: percentOf(screen.height + size.height * bleed * 2, size.height),
    borderRadius,
  });
  const maxFrameWidth = Math.round((device.width * size.width) / screen.width);
  return (
    <div className="relative min-h-0 flex-1 [container-type:size]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={
            skinned
              ? "relative"
              : "relative rounded-(--radius-panel) border-hairline border-border-2 bg-card p-1.5 shadow-card"
          }
          style={
            skinned
              ? ({
                  "--frame-w": `min(calc(100cqw - 2.5rem), calc((100cqh - 2rem) * ${(size.width / size.height).toFixed(5)}), ${maxFrameWidth}px)`,
                  width: "var(--frame-w)",
                  aspectRatio: `${size.width} / ${size.height}`,
                } as CSSProperties)
              : undefined
          }
        >
          {skinned && (
            <span
              aria-hidden
              className="pointer-events-none absolute bg-device-glass"
              style={inset(0.0045)}
            />
          )}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: the phone screen is a focusable surface streaming video, as in Capy */}
          <div
            ref={frameRef}
            tabIndex={focusable ? 0 : undefined}
            className={cx(
              "overflow-hidden outline-none focus-visible:outline-ring-inset",
              skinned
                ? "absolute bg-device-glass"
                : "relative rounded-(--radius-card) bg-background",
              className,
            )}
            style={
              skinned
                ? inset(0)
                : {
                    width: `min(calc(100cqw - 2.75rem), calc((100cqh - 2.75rem) / ${(device.height / device.width).toFixed(5)}), ${device.width}px)`,
                    aspectRatio: `${device.width} / ${device.height}`,
                  }
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export type DeviceNoticeProps = {
  title: string;
  busy?: boolean;
  lines?: readonly string[];
  detail?: ReactNode;
  action?: ReactNode;
};

export function DeviceNotice({
  title,
  busy = false,
  lines = [],
  detail,
  action,
}: DeviceNoticeProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-panel/85 p-5 text-center">
      {busy ? (
        <ShimmerText className="text-sm font-medium text-balance">
          {title}
        </ShimmerText>
      ) : (
        <span className="text-sm font-medium text-balance text-foreground">
          {title}
        </span>
      )}
      {lines.map((line) => (
        <span
          key={line}
          className="text-xs text-balance text-muted-foreground-2"
        >
          {line}
        </span>
      ))}
      {detail !== undefined && (
        <span className="text-xs text-muted-foreground-3 tabular-nums">
          {detail}
        </span>
      )}
      {action !== undefined && (
        <div className="mt-3 flex justify-center">{action}</div>
      )}
    </div>
  );
}
