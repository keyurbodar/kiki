import { AsyncResult } from "effect/reactivity";
import { describe, expect, it } from "vitest";
import { settingsQuery } from "./agent-settings";

describe("settingsQuery", () => {
  it("distinguishes pending, failed and empty", () => {
    expect(settingsQuery(AsyncResult.initial(true), (n: number) => n)).toEqual({
      value: undefined,
      loading: true,
      failed: false,
    });
    expect(
      settingsQuery(AsyncResult.fail(new Error("x")), (n: number) => n),
    ).toEqual({
      value: undefined,
      loading: false,
      failed: true,
    });
    expect(settingsQuery(AsyncResult.success(0), (n: number) => n)).toEqual({
      value: 0,
      loading: false,
      failed: false,
    });
  });
});
