import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import {
  type PhoneDevice,
  phoneDeviceSize,
  phoneNotice,
} from "./phone-view-logic.ts";

export type PhoneViewProps = {
  readonly phone?: PhoneDevice;
  readonly label?: string;
  readonly settled?: boolean;
  readonly frameStyle?: "device" | "simple";
  readonly onRetry?: () => void;
  readonly onWake?: () => void;
  readonly onPress?: (action: string) => void;
  readonly children?: React.ReactNode;
};

export function PhoneView({
  phone,
  label = "Phone",
  settled = false,
  frameStyle = "device",
  onRetry,
  onWake,
  onPress,
  children,
}: PhoneViewProps) {
  if (phone === undefined) {
    return settled ? (
      <PreviewEmptyState
        art={previewArt.hanging}
        line="Phones unavailable"
        action={
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    ) : null;
  }
  if (!("phone" in phone)) {
    return (
      <PreviewEmptyState
        art={previewArt.peer}
        line={`${label} was removed`}
        sub="This phone is no longer attached to the thread"
      />
    );
  }
  if (phone.state !== "awake" && phone.phone.stage !== "connecting") {
    const notice = phoneNotice(phone);
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <PreviewEmptyState
          art={previewArt.sleep}
          line={notice.title}
          sub={notice.lines[0]}
          action={
            <Button size="sm" onClick={onWake}>
              Wake phone
            </Button>
          }
        />
      </div>
    );
  }
  const size = phoneDeviceSize(phone);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-12 shrink-0 items-center gap-3 py-2 pr-2 pl-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground-2">
          {phone.phone.model ?? label}
        </span>
        <span className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Home"
            onClick={() => onPress?.("home")}
          >
            <Icon name="phone-dynamic-island" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={() => onPress?.("back")}
          >
            <Icon name="arrow-up-left" size="sm" />
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Open URL">
                  <Icon name="chain-link-2" size="sm" />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-72 p-2">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  onPress?.(String(data.get("url") ?? ""));
                }}
              >
                <input
                  name="url"
                  aria-label="URL to open on the phone"
                  placeholder="https:// or a deep link"
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                />
                <Button type="submit" size="sm">
                  Open
                </Button>
              </form>
            </PopoverContent>
          </Popover>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div
          className={
            frameStyle === "device"
              ? "overflow-hidden rounded-(--radius-panel) border-hairline border-border-2 bg-panel shadow-overlay"
              : "overflow-hidden bg-background"
          }
          style={{
            aspectRatio: `${size.width} / ${size.height}`,
            maxHeight: "100%",
          }}
        >
          {children ?? (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground-2">
              Connecting to phone
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
