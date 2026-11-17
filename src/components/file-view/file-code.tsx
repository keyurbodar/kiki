import { parseDiffFromFile } from "@pierre/diffs";
import { FileDiff, File as PierreFile } from "@pierre/diffs/react";
import type { ViewportHandler } from "./file-context";
import { PreviewSource } from "./file-view";

export type FileCodeProps = {
  name: string;
  contents: string;
  cacheKey?: string;
  overflow?: "wrap" | "scroll";
  lineNumbers?: boolean;
  selectedLine?: number;
  onScrollContainer?: ViewportHandler;
  className?: string;
};

export function FileCode({
  name,
  contents,
  cacheKey,
  overflow = "wrap",
  lineNumbers = true,
  selectedLine,
  onScrollContainer,
  className,
}: FileCodeProps) {
  return (
    <PreviewSource ref={onScrollContainer} className={className}>
      <PierreFile
        file={{ name, contents, cacheKey }}
        selectedLines={
          selectedLine === undefined
            ? undefined
            : { start: selectedLine, end: selectedLine }
        }
        options={{
          disableFileHeader: true,
          disableLineNumbers: !lineNumbers,
          overflow,
          themeType: "system",
        }}
      />
    </PreviewSource>
  );
}

export const textDiff = (name: string, before: string, after: string) =>
  before === after
    ? undefined
    : parseDiffFromFile({ name, contents: before }, { name, contents: after });

export type FileTextDiffProps = {
  fileDiff: NonNullable<ReturnType<typeof textDiff>>;
  overflow?: "wrap" | "scroll";
  onScrollContainer?: ViewportHandler;
  className?: string;
};

export function FileTextDiff({
  fileDiff,
  overflow = "wrap",
  onScrollContainer,
  className,
}: FileTextDiffProps) {
  return (
    <PreviewSource ref={onScrollContainer} className={className}>
      <FileDiff
        fileDiff={fileDiff}
        options={{
          diffStyle: "unified",
          disableFileHeader: true,
          expandUnchanged: true,
          overflow,
          themeType: "system",
        }}
      />
    </PreviewSource>
  );
}
