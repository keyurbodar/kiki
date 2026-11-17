import { useState } from "react";
import {
  allCollapsed,
  type CollapseState,
  generatedPaths,
  initialCollapseState,
  isCollapsed,
  setCollapsed,
  toggleAll,
} from "@/components/diff-tab/collapse";
import { DiffFileCard } from "@/components/diff-tab/diff-file-card";
import { DiffNotice } from "@/components/diff-tab/diff-notice";
import {
  CollapseAllButton,
  DiffFilesMenu,
} from "@/components/diff-tab/diff-toolbar";
import { normalizeDiffFile } from "@/components/diff-tab/model";

export type LocalDiff = {
  files: ReadonlyArray<unknown>;
  truncated?: boolean;
};

export type LocalDiffTabProps = {
  pairKey: string;
  diff: LocalDiff | undefined;
};

export const localFileDomId = (path: string) =>
  `local-diff-file-${encodeURIComponent(path)}`;

export const localDiffSummary = (count: number, truncated: boolean) =>
  `${count} ${count === 1 ? "file" : "files"}${truncated ? ", more not shown" : ""}`;

const skeletonRows = ["first", "second", "third"];

export function LocalDiffTab({ pairKey, diff }: LocalDiffTabProps) {
  const [collapse, setCollapse] = useState<CollapseState>(initialCollapseState);

  if (diff === undefined)
    return (
      <div
        role="status"
        aria-label="Loading diff"
        data-slot="local-diff-tab"
        className="flex flex-col gap-2 p-2"
      >
        {skeletonRows.map((row) => (
          <div
            key={row}
            className="h-9 animate-pulse rounded-(--radius-card) border-hairline border-border-1 bg-secondary"
          />
        ))}
      </div>
    );

  const files = diff.files
    .map(normalizeDiffFile)
    .filter((file) => file.path !== "");
  if (files.length === 0)
    return <DiffNotice line="No changes in this pull request" />;

  const paths = files.map((file) => file.path);
  const generated = generatedPaths(files);
  const everyCollapsed = allCollapsed(collapse, paths, generated);
  const openFile = (path: string) => {
    if (isCollapsed(collapse, path, generated))
      setCollapse((state) => setCollapsed(state, path, false));
    requestAnimationFrame(() =>
      document
        .getElementById(localFileDomId(path))
        ?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  return (
    <div
      data-slot="local-diff-tab"
      data-pair-key={pairKey}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex h-9 shrink-0 items-center gap-1 px-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground-2">
          {localDiffSummary(files.length, diff.truncated === true)}
        </span>
        <DiffFilesMenu paths={paths} onOpenFile={openFile} />
        <CollapseAllButton
          allCollapsed={everyCollapsed}
          onToggle={() => setCollapse(toggleAll(everyCollapsed))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 p-2">
          {files.map((file) => (
            <DiffFileCard
              key={file.path}
              file={file}
              domId={localFileDomId(file.path)}
              collapsed={isCollapsed(collapse, file.path, generated)}
              onCollapsedChange={(path, collapsed) =>
                setCollapse((state) => setCollapsed(state, path, collapsed))
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
