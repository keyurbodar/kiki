import { useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import {
  type DiffFile,
  DiffFileCard,
  fileDomId,
  type PullRef,
  readyDiff,
  usePullDiff,
} from "@/components/diff-tab";
import { GuideBody } from "@/components/guide";
import { ReviewedCheckbox } from "@/components/reviewed-file";
import { pullGuideAtom } from "@/data/atoms/pullGuides";
import { decodePullGuide, guidePullLabel, type PullGuide } from "./guide-data";
import { resultValue } from "./result";

const noticeClassName =
  "pull-guide flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center";

const filePathClassName =
  "flex items-center gap-2 px-3 py-1.5 text-xs font-normal text-muted-foreground-2";

const ignoreChange = () => {};

/** The guide's files keyed by their path and their pre-rename path. */
const filesByPath = (
  files: ReadonlyArray<DiffFile>,
): ReadonlyMap<string, DiffFile> => {
  const byPath = new Map<string, DiffFile>();
  for (const file of files) byPath.set(file.path, file);
  for (const file of files) {
    const previous = file.previousPath;
    if (previous !== null && !byPath.has(previous)) byPath.set(previous, file);
  }
  return byPath;
};

/** The guide tab's waiting, empty and failed states. */
function GuideNotice({
  title,
  sub,
  busy,
}: {
  title: string;
  sub: string;
  busy?: boolean;
}) {
  return (
    <div
      className={noticeClassName}
      aria-busy={busy === true ? true : undefined}
      role={busy === true ? "status" : undefined}
    >
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="text-xs font-normal text-muted-foreground-2">{sub}</div>
    </div>
  );
}

/** The guide itself: Capy's chapter body, once the document has chapters. */
export function PullGuideView({
  guide,
  pull,
  files,
  onOpenFile = () => {},
}: {
  guide: PullGuide;
  pull: PullRef;
  files: ReadonlyMap<string, DiffFile>;
  onOpenFile?: (path: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  if (guide.status === "loading" || guide.status === "generating") {
    return (
      <GuideNotice
        busy
        title="Generating guide"
        sub="This usually takes about 20 seconds"
      />
    );
  }
  if (guide.status === "failed") {
    return (
      <GuideNotice
        title="The guide did not load"
        sub="Reopen the pull request to ask for it again"
      />
    );
  }
  if (guide.status === "empty") {
    return (
      <GuideNotice
        title="No guide yet"
        sub="Open the pull request in Capy to write one"
      />
    );
  }
  return (
    <GuideBody
      chapters={guide.chapters}
      collapsed={collapsed}
      onCollapseFiles={(paths, next) =>
        setCollapsed((current) => {
          const updated = new Set(current);
          for (const path of paths) {
            if (next) updated.add(path);
            else updated.delete(path);
          }
          return updated;
        })
      }
      onOpenFile={onOpenFile}
      renderFile={(file) => {
        const diff = files.get(file.path);
        if (diff === undefined) {
          return (
            <div className={filePathClassName}>
              <span className="truncate">{file.path}</span>
            </div>
          );
        }
        return (
          <DiffFileCard
            file={diff}
            domId={fileDomId(diff.path)}
            collapsed={false}
            collapsible={false}
            trailing={
              <ReviewedCheckbox
                pull={pull}
                path={diff.path}
                onChecked={ignoreChange}
              />
            }
          />
        );
      }}
    />
  );
}

/** The Guide tab: the pull's guide document, from the guide endpoint. */
export function PullGuideTab({ pull }: { pull: PullRef }) {
  const result = useAtomValue(pullGuideAtom(pull.orgId, pull.id));
  const guide =
    result === undefined || !("_tag" in result)
      ? ({ status: "loading" } as PullGuide)
      : decodePullGuide(resultValue(result));
  const diff = readyDiff(usePullDiff(pull));
  return (
    <div className="pull-guide flex min-h-0 flex-1 flex-col">
      <PullGuideView
        guide={guide}
        pull={pull}
        files={filesByPath(diff?.files ?? [])}
      />
    </div>
  );
}

export { guidePullLabel };
