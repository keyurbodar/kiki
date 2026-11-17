import { previewArt } from "@/features/thread/service-preview-surface/art.ts";
import { PreviewEmptyState } from "@/features/thread/service-preview-surface/empty-state.tsx";
import { Button } from "@/primitives/button";
import { type PaperError, paperEmbedUrl } from "./paper-view-logic.ts";

export type PaperViewProps = {
  readonly fileId: string;
  readonly pageId?: string;
  readonly title?: string;
  readonly embedOrigin?: string;
  readonly error?: PaperError;
  readonly onRetry?: () => void;
};

export function PaperView({
  fileId,
  pageId,
  title = "Paper file",
  embedOrigin = "https://app.paper.design",
  error,
  onRetry,
}: PaperViewProps) {
  if (error === "not_connected") {
    return (
      <PreviewEmptyState
        art={previewArt.peer}
        line="Connect Paper to view this file"
        sub="The canvas shows your own Paper session"
        action={
          <Button
            variant="outline"
            size="xs"
            render={<a href="/settings/integrations/paper" />}
          >
            Open settings
          </Button>
        }
      />
    );
  }
  if (error === "unavailable") {
    return (
      <PreviewEmptyState
        art={previewArt.hanging}
        line="Couldn't open the canvas"
        sub="Paper didn't issue an embed session"
        action={
          <Button variant="outline" size="xs" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <iframe
          title={title}
          src={paperEmbedUrl(fileId, embedOrigin, pageId)}
          className="size-full border-0 outline-none focus-visible:outline-ring-inset"
        />
      </div>
    </div>
  );
}
