import { useAtomSet } from "@effect/atom-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EnvironmentRequestRow } from "@/data/events";
import {
  useVariableEditor,
  VariableRows,
} from "@/features/thread/variable-row";
import { Button } from "@/primitives/button";
import { RequestTakeoverView } from "./request-takeover";
import {
  jamEventKey,
  listNames,
  setEnvironmentVariablesMutation,
} from "./requests";

const noExistingVariables: ReadonlyMap<string, string> = new Map();

export type EnvironmentRequestTakeoverProps = {
  orgId: string | undefined;
  jamId: string;
  parentJamId: string | null;
  entry: typeof EnvironmentRequestRow.Type;
  onLater: () => void;
  onDismiss?: () => void;
};

export function EnvironmentRequestTakeover({
  orgId,
  jamId,
  parentJamId,
  entry,
  onLater,
  onDismiss,
}: EnvironmentRequestTakeoverProps) {
  const request = entry.request;
  const editor = useVariableEditor({ lockedNames: request.variables });
  const [saving, setSaving] = useState<"project" | "thread">();
  const setVariables = useAtomSet(setEnvironmentVariablesMutation, {
    mode: "promise",
  });
  const complete = editor.rows.every((row) => row.value.trim() !== "");
  const blocked = !complete || saving !== undefined || orgId === undefined;

  const save = (toProject: boolean) => {
    if (orgId === undefined) return;
    const variables = editor.rows.map((row) => ({
      name: row.name,
      value: row.value,
    }));
    setSaving(toProject ? "project" : "thread");
    setVariables({
      params: { orgId, jamId },
      payload: {
        variables,
        saveToProject: toProject || undefined,
        requestToolCallId: request.toolCallId,
      },
      reactivityKeys: [
        jamId,
        ...(parentJamId === null ? [] : [parentJamId]),
        jamEventKey(jamId),
      ],
    }).then(
      () => {
        toast.success(
          `${variables.map((variable) => variable.name).join(", ")} sent`,
        );
        editor.reset();
      },
      () => {
        toast.error("Could not send the variables");
        setSaving(undefined);
      },
    );
  };

  return (
    <RequestTakeoverView
      label="Environment variables"
      heading={`Add ${listNames(request.variables)}`}
      reason={request.reason}
      onLater={onLater}
      onDismiss={onDismiss}
      actions={
        <>
          <Button
            size="xs"
            variant="outline"
            disabled={blocked}
            aria-busy={saving === "project" || undefined}
            onClick={() => save(true)}
          >
            Save to project
          </Button>
          <Button
            size="xs"
            intent="accent"
            disabled={blocked}
            aria-busy={saving === "thread" || undefined}
            onClick={() => save(false)}
          >
            {request.variables.length === 1 ? "Save" : "Save all"}
          </Button>
        </>
      }
    >
      <VariableRows
        editor={editor}
        existingVariables={noExistingVariables}
        idPrefix="env-request"
        descriptions={false}
      />
    </RequestTakeoverView>
  );
}
