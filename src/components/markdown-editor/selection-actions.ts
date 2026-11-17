import { createContext } from "react";

export type MarkdownEditorSelectionActions = {
  comment: () => void;
  text: string;
};

export const MarkdownEditorSelectionActionsContext =
  createContext<MarkdownEditorSelectionActions | null>(null);
