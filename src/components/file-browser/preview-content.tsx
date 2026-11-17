import { cx } from "class-variance-authority";
import { FileIcon } from "@/components/directory-view/file-icon";
import { Markdown } from "@/components/markdown";
import type { PreviewContentValue, PreviewSize } from "./passive-preview";

const fadeMask =
  "[mask-image:linear-gradient(to_bottom,black_82%,transparent)]";

const codeType: Record<PreviewSize, string> = {
  shelf: "text-[0.5625rem] leading-[0.75rem]",
  index: "text-[0.46875rem] leading-[0.625rem]",
  list: "text-[0.1875rem] leading-[0.25rem]",
};

export type PreviewContentProps = {
  content: PreviewContentValue;
  name: string;
  size?: PreviewSize;
  className?: string;
};

export function PreviewContent({
  content,
  name,
  size = "shelf",
  className,
}: PreviewContentProps) {
  if (content.kind === "markdown")
    return (
      <div
        inert
        data-preview-kind="markdown"
        className={cx("h-full overflow-hidden p-2", fadeMask, className)}
      >
        <Markdown text={content.text} interactive={false} size="xs" />
      </div>
    );
  if (content.kind === "code")
    return (
      <div
        inert
        data-preview-kind="code"
        className={cx("h-full overflow-hidden", fadeMask, className)}
      >
        <pre
          data-cache-key={`${content.cacheKey}:preview`}
          className={cx(
            "pointer-events-none p-2 font-mono break-all whitespace-pre-wrap text-foreground",
            codeType[size],
          )}
        >
          {content.text}
        </pre>
      </div>
    );
  if (content.kind === "image")
    return (
      <div
        data-preview-kind="image"
        className={cx("h-full overflow-hidden", className)}
      >
        <img
          src={content.url}
          crossOrigin="anonymous"
          alt={name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  return (
    <div
      data-preview-kind="placeholder"
      className={cx(
        "flex h-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground-2",
        className,
      )}
    >
      <FileIcon name={name} className="size-6" />
      <span>{content.label}</span>
      {content.sub !== undefined && (
        <span className="text-center text-2xs text-muted-foreground-3">
          {content.sub}
        </span>
      )}
    </div>
  );
}

const skeletonLines = ["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"];

export function PreviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading preview"
      className="flex flex-col gap-2 p-2"
    >
      <div className="shimmer-surface h-3 w-1/2 rounded-sm" />
      {skeletonLines.map((width, index) => (
        <div
          key={`${width}-${index.toString()}`}
          className={cx("shimmer-surface h-2 rounded-sm", width)}
        />
      ))}
    </div>
  );
}
