import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, type Atom } from "effect/reactivity";
import { useEffect, useState } from "react";
import { idleAtom } from "@/data/atoms/idle";
import { Button } from "@/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/primitives/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { volumeIdOf } from "./drive-ids";
import { ShareOsIcon } from "./icons";
import {
  createShareAtom,
  decodeShareList,
  volumeSharesAtom,
} from "./share-data";
import { SharePanel } from "./share-panel";
import { shareErrorMessage, shareReactivityKeys } from "./share-visibility";
import { useActiveOrgId } from "./use-active-org-id";
import { useShareActions } from "./use-share-actions";

export interface SharePopoverProps {
  readonly volume: { readonly id: string };
  readonly path: string;
  readonly disabled?: boolean;
}

const idleShares = idleAtom();

export function SharePopover({ volume, path, disabled }: SharePopoverProps) {
  const orgId = useActiveOrgId();
  const volumeId = volumeIdOf(volume.id);
  const sharesAtom: Atom.Atom<AsyncResult.AsyncResult<unknown, unknown>> =
    orgId === undefined || volumeId === undefined
      ? idleShares
      : volumeSharesAtom(orgId, volumeId);
  const result = useAtomValue(sharesAtom);
  const refresh = useAtomRefresh(sharesAtom);
  const value = Option.getOrUndefined(AsyncResult.value(result));
  const shares = value === undefined ? undefined : decodeShareList(value);
  const share = shares?.find((row) => row.path === path);
  const create = useAtomSet(createShareAtom, { mode: "promise" });
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<string>();
  const actions = useShareActions(shares ?? [], (change) => {
    refresh();
    if (change === "removed") setOpen(false);
  });

  const createLink = () => {
    if (orgId === undefined || volumeId === undefined || creating) return;
    setCreating(true);
    setFailed(undefined);
    create({
      params: { orgId, volumeId },
      payload: { path },
      reactivityKeys: shareReactivityKeys(orgId),
    })
      .then(refresh, (error: unknown) =>
        setFailed(shareErrorMessage(error, "Could not create a link")),
      )
      .finally(() => setCreating(false));
  };

  const needsLink =
    open &&
    share === undefined &&
    shares !== undefined &&
    failed === undefined &&
    !actions.removing;
  // biome-ignore lint/correctness/useExhaustiveDependencies: creates once per open, as Capy does
  useEffect(() => {
    if (needsLink) createLink();
  }, [needsLink]);

  const unavailable =
    AsyncResult.isFailure(result) && shares === undefined
      ? "Sharing unavailable"
      : undefined;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFailed(undefined);
      }}
    >
      <Tooltip>
        <TooltipTrigger
          data-track-owner="shared/drive/share-popover.tsx#SharePopover:TooltipTrigger.1"
          render={
            <PopoverTrigger
              data-track-owner="shared/drive/share-popover.tsx#SharePopover:PopoverTrigger.1"
              render={
                <Button
                  data-track-owner="shared/drive/share-popover.tsx#SharePopover:Button[Share]"
                  type="button"
                  variant="ghost"
                  intent={share === undefined ? "neutral" : "accent"}
                  size="icon-xs"
                  aria-label="Share"
                  disabled={disabled}
                >
                  <ShareOsIcon />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="bottom">Share</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="flex w-80 flex-col gap-3">
        <SharePanel
          share={
            share === undefined
              ? undefined
              : {
                  id: share.id,
                  url: share.url,
                  visibility: actions.visibilityOf(share),
                  createdBy: share.createdBy,
                  manageable: share.manageable,
                }
          }
          pending={share !== undefined && actions.pendingOf(share)}
          removing={actions.removing}
          failed={failed ?? unavailable}
          onRetry={createLink}
          onVisibility={(visibility) =>
            share !== undefined && actions.setVisibility(share, visibility)
          }
          onRemove={() => share !== undefined && actions.remove(share)}
        />
      </PopoverContent>
    </Popover>
  );
}
