import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { Button } from "@/primitives/button";
import {
  desktopCopy,
  isLive,
  type MachineSummary,
} from "./desktop-view-logic.ts";

export type DesktopViewProps = {
  readonly machine?: MachineSummary | null;
  readonly settled?: boolean;
  readonly active?: boolean;
  readonly onRetry?: () => void;
  readonly onWake?: () => void;
  readonly children?: React.ReactNode;
};

export function DesktopView({
  machine,
  settled = false,
  active = false,
  onRetry,
  onWake,
  children,
}: DesktopViewProps) {
  const copy = desktopCopy(machine, settled);
  if (copy !== undefined && "action" in copy) {
    return (
      <PreviewEmptyState
        art={previewArt.hanging}
        line={copy.line}
        action={
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }
  if (copy !== undefined) {
    return (
      <PreviewEmptyState
        art={previewArt.sleep}
        line={copy.line}
        sub={copy.sub}
        action={
          <Button variant="outline" size="xs" onClick={onWake}>
            Wake machine
          </Button>
        }
      />
    );
  }
  if (machine == null) return null;
  if (
    machine.state === "creating" ||
    (machine.state === "waking" && !isLive(machine, active))
  ) {
    return (
      <PreviewEmptyState
        art={previewArt.hanging}
        line="Starting machine"
        busy
      />
    );
  }
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-background">
      {children}
    </div>
  );
}
