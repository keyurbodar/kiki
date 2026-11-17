import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { organizationsAtom } from "@/data/atoms/session";
import {
  type CaptainDrive,
  type CrewThread,
  captainAtom,
  captainCrewAtom,
  captainDriveAtom,
  sortCrew,
  toCaptain,
  toCaptainDrive,
  toCrewThread,
} from "./captain-data";

export function useCaptain(orgId: string | undefined, jamId: string) {
  const result = useAtomValue(captainAtom(orgId ?? "", jamId));
  return orgId !== undefined && AsyncResult.isSuccess(result)
    ? toCaptain(result.value)
    : undefined;
}

export function useCaptainCrew(
  orgId: string | undefined,
  jamId: string,
): CrewThread[] | undefined {
  const result = useAtomValue(captainCrewAtom(orgId ?? "", jamId));
  if (orgId === undefined || !AsyncResult.isSuccess(result)) return undefined;
  const rows = Array.isArray(result.value) ? result.value : [];
  return sortCrew(rows.flatMap((row) => toCrewThread(row) ?? []));
}

export type CaptainDriveState = {
  drive: CaptainDrive | null | undefined;
  waiting: boolean;
  failed: boolean;
};

export function useCaptainDrive(
  orgId: string | undefined,
  jamId: string,
): CaptainDriveState {
  const result = useAtomValue(captainDriveAtom(orgId ?? "", jamId));
  if (orgId === undefined)
    return { drive: undefined, waiting: false, failed: false };
  return {
    drive: AsyncResult.isSuccess(result)
      ? toCaptainDrive(result.value)
      : undefined,
    waiting: result.waiting || AsyncResult.isInitial(result),
    failed: AsyncResult.isFailure(result),
  };
}

/** The org a Captain view reads from: the given one, else the first org. */
export function useCaptainOrgId(orgId?: string) {
  const result = useAtomValue(organizationsAtom);
  if (orgId !== undefined) return orgId;
  return AsyncResult.isSuccess(result) ? result.value[0]?.id : undefined;
}
