import { Link } from "@tanstack/react-router";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { ArrowLeftGlyph, ArrowUpRightGlyph } from "./glyphs";
import {
  buildDurationMs,
  buildLabel,
  buildStatusBuckets,
  buildTitle,
  formatAgo,
  formatDuration,
  type SnapshotBuild,
} from "./logic";
import { dotsIcon, StatusBucketIcon } from "./status-icon";

/**
 * Stand-in for Capy's build-detail view (pane density) until the
 * dev-environment package ships it.
 */
export function BuildSummary({
  build,
  now,
}: {
  build: SnapshotBuild;
  now: number;
}) {
  const duration = buildDurationMs(build, now);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <StatusBucketIcon bucket={buildStatusBuckets[build.status]} />
        <span className="font-medium text-foreground">{buildLabel(build)}</span>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-2xs text-muted-foreground-2 tabular-nums">
          {duration !== undefined && <span>{formatDuration(duration)}</span>}
          <span>{formatAgo(build.createdAt, now)}</span>
        </span>
      </div>
      {build.failureReason !== null && (
        <pre className="overflow-auto rounded-md border-(length:--border-width-hairline) border-border-1 bg-card px-3 py-2 font-mono text-code-block leading-normal whitespace-pre-wrap text-muted-foreground-1">
          {build.failureReason}
        </pre>
      )}
    </div>
  );
}

export type BuildFocusViewProps = {
  projectId: string;
  buildId: string;
  build: SnapshotBuild | undefined;
  notFound: boolean;
  now: number;
  onBack: () => void;
};

export function BuildFocusView({
  projectId,
  buildId,
  build,
  notFound,
  now,
  onBack,
}: BuildFocusViewProps) {
  return (
    <div data-slot="setup-build-focus" className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-9 shrink-0 items-center gap-1 border-b-(length:--border-width-hairline) border-border-1 px-2">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onBack}
          aria-label="Back to Setup"
        >
          <ArrowLeftGlyph className="size-(--icon-sm)" />
        </Button>
        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {build === undefined ? "Build" : buildTitle(build)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto"
          aria-label="Open in settings"
          render={
            <Link
              to="/settings/projects/$projectId/dev-environment/builds/$buildId"
              params={{ projectId, buildId }}
            />
          }
        >
          <ArrowUpRightGlyph className="size-(--icon-sm)" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="h-full">
          <div className="flex flex-col gap-4 p-4">
            {build === undefined ? (
              <div className="flex flex-1 items-center justify-center py-16">
                {notFound ? (
                  <span className="text-sm text-muted-foreground-2">
                    Build not found
                  </span>
                ) : (
                  <Icon
                    name="progress-50"
                    className={`${dotsIcon} animate-spin`}
                  />
                )}
              </div>
            ) : (
              <BuildSummary build={build} now={now} />
            )}
          </div>
        </ScrollAreaViewport>
      </ScrollArea>
    </div>
  );
}
