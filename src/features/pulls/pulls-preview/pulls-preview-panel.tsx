import { PullPreview } from "@/components/pull-preview/pull-panel";
import { LocalPullsSection } from "../local-section";

export type PullsPreviewTarget =
  | {
      readonly kind: "pull";
      readonly pullId: string;
      readonly repo: string;
      readonly number: number;
    }
  | { readonly kind: "local"; readonly repo: string; readonly number: number };

/** The right panel that previews a pull (Capy's PullsPreviewPanel). */
export function PullsPreviewPanel({
  target,
  orgId,
  onClose,
  onOpenPull,
}: {
  target: PullsPreviewTarget | null;
  orgId?: string;
  onClose: () => void;
  onOpenPull?: (pull: { repo: string; number: number; url: string }) => void;
}) {
  if (target === null) {
    return (
      <div className="flex min-h-11 items-center px-4 text-sm text-muted-foreground-2">
        No pull request
      </div>
    );
  }
  return (
    <div
      data-slot="pulls-preview-panel"
      className="flex min-h-0 flex-1 flex-col"
    >
      <PullPreview
        org={orgId}
        repo={target.repo}
        number={target.number}
        pullId={target.kind === "pull" ? target.pullId : undefined}
        onClose={onClose}
        onOpenPull={onOpenPull}
      />
    </div>
  );
}

export type { LocalPull } from "../local-section";
export { LocalPullsSection };
