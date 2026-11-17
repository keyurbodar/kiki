import type { ReactNode } from "react";
import hanging from "./art/hanging.svg?url";
import peer from "./art/peer.svg?url";
import sleep from "./art/sleep.svg?url";

export const fileEmptyArt = { hanging, peer, sleep } as const;

export type FileEmptyProps = {
  line: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  art?: string;
  busy?: boolean;
};

export function FileEmpty({
  line,
  sub,
  action,
  art = fileEmptyArt.peer,
  busy,
}: FileEmptyProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      <span
        data-busy={busy === true ? "" : undefined}
        className="max-w-xs text-sm text-balance text-muted-foreground-1 data-busy:animate-pulse"
      >
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
