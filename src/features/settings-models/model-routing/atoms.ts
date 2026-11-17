import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { organizationsAtom } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import {
  decodeCatalog,
  decodeCompactAt,
  decodeRouting,
  decodeSettings,
} from "./decode.ts";

export const modelsKeys = {
  routing: (orgId: string) => [`models:routing:${orgId}`],
  settings: (orgId: string) => [`models:settings:${orgId}`],
  seats: (orgId: string) => [`models:seats:${orgId}`],
  compactAt: (orgId: string) => [`models:compact-at:${orgId}`],
  catalog: ["models:catalog"],
  preferences: "user:preferences",
} as const;

export const routingKeys = (orgId: string) => [
  ...modelsKeys.routing(orgId),
  ...modelsKeys.seats(orgId),
];

export const settingsKeys = (orgId: string) => [
  ...modelsKeys.settings(orgId),
  ...modelsKeys.routing(orgId),
];

export const routingAtom = Atom.family((orgId: string) =>
  ApiClient.query("models", "routing", {
    params: { orgId },
    reactivityKeys: routingKeys(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const modelsSettingsAtom = Atom.family((orgId: string) =>
  ApiClient.query("models", "getSettings", {
    params: { orgId },
    reactivityKeys: modelsKeys.settings(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const catalogAtom = ApiClient.query("models", "list", {
  query: {},
  reactivityKeys: modelsKeys.catalog,
  timeToLive: queryTimeToLive,
});

export const orgCompactAtAtom = Atom.family((orgId: string) =>
  ApiClient.query("models", "listCompactAt", {
    params: { orgId },
    reactivityKeys: modelsKeys.compactAt(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const myCompactAtAtom = Atom.family((orgId: string) =>
  ApiClient.query("models", "listMyCompactAt", {
    params: { orgId },
    reactivityKeys: modelsKeys.compactAt(orgId),
    timeToLive: queryTimeToLive,
  }),
);

export const setModelSettingAtom = ApiClient.mutation(
  "models",
  "setModelSetting",
);
export const setConnectionModelsAtom = ApiClient.mutation(
  "models",
  "setConnectionModels",
);
export const reorderConnectionsAtom = ApiClient.mutation(
  "models",
  "reorderConnections",
);
export const updateCredentialAtom = ApiClient.mutation(
  "models",
  "updateCredential",
);
export const createCredentialAtom = ApiClient.mutation(
  "models",
  "createCredential",
);
export const removeCredentialAtom = ApiClient.mutation(
  "models",
  "removeCredential",
);
export const testCredentialAtom = ApiClient.mutation(
  "models",
  "testCredential",
);
export const checkMediaUrlAtom = ApiClient.mutation("models", "checkMediaUrl");
export const refreshDaybreakAtom = ApiClient.mutation(
  "models",
  "refreshDaybreak",
);
export const discoverModelsAtom = ApiClient.mutation(
  "models",
  "discoverModels",
);
export const setCredentialEnabledAtom = ApiClient.mutation(
  "models",
  "setCredentialEnabled",
);
export const disconnectSeatAtom = ApiClient.mutation("models", "disconnect");
export const connectClaudeSeatAtom = ApiClient.mutation(
  "models",
  "connectClaudeSeat",
);
export const refreshClaudeSeatAtom = ApiClient.mutation(
  "models",
  "refreshClaudeSeat",
);
export const startDeviceAtom = ApiClient.mutation("models", "startDevice");
export const pollDeviceAtom = ApiClient.mutation("models", "pollDevice");
export const setFallbackAtom = ApiClient.mutation("models", "setFallback");
export const setMemberCredentialsAtom = ApiClient.mutation(
  "models",
  "setMemberCredentials",
);
export const upsertCompactAtAtom = ApiClient.mutation(
  "models",
  "upsertCompactAt",
);
export const removeCompactAtAtom = ApiClient.mutation(
  "models",
  "removeCompactAt",
);
export const upsertMyCompactAtAtom = ApiClient.mutation(
  "models",
  "upsertMyCompactAt",
);
export const removeMyCompactAtAtom = ApiClient.mutation(
  "models",
  "removeMyCompactAt",
);

const successValue = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  AsyncResult.isSuccess(result) ? result.value : undefined;

export const useOrgId = () => {
  const organizations = successValue(useAtomValue(organizationsAtom));
  return organizations?.[0]?.id as string | undefined;
};

const emptyAtom: Atom.Atom<AsyncResult.AsyncResult<unknown, never>> = Atom.make(
  AsyncResult.initial<unknown, never>(),
);

export const useRouting = (orgId: string | undefined) => {
  const raw = successValue(
    useAtomValue(orgId === undefined ? emptyAtom : routingAtom(orgId)),
  );
  return raw === undefined ? undefined : decodeRouting(raw);
};

export const useModelsSettings = (orgId: string | undefined) => {
  const raw = successValue(
    useAtomValue(orgId === undefined ? emptyAtom : modelsSettingsAtom(orgId)),
  );
  return raw === undefined ? undefined : decodeSettings(raw);
};

export const useCatalog = () =>
  decodeCatalog(successValue(useAtomValue(catalogAtom)));

export const useCompactAt = (orgId: string | undefined) => {
  const org = successValue(
    useAtomValue(orgId === undefined ? emptyAtom : orgCompactAtAtom(orgId)),
  );
  const mine = successValue(
    useAtomValue(orgId === undefined ? emptyAtom : myCompactAtAtom(orgId)),
  );
  return { org: decodeCompactAt(org), mine: decodeCompactAt(mine) };
};
