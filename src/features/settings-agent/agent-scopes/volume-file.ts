import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import {
  type DriveEntry,
  driveFileAtom,
  driveFileKey,
} from "@/data/atoms/agent-context";
import { resultValue, useAgentOrg } from "./use-agent-scopes";

export type VolumeFileContent =
  | { kind: "text"; text: string }
  | { kind: "binary" };

/** Capy's volume-file hook: one drive file's body, loading and failure state. */
export function useVolumeFile(entry: DriveEntry) {
  const { orgId } = useAgentOrg();
  const atom = driveFileAtom(driveFileKey(orgId ?? "", entry));
  const result = useAtomValue(atom);
  const retry = useAtomRefresh(atom);
  const file = resultValue(result);
  const content: VolumeFileContent | undefined =
    file === undefined
      ? undefined
      : file.type === "content"
        ? { kind: "text", text: file.content }
        : { kind: "binary" };
  return {
    content,
    failed: AsyncResult.isFailure(result) && content === undefined,
    retry,
  };
}
