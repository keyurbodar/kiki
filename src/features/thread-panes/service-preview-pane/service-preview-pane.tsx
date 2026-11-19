import { ServicePreview } from "@/features/thread/service-preview/service-preview";
import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";

export type ServicePreviewPaneProps = {
  /** The thread's organization; undefined only before the session resolves. */
  orgId: string | undefined;
  jamId: string;
  machineId: string;
  port: number;
  title: string;
};

/**
 * The `service_preview` tab: a port a thread exposed, in Capy's preview
 * surface. A pane that knows no organization cannot mint the hand-off URL, so
 * it says so rather than standing empty.
 */
export function ServicePreviewPane({
  orgId,
  jamId,
  machineId,
  port,
  title,
}: ServicePreviewPaneProps) {
  if (orgId === undefined) {
    return (
      <PreviewEmptyState
        art={previewArt.detective}
        line="Preview unavailable"
        sub={`${title} needs the thread's organization to open`}
      />
    );
  }
  return (
    <ServicePreview
      orgId={orgId}
      jamId={jamId}
      machineId={machineId}
      port={String(port)}
    />
  );
}
