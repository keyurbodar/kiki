import { createContext, useContext } from "react";

/**
 * Capy's setup dialog state. Both triggers open the same dialog: the projects
 * page passes `intent: "project"` with `mode: { kind: "create" }`, and the
 * phone's project sheet passes the same state so a press there lands on the
 * one create surface instead of a second copy of it.
 */
export type CreateProjectDialogState = {
  readonly open: boolean;
  readonly intent: "project";
  readonly mode: { readonly kind: "create" };
};

export const OpenCreateProjectDialogContext = createContext<
  ((state: CreateProjectDialogState) => void) | null
>(null);

export function useOpenCreateProjectDialog() {
  return useContext(OpenCreateProjectDialogContext);
}
