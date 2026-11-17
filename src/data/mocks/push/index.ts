import { Effect, Ref } from "effect";
import { fields, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import { samplePushSettings, sampleSubscriptions } from "./fixtures.ts";

type Subscription = Record<string, unknown> & { id: string; enabled: boolean };

export const PushMock = mockGroup("push", (handlers) =>
  Effect.gen(function* () {
    const settings = yield* Ref.make<Record<string, unknown>>({
      ...samplePushSettings,
    });
    const subscriptions = yield* Ref.make<ReadonlyArray<Subscription>>(
      structuredClone(sampleSubscriptions),
    );

    const find = (id: string) =>
      Effect.flatMap(Ref.get(subscriptions), (rows) => {
        const subscription = rows.find((row) => row.id === id);
        return subscription
          ? Effect.succeed(subscription)
          : Effect.die(new Error(`push: no subscription ${id}`));
      });

    const put = (subscription: Subscription) =>
      Ref.update(subscriptions, (rows) => [
        ...rows.filter((row) => row.id !== subscription.id),
        subscription,
      ]).pipe(Effect.as(subscription));

    return handlers
      .handle("get", () =>
        Effect.map(
          Effect.all([Ref.get(settings), Ref.get(subscriptions)], {
            concurrency: 2,
          }),
          ([preferences, rows]) => ({ ...preferences, subscriptions: rows }),
        ),
      )
      .handle("subscribe", ({ payload }) => {
        const input = fields(payload);
        const subscription: Subscription = {
          id: newId("push_sub"),
          deviceId: String(input.deviceId ?? "machine_sample_laptop"),
          endpoint: String(
            input.endpoint ?? "https://push.example.com/subscriptions/new",
          ),
          keys:
            typeof input.keys === "object" && input.keys !== null
              ? input.keys
              : { p256dh: "sample-public-key", auth: "sample-auth" },
          ownerId: input.ownerId ?? "user_sample_alex",
          platform: String(input.platform ?? "web"),
          enabled: typeof input.enabled === "boolean" ? input.enabled : true,
          createdAt: isoMinutesAgo(0),
        };
        return Effect.all(
          [
            put(subscription),
            Ref.update(settings, (current) => ({ ...current, enabled: true })),
          ],
          { concurrency: 1 },
        ).pipe(Effect.as(subscription));
      })
      .handle("patch", ({ params, payload }) =>
        Effect.flatMap(find(params.id), (current) => {
          const input = fields(payload);
          return put({
            ...current,
            ...(typeof input.enabled === "boolean"
              ? { enabled: input.enabled }
              : {}),
            ...(typeof input.platform === "string"
              ? { platform: input.platform }
              : {}),
            ...(typeof input.endpoint === "string"
              ? { endpoint: input.endpoint }
              : {}),
          });
        }),
      )
      .handle("unsubscribe", ({ params }) =>
        Effect.flatMap(find(params.id), () =>
          Effect.flatMap(Ref.get(subscriptions), (rows) =>
            Ref.set(
              subscriptions,
              rows.filter((row) => row.id !== params.id),
            ).pipe(Effect.as({ ok: true, id: params.id })),
          ),
        ),
      )
      .handle("test", ({ params }) =>
        Effect.map(find(params.id), (subscription) => ({
          ok: true,
          id: subscription.id,
          deliveredAt: isoMinutesAgo(0),
          title: "Test notification",
          body: "Push notifications are working.",
        })),
      );
  }),
);
