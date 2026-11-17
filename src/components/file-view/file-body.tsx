import { type ReactNode, useContext, useEffect } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/primitives/button";
import { FileCode } from "./file-code";
import type { FileContent } from "./file-content";
import {
  DiffWrapContext,
  FileCopyTextContext,
  FileSourceModeContext,
  FileViewportContext,
} from "./file-context";
import { FileEmpty } from "./file-empty";
import {
  formatBytes,
  hasRenderedView,
  isMarkdown,
  isSvg,
  truncatedPreviewBytes,
} from "./file-kind";
import { DownloadProgress, FileLoading } from "./file-loading";
import { Preview } from "./file-view";
import { MediaBody } from "./media-body";
import { PanZoomMedia } from "./pan-zoom-media";

export type MarkdownBodyProps = { text: string; lede?: ReactNode };

export function MarkdownBody({ text, lede }: MarkdownBodyProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-4 md:py-6">
      {lede}
      <Markdown text={text} />
    </div>
  );
}

export type FileBodyProps = {
  content: FileContent;
  name: string;
  meta?: string;
  cacheKey?: string;
  rendered?: boolean;
  lede?: ReactNode;
  selectedLine?: number;
};

export function FileBody({
  content,
  name,
  meta,
  cacheKey,
  rendered = true,
  lede,
  selectedLine,
}: FileBodyProps) {
  const { wrap } = useContext(DiffWrapContext);
  const setSourceMode = useContext(FileSourceModeContext);
  const setCopyText = useContext(FileCopyTextContext);
  const onViewport = useContext(FileViewportContext);
  const source =
    content.kind === "text" && (!hasRenderedView(name) || !rendered);
  const copyable =
    content.kind === "text" &&
    content.truncatedFrom === undefined &&
    content.downloading === undefined
      ? content.text
      : undefined;

  useEffect(() => {
    setSourceMode(source);
    return () => setSourceMode(false);
  }, [setSourceMode, source]);

  useEffect(() => {
    setCopyText(copyable);
    return () => setCopyText(undefined);
  }, [setCopyText, copyable]);

  switch (content.kind) {
    case "symlink":
      return <FileEmpty line={`Symlink to ${content.target}`} />;
    case "no_preview":
      return <FileEmpty line="No preview for this file" sub={meta} />;
    case "downloading":
      return (
        <Preview>
          <DownloadProgress loaded={content.loaded} total={content.total} />
          <FileLoading />
        </Preview>
      );
    case "gated":
      return (
        <FileEmpty
          line={`${formatBytes(content.sizeBytes)} file`}
          action={
            <Button
              data-track-owner="shared/files/file-view.tsx#FileBody:Button[Load anyway]"
              variant="ghost"
              size="xs"
              onClick={content.onLoad}
            >
              Load anyway
            </Button>
          }
        />
      );
    case "media":
      return <MediaBody content={content} name={name} meta={meta} />;
    case "text":
      return (
        <Preview>
          {content.downloading !== undefined && (
            <DownloadProgress
              loaded={content.downloading.loaded}
              total={content.downloading.total}
            />
          )}
          {content.truncatedFrom !== undefined && (
            <div className="shrink-0 border-b-hairline border-border-1 px-3 py-1 text-2xs text-muted-foreground-2">
              Showing the first {formatBytes(truncatedPreviewBytes)} of{" "}
              {formatBytes(content.truncatedFrom)}
            </div>
          )}
          {rendered && isMarkdown(name) ? (
            <div ref={onViewport} className="min-h-0 flex-1 overflow-auto">
              <MarkdownBody text={content.text} lede={lede} />
            </div>
          ) : rendered && isSvg(name) ? (
            <PanZoomMedia
              key={cacheKey}
              url={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(content.text)}`}
              label={name}
              meta={meta}
            />
          ) : (
            <FileCode
              name={name}
              contents={content.text}
              cacheKey={cacheKey}
              overflow={wrap ? "wrap" : "scroll"}
              selectedLine={selectedLine}
              onScrollContainer={onViewport}
              className="min-h-0 flex-1"
            />
          )}
        </Preview>
      );
  }
}
