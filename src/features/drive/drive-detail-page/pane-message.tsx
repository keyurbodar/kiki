import { type ReactNode, useEffect, useState } from "react";
import peer from "@/components/file-view/art/peer.svg?url";

export interface PaneMessageProps {
  readonly line: ReactNode;
  readonly sub?: ReactNode;
  readonly action?: ReactNode;
}

/** Capy's centred pane message for loading, empty and error states. */
export function PaneMessage({ line, sub, action }: PaneMessageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={peer}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
        {line}
      </span>
      {sub !== undefined && (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {action !== undefined && <span className="mt-2">{action}</span>}
    </div>
  );
}

/** A loading message that only appears once loading is slow. */
export function DelayedPaneMessage({ line }: { readonly line: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return shown ? <PaneMessage line={line} /> : null;
}
