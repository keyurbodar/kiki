import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryTimeToLive } from "@/data/atoms/conventions.ts";
import { ApiClient } from "@/data/client/ApiClient.ts";
import { ServicePreviewSurface } from "@/features/thread/service-preview-surface";
import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { previewDetail } from "./service-preview-logic.ts";

const previewsAtom = ApiClient.query("machines", "listServicePreviews", {
  reactivityKeys: ["service-previews"],
  timeToLive: queryTimeToLive,
});

const useHandoff = () =>
  useAtomSet(ApiClient.mutation("machines", "previewHandoff"), {
    mode: "promiseExit",
  });

export type ServicePreviewProps = {
  readonly orgId?: string;
  readonly jamId: string;
  readonly machineId: string;
  readonly port: string;
};

export function ServicePreview({
  orgId,
  jamId,
  machineId,
  port,
}: ServicePreviewProps) {
  const previews = useAtomValue(
    previewsAtom({ params: { orgId: orgId ?? "acme", jamId } }),
  );
  const handoff = useHandoff();
  const [handoffUrl, setHandoff] = useState<
    { readonly url: string } | undefined
  >();

  useEffect(() => {
    if (orgId === undefined) return;
    let live = true;
    handoff({ params: { machineId, port } }).then((exit) => {
      if (!live) return;
      if (Exit.isFailure(exit)) {
        toast.error(previewDetail(exit.cause));
        return;
      }
      const value = exit.value as { url?: string; orgId?: string };
      if (value.orgId !== orgId) {
        toast.error(
          "This preview belongs to another organization, switch to it to start the machine",
        );
        return;
      }
      if (value.url !== undefined) setHandoff({ url: value.url });
    });
    return () => {
      live = false;
    };
  }, [handoff, machineId, orgId, port]);

  const failed = previews._tag === "Failure";
  const rows =
    previews._tag === "Success"
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
  return (
    <ServicePreviewSurface
      url={handoffUrl?.url ?? ""}
      failed={failed}
      title={preview?.title ?? preview?.label}
      onOpenNewTab={() => {
        if (handoffUrl !== undefined)
          window.open(handoffUrl.url, "_blank", "noopener,noreferrer");
      }}
      placeholder={
        failed ? (
          <PreviewEmptyState
            art={previewArt.detective}
            line="Preview unavailable"
            sub={previewDetail(
              previews._tag === "Failure" ? previews.cause : undefined,
            )}
          />
        ) : undefined
      }
    />
  );
}
