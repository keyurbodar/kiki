import { Link } from "@tanstack/react-router";
import { ArrowShareRight, CrossMedium } from "@/components/issue-parts";
import {
  IssueView,
  IssueViewContext,
  IssueViewHeader,
  useIssueDetail,
} from "@/components/issue-view";
import { Button } from "@/primitives/button";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { SideSheet, SideSheetContent } from "@/primitives/side-sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { IssueNotFound } from "../issue-page";

function IssuePanelBody({
  code,
  onSelect,
  onClose,
}: {
  code: string;
  onSelect: (code: string | undefined) => void;
  onClose: () => void;
}) {
  const { missing } = useIssueDetail(code);
  return (
    <IssueViewContext.Provider
      value={{ openIssue: onSelect, issueClickMode: "collection" }}
    >
      <IssueViewHeader
        code={code}
        identity
        trailing={
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open issue"
                    render={<Link to="/issues/$code" params={{ code }} />}
                  />
                }
              >
                <ArrowShareRight />
              </TooltipTrigger>
              <TooltipContent side="bottom">Open issue</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close issue panel"
                    onClick={onClose}
                  />
                }
              >
                <CrossMedium />
              </TooltipTrigger>
              <TooltipContent side="bottom">Close panel</TooltipContent>
            </Tooltip>
          </>
        }
      />
      {missing ? (
        <IssueNotFound />
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ScrollAreaViewport className="h-full overscroll-contain">
            <IssueView code={code} />
          </ScrollAreaViewport>
        </ScrollArea>
      )}
    </IssueViewContext.Provider>
  );
}

/**
 * One issue as a panel tab: the same body the side sheet shows, laid out for a
 * strip that already has the tab bar and the close button.
 */
export function IssuePane({
  code,
  onSelect,
}: {
  code: string;
  onSelect?: (code: string | undefined) => void;
}) {
  return (
    <div data-slot="issue-pane" className="flex min-h-0 flex-1 flex-col">
      <IssuePanelBody
        code={code}
        onSelect={onSelect ?? (() => undefined)}
        onClose={() => onSelect?.(undefined)}
      />
    </div>
  );
}

/** The issues list's side panel: one issue, opened beside the list. */
export function IssuePanel({
  code,
  onSelect,
}: {
  code: string | undefined;
  onSelect: (code: string | undefined) => void;
}) {
  const close = () => onSelect(undefined);
  return (
    <SideSheet
      open={code !== undefined}
      onOpenChange={(open) => !open && close()}
    >
      <SideSheetContent className="md:fixed md:inset-y-0 md:right-0 md:flex md:w-full md:max-w-2xl md:flex-col md:bg-panel md:shadow-plate">
        {code !== undefined && (
          <IssuePanelBody
            key={code}
            code={code}
            onSelect={onSelect}
            onClose={close}
          />
        )}
      </SideSheetContent>
    </SideSheet>
  );
}
