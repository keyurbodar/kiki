import { DateTime } from "effect";

/**
 * The mock world's clock, pinned to the moment this module loads rather than to
 * a fixed date. Seeded timestamps then stay as far in the past as they were
 * meant to be however long the app has been around, so a thread touched a
 * minute ago renders as "1m ago" rather than "37w ago".
 */
export const fixtureNow = DateTime.nowUnsafe();

export const minutesAgo = (minutes: number) =>
  DateTime.subtract(fixtureNow, { minutes });
