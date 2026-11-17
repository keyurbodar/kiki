import { useAtomValue } from "@effect/atom-react";
import { useState } from "react";
import { GuideBody } from "@/components/guide";
import { pullGuideAtom } from "@/data/atoms/pullGuides";
import { usePullOrgId } from "./context";
import { decodePullGuide, guidePullLabel, type PullGuide } from "./guide-data";
import { resultValue } from "./result";

const noticeClassName =
  "pull-guide flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 text-center";

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
  onOpenFile = () => {},
}: {
  guide: PullGuide;
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
      renderFile={(file) => (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-normal text-muted-foreground-2">
          <span className="truncate">{file.path}</span>
        </div>
      )}
    />
  );
}

/** The Guide tab: the pull's guide document, from the guide endpoint. */
export function PullGuideTab({ pullId }: { pullId: string }) {
  const orgId = usePullOrgId();
  const result = useAtomValue(pullGuideAtom(orgId, pullId));
  const guide =
    result === undefined || !("_tag" in result)
      ? ({ status: "loading" } as PullGuide)
      : decodePullGuide(resultValue(result));
  return (
    <div className="pull-guide flex min-h-0 flex-1 flex-col">
      <PullGuideView guide={guide} />
    </div>
  );
}

export { guidePullLabel };
