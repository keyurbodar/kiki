import { useContext } from "react";
import { Button } from "@/primitives/button";
import { FileTextDiff, textDiff } from "./file-code";
import { type FileContent, textReady } from "./file-content";
import { DiffWrapContext, FileViewportContext } from "./file-context";
import { FileEmpty } from "./file-empty";
import { FileLoading } from "./file-loading";
import { Preview } from "./file-view";

export type FileCompareBodyProps = {
  name: string;
  before?: FileContent;
  after?: FileContent;
  failed?: boolean;
  onRetry?: () => void;
};

export function FileCompareBody({
  name,
  before,
  after,
  failed,
  onRetry,
}: FileCompareBodyProps) {
  const { wrap } = useContext(DiffWrapContext);
  const onViewport = useContext(FileViewportContext);
  const ready = textReady(before) && textReady(after);
  const beforeText = ready && before?.kind === "text" ? before.text : undefined;
  const afterText = ready && after?.kind === "text" ? after.text : undefined;
  if (failed)
    return (
      <FileEmpty
        line="Version unavailable"
        action={
          onRetry === undefined ? undefined : (
            <Button
              data-track-owner="shared/files/file-view.tsx#FileCompareBody:Button[Retry]"
              variant="ghost"
              size="xs"
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      />
    );
  if (!ready) return <FileLoading />;
  if (beforeText === undefined || afterText === undefined)
    return <FileEmpty line="No text diff for this file" />;
  const fileDiff = textDiff(name, beforeText, afterText);
  if (fileDiff === undefined || fileDiff.hunks.length === 0)
    return <FileEmpty line="No changes between these versions" />;
  return (
    <Preview>
      <FileTextDiff
        fileDiff={fileDiff}
        overflow={wrap ? "wrap" : "scroll"}
        onScrollContainer={onViewport}
        className="min-h-0 flex-1"
      />
    </Preview>
  );
}
