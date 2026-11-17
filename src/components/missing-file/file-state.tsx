import type { ReactNode } from "react";
import { ShimmerText } from "@/primitives/shimmer-text";
import peer from "./assets/peer.svg?url";

export type FileStateProps = {
  line: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  art?: string;
  busy?: boolean;
};

export function FileState({
  line,
  sub,
  action,
  art = peer,
  busy,
}: FileStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      {busy === true ? (
        <ShimmerText className="max-w-xs text-sm text-balance">
          {line}
        </ShimmerText>
      ) : (
        <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
          {line}
        </span>
      )}
      {sub !== undefined && (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {action !== undefined && <span className="mt-2">{action}</span>}
    </div>
  );
}
