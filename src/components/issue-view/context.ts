import { createContext, useContext } from "react";

/**
 * How issue references open from inside an issue view. The page navigates; a
 * panel or pane swaps its own content (Capy's issue view context).
 */
export interface IssueViewContextValue {
  readonly openIssue?: (code: string) => void;
  readonly issueClickMode?: "pane" | "collection";
  readonly openThread?: (threadId: string) => boolean;
  readonly openPull?: (pull: {
    repo: string;
    number: number;
    url: string;
  }) => void;
}

export const IssueViewContext = createContext<IssueViewContextValue>({});

export const useIssueViewContext = () => useContext(IssueViewContext);
