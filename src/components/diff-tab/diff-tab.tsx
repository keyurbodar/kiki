import { useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useEffectEvent, useState } from "react";
import { FileActionsMenu } from "@/components/file-actions";
import { FindingCard } from "@/components/finding-card";
import { normalizeFindings } from "@/components/finding-card/finding";
import { ReviewedCheckbox } from "@/components/reviewed-file";
import { pullReviewAtom } from "./atoms";
import {
  allCollapsed,
  type CollapseState,
  generatedPaths,
  initialCollapseState,
  isCollapsed,
  setCollapsed,
  toggleAll,
} from "./collapse";
import { DiffFileCard } from "./diff-file-card";
import { DiffNotice } from "./diff-notice";
import { DiffToolbar } from "./diff-toolbar";
import { findingsOnUnchangedFiles, groupFindings } from "./discussions";
import { fileDomId, type PullRef } from "./model";
import { diffNotes } from "./rows";
import { usePullDiff } from "./use-pull-diff";
import "./diff-tab.css";

const columnClass =
  "mx-auto flex w-full max-w-[calc(var(--diff-card-max)+var(--spacing)*6)] flex-col";

export type DiffTabAnchor = {
  file?: string;
  discussionId?: string;
  nonce: number;
};

export type DiffTabProps = {
  pull: PullRef;
  anchor?: DiffTabAnchor | null;
  railHosted?: boolean;
  diffStyle?: "unified" | "split";
};

const scrollToFile = (path: string) => {
  document.getElementById(fileDomId(path))?.scrollIntoView({
    block: "start",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
};

export function DiffTab({
  pull,
  anchor = null,
  railHosted = false,
  diffStyle = "unified",
}: DiffTabProps) {
  const diffState = usePullDiff(pull);
  const reviewResult = useAtomValue(pullReviewAtom(pull.orgId, pull.id));
  const review = Option.getOrUndefined(AsyncResult.value(reviewResult));
  const findings = normalizeFindings(
    typeof review === "object" && review !== null
      ? (review as { findings?: unknown }).findings
      : undefined,
  );
  const [collapse, setCollapse] = useState<CollapseState>(initialCollapseState);
  const [activeId, setActiveId] = useState<string | null>(null);

  const focusAnchor = useEffectEvent((anchor: DiffTabAnchor) => {
    if (anchor.discussionId !== undefined) setActiveId(anchor.discussionId);
    const finding = findings.find((item) => item.id === anchor.discussionId);
    const file = finding?.githubAnchor?.file ?? finding?.file ?? anchor.file;
    if (file === undefined || file === null) return;
    setCollapse((state) => setCollapsed(state, file, false));
    const frame = requestAnimationFrame(() => {
      const discussion = document.getElementById(
        `pull-discussion-${anchor.discussionId}`,
      );
      if (discussion === null) scrollToFile(file);
      else discussion.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  });

  const diffLoaded = diffState.status !== "loading";
  useEffect(() => {
    if (anchor !== null && diffLoaded) return focusAnchor(anchor);
  }, [anchor, diffLoaded]);

  if (diffState.status === "loading") return null;
  if (diffState.status === "failed")
    return <DiffNotice line="Diff unavailable" sub="Refresh to retry" />;
  const { diff } = diffState;
  if (diff === null) return <DiffNotice line="Diff unavailable" />;
  if (diff.unavailable)
    return (
      <DiffNotice
        line="Diff unavailable"
        sub="These commits are no longer on GitHub"
      />
    );

  const files = diff.files;
  const paths = files.map((file) => file.path);
  const generated = generatedPaths(files);
  const head = pull.diffPair?.head;
  const discussions = groupFindings(findings, head);
  const unchanged = findingsOnUnchangedFiles(findings, new Set(paths));
  const everyCollapsed = allCollapsed(collapse, paths, generated);

  const openFile = (path: string) => {
    if (isCollapsed(collapse, path, generated))
      setCollapse((state) => setCollapsed(state, path, false));
    requestAnimationFrame(() => scrollToFile(path));
  };

  const renderDiscussion = (id: string) => {
    const finding = findings.find((item) => item.id === id);
    return finding === undefined ? null : (
      <FindingCard pull={pull} finding={finding} insideDiff />
    );
  };

  return (
    <div
      data-slot="diff-tab"
      data-diff-style={diffStyle}
      className="diff-column flex min-h-0 flex-1 flex-col"
    >
      <div className={cx("shrink-0 pt-1 px-3", columnClass)}>
        <DiffToolbar
          paths={paths}
          notes={diffNotes(diff)}
          railHosted={railHosted}
          onOpenFile={openFile}
          allCollapsed={everyCollapsed}
          onToggleAll={() => setCollapse(toggleAll(everyCollapsed))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={cx(columnClass, "gap-3 p-3")}>
          {files.map((file) => {
            const fileDiscussions = discussions.get(file.path);
            return (
              <DiffFileCard
                key={file.path}
                file={file}
                domId={fileDomId(file.path)}
                collapsed={isCollapsed(collapse, file.path, generated)}
                onCollapsedChange={(path, collapsed) =>
                  setCollapse((state) => setCollapsed(state, path, collapsed))
                }
                trailing={
                  <>
                    <ReviewedCheckbox
                      pull={pull}
                      path={file.path}
                      onChecked={(path, checked) =>
                        setCollapse((state) =>
                          setCollapsed(state, path, checked),
                        )
                      }
                    />
                    <FileActionsMenu pull={pull} path={file.path} />
                  </>
                }
                lineComments={fileDiscussions?.lines}
                fileComments={fileDiscussions?.file}
                activeId={activeId}
                onToggleComment={(id) =>
                  setActiveId((current) => (current === id ? null : id))
                }
                renderDiscussion={renderDiscussion}
              />
            );
          })}
          {unchanged.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="px-1 text-xs text-muted-foreground-2">
                Comments on unchanged files
              </span>
              {unchanged.map((finding) => (
                <div key={finding.id} id={`pull-discussion-${finding.id}`}>
                  <FindingCard pull={pull} finding={finding} insideDiff />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
