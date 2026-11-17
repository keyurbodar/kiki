import { cx } from "class-variance-authority";
import { type ReactNode, type Ref, useRef } from "react";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { DeviceFrame, DeviceNotice } from "./device-frame";
import {
  type DeviceFold,
  type DeviceFrameStyle,
  type DeviceOs,
  type DeviceSize,
  pointToDevice,
} from "./device-frames";

const track = (owner: string) => `features/thread/mobile-view.tsx#${owner}`;

export type DeviceStreamPhase =
  | { phase: "connecting" }
  | { phase: "live" }
  | { phase: "reconnecting" }
  | { phase: "unavailable"; reason: string }
  | { phase: "failed"; reason: string };

export type DeviceControlApi = {
  touchDown: (x: number, y: number) => void;
  touchMove: (x: number, y: number) => void;
  touchUp: (x: number, y: number) => void;
  type: (text: string) => void;
  key: (key: DeviceKey) => void;
  paste: (text: string) => void;
};

export type DeviceControl = {
  phase: "closed" | "connecting" | "open";
  api: DeviceControlApi;
};

export const deviceKeys = {
  Backspace: "BACKSPACE",
  Enter: "ENTER",
} as const;

export type DeviceKey = (typeof deviceKeys)[keyof typeof deviceKeys];

export function deviceKeyFor(key: string): DeviceKey | undefined {
  return Object.hasOwn(deviceKeys, key)
    ? deviceKeys[key as keyof typeof deviceKeys]
    : undefined;
}

export type DeviceShellProps = {
  phase: DeviceStreamPhase;
  device: DeviceSize;
  os: DeviceOs;
  model?: string;
  fold?: DeviceFold;
  frameStyle: DeviceFrameStyle;
  retry: () => void;
  videoRef: Ref<HTMLVideoElement>;
  control?: DeviceControl;
  poster?: ReactNode;
  notice?: ReactNode;
};

export function DeviceShell({
  phase,
  device,
  os,
  model,
  fold,
  frameStyle,
  retry,
  videoRef,
  control,
  poster,
  notice,
}: DeviceShellProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const api =
    control?.phase === "open" && phase.phase === "live"
      ? control.api
      : undefined;
  const interactive = api !== undefined;
  const toDevice = (
    event: { clientX: number; clientY: number },
    clamp = false,
  ) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (rect === undefined) return undefined;
    return pointToDevice(rect, device, event.clientX, event.clientY, clamp);
  };
  const unreachable = phase.phase === "unavailable" || phase.phase === "failed";
  const overlay =
    notice ??
    (phase.phase === "connecting" && poster === undefined ? (
      <DeviceNotice busy title="Connecting to the phone" />
    ) : unreachable ? (
      <DeviceNotice
        title={
          phase.phase === "failed"
            ? "Live view failed"
            : "Live view unavailable"
        }
        lines={[phase.reason]}
        action={
          <Button
            data-track-owner={track("DeviceShell:Button[Retry]")}
            variant="outline"
            size="sm"
            onClick={retry}
          >
            Retry
          </Button>
        }
      />
    ) : (
      (phase.phase === "reconnecting" || phase.phase === "connecting") && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <Badge role="status" variant="filled" size="base">
            <DotGridIcon size="xs" />
            {phase.phase === "reconnecting" ? "Reconnecting" : "Connecting"}
          </Badge>
        </div>
      )
    ));
  return (
    <DeviceFrame
      device={device}
      os={os}
      model={model}
      fold={fold}
      frameStyle={frameStyle}
      frameRef={frameRef}
      focusable={interactive}
      className={cx(interactive && "touch-none select-none")}
      onPointerDown={(event) => {
        if (api === undefined || event.button !== 0) return;
        const point = toDevice(event);
        if (point === undefined) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
        api.touchDown(point.x, point.y);
      }}
      onPointerMove={(event) => {
        if (api === undefined || event.buttons === 0) return;
        const point = toDevice(event, true);
        if (point !== undefined) api.touchMove(point.x, point.y);
      }}
      onPointerUp={(event) => {
        if (api === undefined) return;
        const point = toDevice(event, true);
        if (point !== undefined) api.touchUp(point.x, point.y);
      }}
      onKeyDown={(event) => {
        if (
          api === undefined ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.nativeEvent.isComposing
        )
          return;
        const key = deviceKeyFor(event.key);
        if (key === undefined && event.key.length !== 1) return;
        event.preventDefault();
        if (key === undefined) api.type(event.key);
        else api.key(key);
      }}
      onPaste={(event) => {
        if (api === undefined) return;
        const text = event.clipboardData.getData("text/plain");
        if (text === "") return;
        event.preventDefault();
        api.paste(text);
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
      {phase.phase !== "live" && poster !== undefined && (
        <div
          className={cx(
            "pointer-events-none absolute inset-0",
            (notice !== undefined || unreachable) && "scale-110 blur-sm",
          )}
        >
          {poster}
        </div>
      )}
      {overlay}
    </DeviceFrame>
  );
}
