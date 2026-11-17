import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import { ChevronRightSmall } from "@/components/issue-parts";
import {
  IssueStatusGlyph,
  IssueView,
  IssueViewContext,
  IssueViewHeader,
  useIssueDetail,
} from "@/components/issue-view";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";

const crumb =
  "shrink-0 font-medium text-muted-foreground-2 transition-colors duration-100 hover:text-foreground";

/** Shown when the issue does not exist or the viewer cannot read it. */
export function IssueNotFound() {
  return (
    <div
      data-slot="issue-not-found"
      className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center"
    >
      <span className="text-sm font-medium text-foreground">
        Issue not found
      </span>
      <span className="text-sm text-muted-foreground-2">
        It was moved, or you don't have access to its project
      </span>
    </div>
  );
}

/** /issues/$code: breadcrumbs, the issue's menus and the issue itself. */
export function IssuePage({ code }: { code: string }) {
  const { orgId, detail, missing } = useIssueDetail(code);
  const title =
    detail === undefined
      ? undefined
      : `${detail.issue.code} ${detail.issue.title}`;
  useEffect(() => {
    if (title !== undefined) document.title = title;
  }, [title]);
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 bg-panel px-2">
        <span className="ml-2.5 flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-foreground">
          <Link to="/issues" className={crumb}>
            Issues
          </Link>
          <ChevronRightSmall
            aria-hidden
            className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
          />
          {detail?.parent != null && (
            <>
              <Link
                to="/issues/$code"
                params={{ code: detail.parent.code }}
                className={`${crumb} flex max-w-64 min-w-0 items-center gap-1.5`}
              >
                <span className="shrink-0">{detail.parent.code}</span>
                <span className="min-w-0 truncate">{detail.parent.title}</span>
              </Link>
              <ChevronRightSmall
                aria-hidden
                className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
              />
            </>
          )}
          {detail === undefined ? (
            <span className="min-w-0 truncate">{code}</span>
          ) : (
            <>
              <IssueStatusGlyph orgId={orgId} issue={detail.issue} />
              <span className="min-w-0 truncate">{detail.issue.title}</span>
            </>
          )}
        </span>
      </AppTopBar>
      {missing ? (
        <IssueNotFound />
      ) : (
        <IssueViewContext.Provider value={{ issueClickMode: "pane" }}>
          <IssueViewHeader code={code} />
          <ScrollArea className="min-h-0 flex-1">
            <ScrollAreaViewport className="h-full overscroll-contain [overflow-anchor:none]">
              <IssueView code={code} />
            </ScrollAreaViewport>
          </ScrollArea>
        </IssueViewContext.Provider>
      )}
    </div>
  );
}
