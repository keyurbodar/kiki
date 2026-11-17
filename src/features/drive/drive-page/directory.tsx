import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import type {
  DriveStorage,
  VolumeScopeDirectory,
  VolumeScopeSummary,
} from "@/data/api/schemas/drive";
import type { OrgId } from "@/data/api/schemas/ids";
import { driveScopeDirectoryAtom } from "@/data/atoms/drive";
import { resultValue } from "./session";

export interface ScopeDirectory {
  readonly items: ReadonlyArray<VolumeScopeSummary>;
  readonly storage: DriveStorage | null;
  readonly totalScopes: number;
  readonly pageCount: number;
  readonly failed: boolean;
  readonly loading: boolean;
  readonly refresh: () => void;
}

/** One server page of the scope directory, with its own request state. */
export interface ScopePageState {
  readonly value: VolumeScopeDirectory | undefined;
  readonly failed: boolean;
  readonly refresh: () => void;
}

/**
 * Every scope the server holds, in page order. The endpoint pages the scope
 * directory, but the table sorts, searches and pages it locally, so all pages
 * have to be read before any of that runs.
 */
export function mergeScopePages(
  pages: ReadonlyMap<number, VolumeScopeDirectory>,
): Pick<ScopeDirectory, "items" | "storage" | "totalScopes" | "pageCount"> {
  const ordered = [...pages.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, directory]) => directory);
  const head = pages.get(1);
  return {
    items: ordered.flatMap((directory) => directory.items),
    storage: head?.storage ?? null,
    totalScopes: head?.totalScopes ?? 0,
    pageCount: head?.pageCount ?? 1,
  };
}

/**
 * A directory is unavailable if any of its pages failed, and still loading
 * while any page of the first `pageCount` has neither arrived nor failed.
 * A partial table is never shown: an unseen page's scopes would be missing
 * from the sort and the search with nothing saying so.
 */
export function directoryStatus(
  pages: ReadonlyMap<number, ScopePageState>,
  first: ScopePageState,
): { readonly failed: boolean; readonly loading: boolean } {
  const reads = [first, ...pages.values()];
  const failed = reads.some((read) => read.failed);
  return {
    failed,
    loading: !failed && reads.some((read) => read.value === undefined),
  };
}

function ScopePageReader({
  orgId,
  page,
  onPage,
}: {
  orgId: OrgId;
  page: number;
  onPage: (page: number, state: ScopePageState) => void;
}) {
  const atom = driveScopeDirectoryAtom(orgId, page);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);
  const value = resultValue(result);
  const failed = AsyncResult.isFailure(result);
  useEffect(() => {
    onPage(page, { value, failed, refresh });
  }, [page, value, failed, refresh, onPage]);
  return null;
}

/** Reads the whole scope directory and hands it to its children. */
export function ScopeDirectoryProvider({
  orgId,
  children,
}: {
  orgId: OrgId;
  children: (directory: ScopeDirectory) => ReactNode;
}) {
  const [reads, setReads] = useState<{
    readonly orgId: OrgId;
    readonly pages: ReadonlyMap<number, ScopePageState>;
  }>(() => ({ orgId, pages: new Map() }));
  const pages = reads.orgId === orgId ? reads.pages : new Map();
  const collect = useCallback(
    (page: number, state: ScopePageState) =>
      setReads((previous) => {
        const current =
          previous.orgId === orgId
            ? previous.pages
            : new Map<number, ScopePageState>();
        const existing = current.get(page);
        if (
          existing !== undefined &&
          existing.value === state.value &&
          existing.failed === state.failed
        ) {
          return previous;
        }
        return { orgId, pages: new Map(current).set(page, state) };
      }),
    [orgId],
  );
  const firstAtom = driveScopeDirectoryAtom(orgId, 1);
  const firstResult = useAtomValue(firstAtom);
  const refreshFirst = useAtomRefresh(firstAtom);
  const first: ScopePageState = {
    value: resultValue(firstResult),
    failed: AsyncResult.isFailure(firstResult),
    refresh: refreshFirst,
  };
  const pageCount = Math.max(1, first.value?.pageCount ?? 1);
  const values = new Map<number, VolumeScopeDirectory>();
  if (first.value !== undefined) values.set(1, first.value);
  for (const [page, read] of pages) {
    if (read.value !== undefined) values.set(page, read.value);
  }
  const status = directoryStatus(pages, first);
  const refresh = () => {
    refreshFirst();
    for (const read of pages.values()) read.refresh();
  };
  const laterPages = Array.from(
    { length: pageCount - 1 },
    (_, index) => index + 2,
  );
  return (
    <>
      {laterPages.map((page) => (
        <ScopePageReader
          key={page}
          orgId={orgId}
          page={page}
          onPage={collect}
        />
      ))}
      {children({
        ...mergeScopePages(values),
        ...status,
        refresh,
      })}
    </>
  );
}
