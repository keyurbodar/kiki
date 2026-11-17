import { DateTime } from "effect";

export const fixtureNow = DateTime.makeUnsafe("2026-03-02T09:00:00.000Z");

export const minutesAgo = (minutes: number) =>
  DateTime.subtract(fixtureNow, { minutes });
