import { Schema } from "effect";
import { KeyValueStore } from "effect/persistence";
import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export const pushSubscriptionKeys = (userId: string) => [
  `push_subscription:${userId}`,
];

export const pushStateAtom = Atom.family((userId: string) =>
  Atom.make((get) => {
    get(pushRetryAtom);
    return get(
      ApiClient.query("push", "get", {
        reactivityKeys: pushSubscriptionKeys(userId),
      }),
    );
  }),
);

export const pushRetryAtom = Atom.make(0).pipe(Atom.keepAlive);

export const patchPushSubscriptionAtom = ApiClient.mutation("push", "patch");

export const unsubscribePushAtom = ApiClient.mutation("push", "unsubscribe");

export const pushSubscriptionIdAtom = Atom.kvs({
  runtime: Atom.runtime(
    KeyValueStore.layerStorage(() => globalThis.localStorage),
  ),
  key: "capy-web:push-subscription",
  schema: Schema.NullOr(Schema.String),
  defaultValue: () => null,
});

export type PushEnableOutcome = "granted" | "denied" | "unavailable";

export const pushEnableAtom = Atom.make<
  null | (() => Promise<PushEnableOutcome>)
>(null).pipe(Atom.keepAlive);

export const pushInstallDialogOpenAtom = Atom.make(false).pipe(Atom.keepAlive);
