import { useAtomSet } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { useState } from "react";
import { toast } from "sonner";
import { routingKeys, setConnectionModelsAtom, useOrgId } from "./atoms.ts";
import type { ModelSetting } from "./types.ts";

const messageOf = (error: unknown) =>
  error !== null &&
  typeof error === "object" &&
  "message" in error &&
  typeof error.message === "string" &&
  error.message.length > 0
    ? error.message
    : undefined;

export const failureMessage = (
  cause: Cause.Cause<unknown>,
  fallback: string,
) => {
  const failure = cause.reasons.find(Cause.isFailReason);
  return (
    (failure === undefined ? undefined : messageOf(failure.error)) ?? fallback
  );
};

export const toastFailure = <A, E>(
  pending: Promise<Exit.Exit<A, E>>,
  message: string,
) =>
  pending.then((exit) => {
    if (Exit.isFailure(exit)) toast.error(failureMessage(exit.cause, message));
    return exit;
  });

export const useSaveModels = (credentialId: string | undefined) => {
  const orgId = useOrgId();
  const setModels = useAtomSet(setConnectionModelsAtom, {
    mode: "promiseExit",
  });
  const [busy, setBusy] = useState(false);
  const save = (models: ReadonlyArray<ModelSetting>) => {
    if (orgId === undefined || credentialId === undefined) return;
    setBusy(true);
    void toastFailure(
      setModels({
        params: { orgId, credentialId },
        payload: { models },
        reactivityKeys: routingKeys(orgId),
      }),
      "Could not update the models",
    ).finally(() => setBusy(false));
  };
  return { busy, save };
};

export const useRunner = () => {
  const orgId = useOrgId();
  const [busy, setBusy] = useState(false);
  const run = <A, E>(
    request: (keys: Array<string>) => Promise<Exit.Exit<A, E>>,
    message: string,
  ) => {
    if (orgId === undefined) return;
    setBusy(true);
    void toastFailure(request(routingKeys(orgId)), message).finally(() =>
      setBusy(false),
    );
  };
  return { busy, run };
};
