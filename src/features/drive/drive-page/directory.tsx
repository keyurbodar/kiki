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

const scopeDirectory = (
  pages: ReadonlyMap<number, VolumeScopeDirectory>,
  first: AsyncResult.AsyncResult<VolumeScopeDirectory, unknown>,
  refresh: () => void,
): ScopeDirectory => {
  const loading = resultValue(first) === undefined;
  return {
    ...mergeScopePages(pages),
    failed: AsyncResult.isFailure(first),
    loading: loading && !AsyncResult.isFailure(first),
    refresh,
  };
};

function ScopePageReader({
  orgId,
  page,
  onPage,
}: {
  orgId: OrgId;
  page: number;
  onPage: (page: number, directory: VolumeScopeDirectory) => void;
}) {
  const result = useAtomValue(driveScopeDirectoryAtom(orgId, page));
  const directory = resultValue(result);
  useEffect(() => {
    if (directory !== undefined) onPage(page, directory);
  }, [page, directory, onPage]);
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
    readonly pages: ReadonlyMap<number, VolumeScopeDirectory>;
  }>(() => ({ orgId, pages: new Map() }));
  const pages = reads.orgId === orgId ? reads.pages : new Map();
  const collect = useCallback(
    (page: number, directory: VolumeScopeDirectory) =>
      setReads((previous) => {
        const current =
          previous.orgId === orgId
            ? previous.pages
            : new Map<number, VolumeScopeDirectory>();
        if (current.get(page) === directory) return previous;
        return { orgId, pages: new Map(current).set(page, directory) };
      }),
    [orgId],
  );
  const first = useAtomValue(driveScopeDirectoryAtom(orgId, 1));
  const refresh = useAtomRefresh(driveScopeDirectoryAtom(orgId, 1));
  const head = resultValue(first);
  const collected = head === undefined ? pages : new Map(pages).set(1, head);
  const pageCount = Math.max(1, head?.pageCount ?? 1);
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
      {children(scopeDirectory(collected, first, refresh))}
    </>
  );
}
