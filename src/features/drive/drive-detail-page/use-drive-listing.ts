import { useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult, Atom } from "effect/reactivity";
import type { Volume } from "@/data/api/schemas/drive";
import {
  type DriveScopeQuery,
  driveTreeAtom,
  driveVolumesAtom,
} from "@/data/atoms/drive";

/** One file of a scope, with the volume version it lives in. */
export interface DriveEntry {
  readonly path: string;
  readonly mode: number;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly volume: Volume;
  readonly versionId: string;
}

const idle = Atom.make(AsyncResult.initial<never, never>());
const value = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

/** Capy's main volume of a scope is its `artifacts` namespace. */
export const mainVolume = (volumes: ReadonlyArray<Volume>) =>
  volumes.find((volume) => volume.namespace === "artifacts") ?? volumes[0];

/** The volumes of one scope and every file at the main volume's head. */
export function useDriveListing(
  orgId: string | undefined,
  scope: DriveScopeQuery | undefined,
) {
  const volumesResult = useAtomValue(
    orgId === undefined || scope === undefined
      ? idle
      : driveVolumesAtom(orgId, scope),
  );
  const volumes = value(volumesResult);
  const main = volumes === undefined ? undefined : mainVolume(volumes);
  const head = main?.headVersionId ?? null;
  const treeResult = useAtomValue(
    orgId === undefined || main === undefined || head === null
      ? idle
      : driveTreeAtom(orgId, main.id, head),
  );
  const tree = value(treeResult);
  const failed =
    AsyncResult.isFailure(volumesResult) || AsyncResult.isFailure(treeResult);
  if (volumes === undefined) return { listing: undefined, failed };
  if (main === undefined || head === null) {
    return { listing: { volumes, main, entries: [] }, failed: false };
  }
  if (tree === undefined) return { listing: undefined, failed };
  const entries: ReadonlyArray<DriveEntry> = tree.entries.map((entry) => ({
    path: entry.path,
    mode: entry.mode,
    sizeBytes: entry.sizeBytes,
    sha256: entry.sha256,
    volume: main,
    versionId: head,
  }));
  return { listing: { volumes, main, entries }, failed: false };
}
