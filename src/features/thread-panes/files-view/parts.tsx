import type { ReactNode } from "react";
import {
  ChatGlyph,
  CopyGlyph,
  FolderFilledGlyph,
} from "@/components/file-home";
import { cn } from "@/lib/cn";
import { Button } from "@/primitives/button";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { toast } from "@/primitives/toaster";

export const menuIconClass =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export type RootRowProps = {
  home: ReactNode;
  open: boolean;
  meta?: ReactNode;
  onToggle: () => void;
};

export function RootRow({ home, open, meta, onToggle }: RootRowProps) {
  return (
    <div className="mx-2.25 flex h-7 shrink-0 items-center gap-1.5 rounded pr-2 hover:bg-secondary pointer-coarse:h-9">
      <button
        data-track-owner="features/thread/pane/files-view.tsx#RootRow:button[onClick=onToggle]"
        type="button"
        aria-expanded={open}
        className="flex h-full min-w-0 flex-1 items-center gap-1.5 rounded pl-2 text-left text-sm text-foreground outline-none focus-visible:outline-ring-inset [&_[data-home-name]]:truncate"
        onClick={onToggle}
      >
        {home}
      </button>
      {meta}
    </div>
  );
}

export function RootCount({ count }: { count: number }) {
  return (
    <span className="shrink-0 text-sm text-muted-foreground-2 tabular-nums">
      {count.toLocaleString("en-US")}
    </span>
  );
}

export function RootBody({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col pl-3.25">
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-6 w-px bg-border-1"
      />
      {children}
    </div>
  );
}

export function RootNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-6 items-center pl-7 text-xs text-muted-foreground-3">
      {children}
    </div>
  );
}

export function UploadsHome() {
  return (
    <>
      <FolderFilledGlyph className="size-(--icon-sm) shrink-0 text-icon-muted" />
      <span data-home-name>Uploads</span>
    </>
  );
}

const skeletonRows: ReadonlyArray<readonly [number, string]> = [
  [0, "w-24"],
  [4, "w-32"],
  [8, "w-20"],
  [8, "w-28"],
  [4, "w-16"],
  [0, "w-28"],
  [0, "w-20"],
];

export function FilesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading files"
      className="flex flex-col gap-1 px-3 pt-2.5"
    >
      {skeletonRows.map(([indent, width], index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed placeholder rows
          key={index}
          className="flex h-6 items-center gap-2"
          style={{ paddingLeft: `calc(var(--spacing) * ${indent})` }}
        >
          <div className="size-3.5 shrink-0 animate-pulse rounded bg-secondary" />
          <div
            className={cn("h-3 animate-pulse rounded bg-secondary", width)}
          />
        </div>
      ))}
    </div>
  );
}

export type RetryButtonProps = { onRetry: () => void; pending?: boolean };

export function RetryButton({ onRetry, pending = false }: RetryButtonProps) {
  return (
    <Button
      data-track-owner="features/thread/pane/files-view.tsx#RetryButton:Button[Retry]"
      variant="ghost"
      size="xs"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={onRetry}
    >
      {pending ? "Retrying" : "Retry"}
    </Button>
  );
}

export type Dormant = {
  card: ReactNode;
  note: ReactNode;
  action?: ReactNode;
};

export function DormantNotice({ dormant }: { dormant: Dormant }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-(--z-top-bar) flex justify-center px-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card py-1 pr-1 pl-2.5 text-xs text-muted-foreground-1 shadow-card">
        <span className="min-w-0 truncate">{dormant.note}</span>
        {dormant.action}
      </div>
    </div>
  );
}

export type FileMention = { kind: "file"; id: string; label: string };

export type RowActionsProps = {
  path: string;
  directory: boolean;
  copyPath?: string;
  close: () => void;
  onAddToChat?: (mention: FileMention) => void;
  children?: ReactNode;
};

export const mentionFor = (path: string, directory: boolean): FileMention => {
  const id = directory ? `${path}/` : path;
  return {
    kind: "file",
    id,
    label: id.slice(id.lastIndexOf("/", id.length - 2) + 1),
  };
};

export function RowActions({
  path,
  directory,
  copyPath,
  close,
  onAddToChat,
  children,
}: RowActionsProps) {
  return (
    <>
      {children}
      <ResponsiveMenuItem
        data-track-owner="features/thread/pane/files-view.tsx#RowActions:ResponsiveMenuItem[Copy path]"
        onClick={() => {
          close();
          navigator.clipboard
            .writeText(copyPath ?? path)
            .then(() => toast.success("Path copied"))
            .catch(() => toast.error("Could not copy path"));
        }}
      >
        <span className={menuIconClass}>
          <CopyGlyph />
        </span>
        Copy path
      </ResponsiveMenuItem>
      <ResponsiveMenuItem
        data-track-owner="features/thread/pane/files-view.tsx#RowActions:ResponsiveMenuItem[Add to chat]"
        onClick={() => {
          close();
          onAddToChat?.(mentionFor(path, directory));
        }}
      >
        <span className={menuIconClass}>
          <ChatGlyph />
        </span>
        Add to chat
      </ResponsiveMenuItem>
    </>
  );
}
