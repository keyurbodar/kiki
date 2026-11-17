import { createContext, useContext } from "react";
import type { FolderSection } from "./share-data";

export type ShareTarget =
  | { readonly kind: "thread"; readonly id: string; readonly name: string }
  | { readonly kind: "folder"; readonly folder: FolderSection };

export const OpenShareDialogContext = createContext<
  ((target: ShareTarget) => void) | null
>(null);

export function useOpenShareDialog() {
  return useContext(OpenShareDialogContext);
}
