import type { ShareVisibility } from "./share-visibility";

export interface PendingVisibility {
  readonly from: ShareVisibility;
  readonly to: ShareVisibility;
  readonly settled: boolean;
}

export type PendingMap = ReadonlyMap<string, PendingVisibility>;

interface ShareState {
  readonly id: string;
  readonly visibility: ShareVisibility;
}

export const pendingEntry = (pending: PendingMap, share: ShareState) => {
  const entry = pending.get(share.id);
  return entry !== undefined &&
    (!entry.settled || entry.from === share.visibility)
    ? entry
    : undefined;
};

export const visibilityOf = (pending: PendingMap, share: ShareState) =>
  pendingEntry(pending, share)?.to ?? share.visibility;

export const isPending = (pending: PendingMap, share: ShareState) =>
  pendingEntry(pending, share)?.settled === false;

export const prunePending = (
  pending: PendingMap,
  shares: ReadonlyArray<ShareState>,
): PendingMap => {
  const stale = [...pending].filter(
    ([id, entry]) =>
      entry.settled &&
      shares.find((share) => share.id === id)?.visibility !== entry.from,
  );
  if (stale.length === 0) return pending;
  return new Map(
    [...pending].filter(([id]) => !stale.some(([staleId]) => staleId === id)),
  );
};
