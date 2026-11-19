import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import { idlePaperFilesAtom, paperFilesAtom } from "@/data/atoms/paper";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { PaperView } from "@/features/thread/paper-view";
import {
  type PaperError,
  paperError,
} from "@/features/thread/paper-view/paper-view-logic.ts";
import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type PaperPaneProps = {
  orgId: OrgId | undefined;
  jamId: string;
  fileId: string;
  title: string | null;
};

type Embed =
  | { state: "open" }
  | { state: "failed"; error: PaperError | undefined };

const rows = (value: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(value) ? (value as ReadonlyArray<Record<string, unknown>>) : [];

/**
 * The `paper` tab: a Paper file embedded in the panel. Two reads decide what it
 * shows — the thread's Paper session, so a file Paper never saw says so instead
 * of loading a dead embed, and an embed mint, which is what Capy asks for
 * before the canvas loads.
 */
export function PaperPane({ orgId, jamId, fileId, title }: PaperPaneProps) {
  const files = useAtomValue(
    orgId === undefined ? idlePaperFilesAtom : paperFilesAtom(orgId, jamId),
  );
  const mint = useMemo(() => ApiClient.mutation("paper", "mintPaperEmbed"), []);
  const request = useAtomSet(mint, { mode: "promiseExit" });
  const [embed, setEmbed] = useState<Embed | undefined>();

  const inSession =
    AsyncResult.isSuccess(files) &&
    rows(files.value).some((file) => file.id === fileId);
  const known = AsyncResult.isSuccess(files) ? inSession : undefined;

  useEffect(() => {
    // `embed` undefined is "not minted yet"; a retry puts it back here, which is
    // what re-runs this effect. A file the session does not hold is never minted.
    if (orgId === undefined || embed !== undefined || known !== true) return;
    let live = true;
    request({ params: { orgId, jamId }, payload: { fileId } }).then((exit) => {
      if (!live) return;
      setEmbed(
        Exit.isSuccess(exit)
          ? { state: "open" }
          : { state: "failed", error: paperError(exit.cause) },
      );
    });
    return () => {
      live = false;
    };
  }, [embed, fileId, jamId, known, orgId, request]);

  const label = title ?? fileId;
  const body = () => {
    if (orgId === undefined)
      return (
        <PreviewEmptyState
          art={previewArt.peer}
          line="Paper needs the thread's organization"
          sub={label}
        />
      );
    if (known === false)
      return (
        <PreviewEmptyState
          art={previewArt.hanging}
          line="This file is not in the thread's Paper session"
          sub={`${label} has no canvas here`}
          action={
            <Button
              variant="outline"
              size="xs"
              render={
                <a
                  href={`https://app.paper.design/file/${encodeURIComponent(fileId)}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Open in Paper
            </Button>
          }
        />
      );
    if (embed === undefined)
      return (
        <PreviewEmptyState
          art={previewArt.hanging}
          line="Opening the Paper file"
          sub={label}
          busy
        />
      );
    return (
      <PaperView
        fileId={fileId}
        title={title ?? undefined}
        {...(embed.state === "failed"
          ? {
              error: embed.error ?? "unavailable",
              onRetry: () => setEmbed(undefined),
            }
          : {})}
      />
    );
  };

  return (
    <div data-slot="paper-pane" data-file={fileId} className="kiki-pane flex-1">
      <div className="kiki-pane-section shrink-0 border-b-hairline border-border-1">
        <span className="kiki-pane-section-trigger kiki-cell" data-col="text">
          <span className="truncate text-xs font-medium text-muted-foreground-1">
            {label}
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Open ${label} in Paper`}
          render={
            <a
              href={`https://app.paper.design/file/${encodeURIComponent(fileId)}`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <Icon name="arrow-corner-up-right" size="xs" />
        </Button>
      </div>
      {body()}
    </div>
  );
}
