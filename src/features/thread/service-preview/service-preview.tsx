import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useEffect, useMemo, useState } from "react";
import type { OrgId } from "@/data/api/schemas/ids";
import { machinePreviewsAtom } from "@/data/atoms/setup";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { ServicePreviewSurface } from "@/features/thread/service-preview-surface";
import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { Button } from "@/primitives/button";
import { previewDetail } from "./service-preview-logic.ts";

const useHandoff = () => {
  const atom = useMemo(
    () => ApiClient.mutation("machines", "previewHandoff"),
    [],
  );
  return useAtomSet(atom, { mode: "promiseExit" });
};

export type ServicePreviewProps = {
  readonly orgId?: string;
  readonly jamId: string;
  readonly machineId: string;
  readonly port: string;
};

type Handoff = { readonly url: string } | { readonly failure: string };

/**
 * A port a thread exposed, in Capy's preview surface: its own bar (history,
 * reload, the address) over the page. The hand-off read mints the URL the frame
 * loads, so a preview that is gone says why instead of standing empty.
 */
export function ServicePreview({
  orgId,
  jamId,
  machineId,
  port,
}: ServicePreviewProps) {
  const previews = useAtomValue(
    machinePreviewsAtom((orgId ?? "") as OrgId, jamId),
  );
  const handoff = useHandoff();
  const [state, setState] = useState<Handoff | undefined>();

  useEffect(() => {
    // `state` starts undefined and returns to it on Retry, so the same effect
    // mints the hand-off once and reloads on demand.
    if (orgId === undefined || state !== undefined) return;
    let live = true;
    handoff({ params: { machineId, port } }).then((exit) => {
      if (!live) return;
      if (Exit.isFailure(exit)) {
        setState({ failure: previewDetail(exit.cause) });
        return;
      }
      const value = exit.value as { url?: string; orgId?: string };
      // A hand-off that names its organization is checked against this one; a
      // response that names none cannot belong to a different thread's org.
      if (typeof value.orgId === "string" && value.orgId !== orgId) {
        setState({
          failure:
            "This preview belongs to another organization, switch to it to start the machine",
        });
        return;
      }
      setState(
        value.url === undefined
          ? { failure: "Nothing answered on the preview port" }
          : { url: value.url },
      );
    });
    return () => {
      live = false;
    };
  }, [handoff, machineId, orgId, port, state]);

  const rows =
    AsyncResult.isSuccess(previews) && Array.isArray(previews.value)
      ? (previews.value as ReadonlyArray<{
          machineId: string;
          port: string;
          title?: string;
          label?: string;
        }>)
      : [];
  const preview = rows.find(
    (row) => row.machineId === machineId && String(row.port) === port,
  );
  const title = preview?.title ?? preview?.label ?? `Port ${port}`;
  const failure = state !== undefined && "failure" in state ? state : undefined;
  const url = state !== undefined && "url" in state ? state.url : "";
  const reload = () => setState(undefined);

  return (
    <ServicePreviewSurface
      url={url}
      title={title}
      loading={state === undefined}
      failed={failure !== undefined}
      onReload={reload}
      onOpenNewTab={
        url === ""
          ? undefined
          : () => window.open(url, "_blank", "noopener,noreferrer")
      }
      placeholder={
        failure === undefined ? undefined : (
          <PreviewEmptyState
            art={previewArt.detective}
            line="Preview unavailable"
            sub={failure.failure}
            action={
              <Button variant="outline" size="xs" onClick={reload}>
                Retry
              </Button>
            }
          />
        )
      }
    >
      {url === "" ? (
        <PreviewEmptyState
          art={previewArt.detective}
          line="Opening the preview"
          sub={title}
          busy
        />
      ) : (
        <iframe
          title={title}
          src={url}
          className="size-full border-0 outline-none focus-visible:outline-ring-inset"
        />
      )}
    </ServicePreviewSurface>
  );
}
