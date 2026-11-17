import { useAtomSet } from "@effect/atom-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { revokeShareAtom, updateShareAtom } from "./share-data";
import {
  isPending,
  type PendingMap,
  prunePending,
  visibilityOf,
} from "./share-pending";
import {
  type ShareVisibility,
  shareErrorMessage,
  shareReactivityKeys,
} from "./share-visibility";
import { useActiveOrgId } from "./use-active-org-id";

export type ShareChange = "visibility" | "removed";

interface ShareState {
  readonly id: string;
  readonly visibility: ShareVisibility;
}

export interface ShareActions {
  readonly removing: boolean;
  readonly visibilityOf: (share: ShareState) => ShareVisibility;
  readonly pendingOf: (share: ShareState) => boolean;
  readonly setVisibility: (share: ShareState, to: ShareVisibility) => void;
  readonly remove: (share: ShareState) => void;
}

export function useShareActions(
  shares: ReadonlyArray<ShareState>,
  onChanged: (change: ShareChange) => void,
  orgIdOverride?: string,
): ShareActions {
  const activeOrgId = useActiveOrgId();
  const orgId = orgIdOverride ?? activeOrgId;
  const update = useAtomSet(updateShareAtom, { mode: "promise" });
  const revoke = useAtomSet(revokeShareAtom, { mode: "promise" });
  const [removing, setRemoving] = useState(false);
  const [pending, setPending] = useState<PendingMap>(() => new Map());
  const inFlight = useRef(new Set<string>());
  const latest = useRef(new Map<string, ShareVisibility>());
  const reactivityKeys = shareReactivityKeys(orgId);

  useEffect(() => {
    setPending((current) => prunePending(current, shares));
  }, [shares]);

  const send = (shareId: string, to: ShareVisibility) => {
    if (orgId === undefined) return;
    inFlight.current.add(shareId);
    update({
      params: { orgId, shareId },
      payload: { visibility: to },
      reactivityKeys,
    }).then(
      () => {
        inFlight.current.delete(shareId);
        const queued = latest.current.get(shareId);
        if (queued !== undefined && queued !== to) return send(shareId, queued);
        latest.current.delete(shareId);
        setPending((current) => {
          const entry = current.get(shareId);
          return entry === undefined
            ? current
            : new Map(current).set(shareId, { ...entry, settled: true });
        });
        onChanged("visibility");
      },
      (error: unknown) => {
        inFlight.current.delete(shareId);
        latest.current.delete(shareId);
        setPending(
          (current) => new Map([...current].filter(([id]) => id !== shareId)),
        );
        onChanged("visibility");
        toast.error(
          shareErrorMessage(error, "Could not change who can open the link"),
        );
      },
    );
  };

  return {
    removing,
    visibilityOf: (share) => visibilityOf(pending, share),
    pendingOf: (share) => isPending(pending, share),
    setVisibility: (share, to) => {
      if (
        orgId === undefined ||
        removing ||
        visibilityOf(pending, share) === to
      )
        return;
      latest.current.set(share.id, to);
      setPending((current) =>
        new Map(current).set(share.id, {
          from: share.visibility,
          to,
          settled: false,
        }),
      );
      if (!inFlight.current.has(share.id)) send(share.id, to);
    },
    remove: (share) => {
      if (orgId === undefined || removing) return;
      setRemoving(true);
      revoke({ params: { orgId, shareId: share.id }, reactivityKeys })
        .then(
          () => {
            onChanged("removed");
            toast.success("Link removed");
          },
          (error: unknown) =>
            toast.error(shareErrorMessage(error, "Could not remove the link")),
        )
        .finally(() => setRemoving(false));
    },
  };
}
