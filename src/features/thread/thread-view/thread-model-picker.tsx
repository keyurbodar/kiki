import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { defaultSelection, ModelPicker } from "@/components/model-picker";
import type { JamId, OrgId } from "@/data/api/schemas/ids";
import { threadAtom, threadKey } from "@/data/atoms/jams";

export type ThreadModelPickerProps = {
  orgId: string;
  jamId: string;
};

/**
 * The model the thread answers with. `model` is the thread's own pick and
 * `servedModel` the model its last turn ran on; a thread with neither runs on
 * the org default, which is where the picker starts.
 *
 * Read-only: Capy lands a picked model on the next message, and neither the
 * message payload our send builder produces nor any jam endpoint carries one,
 * so the picker shows the thread's model and opens for inspection without
 * switching it.
 */
export function ThreadModelPicker({ orgId, jamId }: ThreadModelPickerProps) {
  const detail = AsyncResult.getOrElse(
    useAtomValue(threadAtom(threadKey(orgId as OrgId, jamId as JamId))),
    () => null,
  );
  const model = detail?.model ?? detail?.servedModel ?? null;
  return (
    <ModelPicker
      orgId={orgId}
      value={
        model === null
          ? defaultSelection
          : { modelId: model.modelId, fast: false, pro: false }
      }
      composer
    />
  );
}
