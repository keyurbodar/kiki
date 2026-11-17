import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export const DEAL_CODE_KEY = "capy-web:pending-deal-code";
export const dealDismissedKey = (code: string) =>
  `capy-web:deal-reminder-dismissed:${code}`;

const listeners = new Set<() => void>();
const read = (key: string) => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, value);
  } catch {}
  for (const listener of listeners) listener();
};

export const pendingDealCodeAtom = Atom.make(() => ({
  get: () => read(DEAL_CODE_KEY),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set: (value: string | null) => write(DEAL_CODE_KEY, value),
}));

export const dealRecipientAtom = Atom.family((code: string) =>
  ApiClient.query("promotions", "getRecipientByCode", {
    params: { code },
    timeToLive: "1 minute",
  }),
);
