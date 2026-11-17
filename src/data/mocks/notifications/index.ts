import { Effect, Ref } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { sampleNotifications } from "./fixtures.ts";

export const NotificationsMock = mockGroup("notifications", (handlers) =>
  Effect.gen(function* () {
    const notifications = yield* Ref.make<
      ReadonlyArray<Record<string, unknown>>
    >(structuredClone(sampleNotifications));

    return handlers
      .handle("list", () => Ref.get(notifications))
      .handle("unreadCount", () =>
        Effect.map(
          Ref.get(notifications),
          (rows) => rows.filter((row) => row.read === false).length,
        ),
      );
  }),
);
