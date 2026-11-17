import { type ReactNode, useState } from "react";
import type { ImportJob } from "@/components/import-job-indicator";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import {
  footerStatus,
  type ImportBridge,
  type ImportManifest,
  type ImportSource,
  sessionsSummary,
  sourceLabel,
} from "./import-model";
import {
  type CreateProjectProps,
  ImportReview,
  type ImportReviewState,
  useDeviceNoun,
} from "./import-review";

export type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: ImportSource;
  orgId: string;
  userId: string;
  deviceId?: string;
  bridge?: ImportBridge;
  manifest?: ImportManifest;
  renderCreateProject?: (props: CreateProjectProps) => ReactNode;
};

export function importDialogTitle(
  state: Pick<ImportReviewState, "step"> & { job: ImportJob | undefined },
  source: ImportSource | undefined,
) {
  if (state.job === undefined)
    return state.step === "sessions"
      ? `Select ${source === undefined ? "Codex" : sourceLabel(source)} sessions`
      : "Map projects";
  if (state.job.running) return "Importing sessions";
  return state.job.failed > 0 ? "Import needs attention" : "Import complete";
}

export function importDialogDescription(
  state: Pick<ImportReviewState, "step"> & { job: ImportJob | undefined },
  manifest: ImportManifest | undefined,
  source: ImportSource | undefined,
  noun: string,
) {
  if (state.job?.running)
    return "You can close this dialog while your sessions import in the background";
  if (state.job === undefined)
    return state.step === "sessions"
      ? `${sessionsSummary(manifest, source)} on this ${noun}`
      : "Choose where your selected sessions will go";
  return `Your original sessions stay on this ${noun}`;
}

export function ImportDialog({
  open,
  onOpenChange,
  source,
  orgId,
  userId,
  deviceId,
  bridge,
  manifest,
  renderCreateProject,
}: ImportDialogProps) {
  const [loaded, setLoaded] = useState<ImportManifest>();
  const noun = useDeviceNoun();
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {open ? (
          <ImportReview
            source={source}
            orgId={orgId}
            userId={userId}
            deviceId={deviceId}
            bridge={bridge}
            manifest={manifest}
            onManifest={setLoaded}
            renderCreateProject={renderCreateProject}
            header={(state) => (
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {importDialogTitle(state, source)}
                  {state.job === undefined ? (
                    <span className="shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground-3">
                      {state.step === "sessions" ? "1" : "2"} of 2
                    </span>
                  ) : null}
                </DialogTitle>
                <DialogDescription
                  className={
                    state.job !== undefined && !state.job.running
                      ? "sr-only"
                      : undefined
                  }
                >
                  {importDialogDescription(state, loaded, source, noun)}
                </DialogDescription>
              </DialogHeader>
            )}
            body={(content) => <DialogBody>{content}</DialogBody>}
            onFinished={close}
            footer={(state) =>
              state.job?.running ? (
                <DialogFooter>
                  <Button variant="ghost" onClick={close}>
                    Close
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter className="items-center">
                  {state.job === undefined ? (
                    <>
                      <span className="mr-auto flex items-center gap-2 text-xs text-muted-foreground-2">
                        {footerStatus(
                          state.selectedCount,
                          state.step,
                          state.ready,
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        onClick={state.step === "projects" ? state.back : close}
                        disabled={state.running}
                      >
                        {state.step === "projects" ? "Back" : "Cancel"}
                      </Button>
                      <Button
                        intent="accent"
                        onClick={
                          state.step === "sessions" ? state.next : state.confirm
                        }
                        disabled={
                          state.running ||
                          !state.ready ||
                          state.selectedCount === 0
                        }
                        aria-busy={state.running || undefined}
                      >
                        {state.step === "sessions" ? "Next" : "Import"}
                      </Button>
                    </>
                  ) : (
                    <>
                      {state.job.failed > 0 ? (
                        <Button variant="ghost" onClick={close}>
                          Close
                        </Button>
                      ) : null}
                      <Button
                        intent="accent"
                        onClick={
                          state.job.failed > 0 ? state.retry : state.finish
                        }
                      >
                        {state.job.failed > 0 ? "Retry failed" : "Done"}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              )
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
