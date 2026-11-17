import type { ReactNode } from "react";

export function PreviewEmptyState({
  art,
  line,
  sub,
  action,
  busy,
}: {
  art: string;
  line: string;
  sub?: string;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <img
        src={art}
        alt=""
        className="mb-2 h-20 opacity-30 grayscale mix-blend-luminosity"
      />
      {busy === true ? (
        <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
          {line}
        </span>
      ) : (
        <span className="max-w-xs text-sm text-balance text-muted-foreground-1">
          {line}
        </span>
      )}
      {sub === undefined ? null : (
        <span className="max-w-xs text-xs text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
      {action === undefined ? null : <span className="mt-2">{action}</span>}
    </div>
  );
}
