import { type ReactElement, useEffect, useId, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  type Channels,
  HEX_COLOR,
  hexChannels,
  isChannel,
  replaceChannel,
  toHex,
  withChannel,
} from "./color";
import "./color-picker.css";

type ColorFormat = "hex" | "rgb";

const FORMATS: Record<ColorFormat, string> = { hex: "Hex", rgb: "RGB" };

const CHANNEL_NAMES = ["red", "green", "blue"] as const;

/**
 * The colour a trigger is painting: the `.color-picker__swatch` inside it when
 * there is one, else the trigger's own background. Read off the element the
 * user actually pressed, so a caller-supplied trigger seeds the picker the same
 * way the built-in one does.
 */
const paintedColor = (element: Element | null): string | undefined => {
  if (element === null) return undefined;
  const swatch = element.querySelector(".color-picker__swatch") ?? element;
  const painted = getComputedStyle(swatch).backgroundColor;
  if (
    painted === "" ||
    (typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      !CSS.supports("color", painted))
  )
    return undefined;
  const context = document.createElement("canvas").getContext("2d");
  if (context === null) return undefined;
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = painted;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(
    0,
    0,
    1,
    1,
  ).data;
  return alpha === 0 ? undefined : toHex(red, green, blue);
};

export type ColorPickerColor = { label: string; value: string };

export type ColorPickerProps = {
  value?: string;
  previewColor?: string;
  onValueChange: (value: string) => void;
  label: string;
  colors?: readonly ColorPickerColor[];
  disabled?: boolean;
  trigger?: ReactElement;
};

export function ColorPicker({
  value,
  previewColor,
  onValueChange,
  label,
  colors = [],
  disabled = false,
  trigger,
}: ColorPickerProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [fallback, setFallback] = useState(() => toHex(0, 0, 0));
  // A caller can pass a colour the picker cannot express — a derived token, an
  // empty string — and react-colorful renders NaN for it. Only a hex counts as
  // a controlled colour; anything else seeds from the swatch that was clicked.
  const controlled =
    value !== undefined && HEX_COLOR.test(value) ? value : undefined;
  const current = controlled ?? fallback;
  const [draft, setDraft] = useState(current);
  const [channels, setChannels] = useState<Channels>(["0", "0", "0"]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Capy resets the drafts whenever the popover opens or the format switches
  useEffect(() => {
    setDraft(current);
    setChannels(hexChannels(current));
  }, [current, format, open]);

  const commit = (next: string) => {
    setDraft(next);
    setFallback(next);
    onValueChange(next);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next || controlled !== undefined) return;
    const painted = paintedColor(document.activeElement);
    if (painted !== undefined) setFallback(painted);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          trigger ?? (
            <Button
              variant="outline"
              size="icon-sm"
              disabled={disabled}
              aria-label={`Pick ${label.toLowerCase()} color`}
            >
              <span
                aria-hidden
                className="color-picker__swatch"
                style={{ backgroundColor: previewColor ?? controlled }}
              />
            </Button>
          )
        }
      />
      <PopoverContent
        className="w-64 p-0"
        aria-labelledby={labelId}
        align="end"
        initialFocus={(openType) =>
          openType === "keyboard"
            ? (bodyRef.current?.querySelector<HTMLElement>('[role="slider"]') ??
              true)
            : false
        }
      >
        <div className="flex shrink-0 items-center justify-between border-b-(length:--border-width-hairline) border-border-1 px-3 py-1">
          <span id={labelId} className="text-sm font-medium">
            {label}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Close color picker"
            onClick={() => setOpen(false)}
          >
            <CrossMedium />
          </Button>
        </div>
        <div
          data-slot="color-picker"
          className="flex min-h-0 flex-col overflow-y-auto"
        >
          <div
            ref={bodyRef}
            className="flex flex-col gap-2 px-3 py-2 pointer-coarse:gap-4"
          >
            <HexColorPicker
              className="color-picker__picker"
              color={current}
              onChange={commit}
            />
            <div className="flex items-center gap-2">
              <MenuSelect
                items={FORMATS}
                value={format}
                onValueChange={(next) => next && setFormat(next)}
              >
                <MenuSelectTrigger
                  className="w-16 shrink-0"
                  aria-label="Color format"
                >
                  <MenuSelectValue />
                </MenuSelectTrigger>
                <MenuSelectContent>
                  <MenuSelectItem value="hex">Hex</MenuSelectItem>
                  <MenuSelectItem value="rgb">RGB</MenuSelectItem>
                </MenuSelectContent>
              </MenuSelect>
              {format === "hex" ? (
                <Input
                  aria-label={`${label} hex color`}
                  className="color-picker__input"
                  size="sm"
                  value={draft}
                  spellCheck={false}
                  disabled={disabled}
                  aria-invalid={!HEX_COLOR.test(draft)}
                  onBlur={() => setDraft(current)}
                  onChange={(event) => {
                    const next = event.target.value;
                    setDraft(next);
                    if (!HEX_COLOR.test(next)) return;
                    setFallback(next);
                    onValueChange(next);
                  }}
                />
              ) : (
                <div className="flex min-w-0 flex-1 gap-1">
                  {CHANNEL_NAMES.map((name, index) => (
                    <Input
                      key={name}
                      aria-label={`${label} ${name}`}
                      title={name}
                      className="color-picker__input"
                      size="sm"
                      inputMode="numeric"
                      value={channels[index] ?? ""}
                      disabled={disabled}
                      aria-invalid={!isChannel(channels[index] ?? "")}
                      onBlur={() =>
                        setChannels((previous) =>
                          replaceChannel(
                            previous,
                            index,
                            hexChannels(current)[index] ?? "0",
                          ),
                        )
                      }
                      onChange={(event) => {
                        const next = event.target.value;
                        setChannels((previous) =>
                          replaceChannel(previous, index, next),
                        );
                        if (isChannel(next))
                          commit(withChannel(current, index, next));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {colors.length > 0 ? (
            // biome-ignore lint/a11y/useSemanticElements: Capy groups the theme swatches with role="group"
            <div
              role="group"
              aria-label="Theme colors"
              className="flex flex-wrap border-t-(length:--border-width-hairline) border-border-1 px-3 py-1"
            >
              {colors.map((color) => (
                <Button
                  key={color.label}
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={`Use ${color.label.toLowerCase()} color`}
                  title={`${color.label} · ${color.value}`}
                  onClick={() => commit(color.value)}
                >
                  <span
                    aria-hidden
                    className="color-picker__swatch"
                    style={{ backgroundColor: color.value }}
                  />
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CrossMedium() {
  return (
    <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
