import { Icon } from "@/primitives/icon";

export type DiffNoticeProps = { line: string; sub?: string };

export function DiffNotice({ line, sub }: DiffNoticeProps) {
  return (
    <div
      data-slot="diff-notice"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground-2"
    >
      <Icon name="review" size="lg" className="text-icon-muted" />
      <span>{line}</span>
      {sub !== undefined && (
        <span className="max-w-xs text-center text-balance text-muted-foreground-3">
          {sub}
        </span>
      )}
    </div>
  );
}
