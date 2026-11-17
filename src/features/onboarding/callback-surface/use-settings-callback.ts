import { useEffect, useRef, useState } from "react";
import {
  type CallbackOutcome,
  type CallbackProvider,
  type CallbackStatus,
  desktopHref,
  errorStage,
  failureHref,
  type SettingsCallbackResult,
  settingsPaths,
  statusForStage,
} from "./callback-result";
import { browserLocation } from "./location";

export type SettingsCallbackState = {
  status: CallbackStatus;
  returnHref: string;
  desktopHref?: string;
  outcome?: CallbackOutcome;
  failedDescription?: string;
};

export function useSettingsCallback(
  provider: CallbackProvider,
  complete: () => Promise<SettingsCallbackResult>,
): SettingsCallbackState {
  const [state, setState] = useState<SettingsCallbackState>({
    status: "completing",
    returnHref: settingsPaths[provider],
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fail = (stage: string, message?: string) =>
      setState({
        status: statusForStage(stage),
        returnHref: failureHref(provider, stage, message),
        failedDescription: message,
      });
    complete().then(
      (result) => {
        if (result.result === "failed") {
          fail(result.stage ?? "unknown", result.message ?? undefined);
          return;
        }
        const path = `${settingsPaths[provider]}?${provider}=${result.result}`;
        const desktop = desktopHref(result.desktopScheme, path);
        if (desktop === undefined) {
          browserLocation.replace(path);
          return;
        }
        setState({
          status: "returning",
          returnHref: settingsPaths[provider],
          desktopHref: desktop,
          outcome: result.result,
        });
      },
      (error) => fail(errorStage(error)),
    );
  }, [complete, provider]);

  return state;
}
