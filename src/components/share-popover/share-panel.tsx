import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button, ButtonIcon } from "@/primitives/button";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { CheckmarkIcon, CopyIcon, TrashCanIcon } from "./icons";
import {
  SHARE_VISIBILITIES,
  type ShareLink,
  type ShareVisibility,
} from "./share-visibility";

const track = (owner: string) => `shared/drive/share-popover.tsx#${owner}`;

export interface SharePanelProps {
  readonly share: ShareLink | undefined;
  readonly pending: boolean;
  readonly removing: boolean;
  readonly failed?: string | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly onVisibility: (visibility: ShareVisibility) => void;
  readonly onRemove: () => void;
}

export const shareDescription = (
  share: ShareLink | undefined,
  visibility: ShareVisibility,
) =>
  share === undefined || share.manageable
    ? SHARE_VISIBILITIES.find((option) => option.id === visibility)?.description
    : `${share.createdBy ?? "Another member"} controls who can open it`;

export const displayShareUrl = (url: string) => url.replace(/^https?:\/\//, "");

export function SharePanel({
  share,
  failed,
  onRetry,
  pending,
  removing,
  onVisibility,
  onRemove,
}: SharePanelProps) {
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (copied === 0) return;
    const timer = setTimeout(() => setCopied(0), 2e3);
    return () => clearTimeout(timer);
  }, [copied]);

  const visibility = share?.visibility ?? "private";
  const live = share !== undefined && !removing;
  const manageable = share?.manageable ?? true;
  const copyable = live && (share.visibility !== "private" || share.manageable);
  const retryable =
    share === undefined && failed !== undefined && onRetry !== undefined;

  const copy = () => {
    if (share === undefined) return;
    void navigator.clipboard.writeText(share.url).then(
      () => setCopied((count) => count + 1),
      () => undefined,
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex h-8 items-center gap-2 rounded-md bg-secondary pl-2.5",
          retryable ? "pr-1" : "pr-2.5",
        )}
      >
        {share === undefined ? (
          failed === undefined ? (
            <SkeletonPanel className="flex min-w-0 flex-1 items-center">
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="sr-only"
              >
                Creating link
              </div>
              <div
                aria-hidden
                className="shimmer-surface shimmer-surface-motion-safe h-3 w-48 rounded"
                style={
                  {
                    "--shimmer-surface-base": "var(--secondary)",
                    "--shimmer-surface-gradient":
                      "var(--gradient-skeleton-darker)",
                  } as React.CSSProperties
                }
              />
            </SkeletonPanel>
          ) : (
            <span
              role="alert"
              className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground-2"
            >
              {failed}
            </span>
          )
        ) : (
          <span
            title={share.url}
            className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground-1"
          >
            {displayShareUrl(share.url)}
          </span>
        )}
        {retryable && (
          <Button
            data-track-owner={track("SharePanel:Button[Retry]")}
            variant="ghost"
            size="xs"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {/* biome-ignore lint/a11y/useSemanticElements: Capy renders the segmented control as a div group */}
        <div
          role="group"
          aria-label="Who can open the link"
          aria-busy={pending || undefined}
          className="relative flex items-center gap-0.5 rounded-lg border-hairline border-border-2 bg-secondary p-0.5 [&>[data-selected]]:bg-card [&>[data-selected]]:shadow-card [&>button]:relative"
        >
          {SHARE_VISIBILITIES.map((option) => (
            <Button
              key={option.id}
              data-track-owner={track("SharePanel:Button.1")}
              variant="segmented"
              size="xs"
              className="flex-1"
              disabled={!live || !manageable}
              data-selected={visibility === option.id ? "" : undefined}
              aria-pressed={visibility === option.id}
              onClick={() => onVisibility(option.id)}
            >
              <ButtonIcon
                data-loading={
                  pending && visibility === option.id ? "" : undefined
                }
              >
                <option.icon className="size-(--icon-sm)" />
              </ButtonIcon>
              {option.label}
            </Button>
          ))}
        </div>
        <p className="h-4 truncate px-0.5 text-2xs leading-4 font-normal text-muted-foreground-2">
          {shareDescription(share, visibility)}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Button
          data-track-owner={track("SharePanel:Button[Remove link]")}
          variant="ghost"
          size="xs"
          aria-busy={removing || undefined}
          disabled={!live || !manageable}
          onClick={onRemove}
        >
          <ButtonIcon>
            <TrashCanIcon className="size-(--icon-sm)" />
          </ButtonIcon>
          Remove link
        </Button>
        <Button
          data-track-owner={track("SharePanel:Button.2")}
          variant="solid"
          size="xs"
          disabled={!copyable}
          onClick={copy}
        >
          <ButtonIcon>
            {copied > 0 ? (
              <CheckmarkIcon className="size-(--icon-sm)" />
            ) : (
              <CopyIcon className="size-(--icon-sm)" />
            )}
          </ButtonIcon>
          <span aria-live="polite" className="grid">
            <span
              className={cn(
                "col-start-1 row-start-1",
                copied > 0 && "invisible",
              )}
            >
              Copy link
            </span>
            <span
              className={cn(
                "col-start-1 row-start-1",
                copied === 0 && "invisible",
              )}
            >
              Copied
            </span>
          </span>
        </Button>
      </div>
    </>
  );
}
