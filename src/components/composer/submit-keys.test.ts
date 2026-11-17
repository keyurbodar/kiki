import { describe, expect, it } from "vitest";
import {
  DEFAULT_INPUT_PREFS,
  defaultDelivery,
  type EnterKeyInput,
  resolveEnterKey,
} from "./submit-keys";

const key = (overrides: Partial<EnterKeyInput> = {}): EnterKeyInput => ({
  ...DEFAULT_INPUT_PREFS,
  touchOnly: false,
  shiftKey: false,
  modKey: false,
  altKey: false,
  isComposing: false,
  ...overrides,
});

describe("resolveEnterKey", () => {
  it("submits with the enter delivery by default", () => {
    expect(resolveEnterKey(key())).toEqual({
      kind: "submit",
      delivery: "steer",
    });
  });

  it("maps mod and alt to their deliveries", () => {
    expect(resolveEnterKey(key({ modKey: true }))).toEqual({
      kind: "submit",
      delivery: "interrupt",
    });
    expect(resolveEnterKey(key({ altKey: true }))).toEqual({
      kind: "submit",
      delivery: "queue",
    });
  });

  it("inserts a newline on shift", () => {
    expect(resolveEnterKey(key({ shiftKey: true }))).toEqual({
      kind: "newline",
    });
  });

  it("passes through while composing or on touch-only devices", () => {
    expect(resolveEnterKey(key({ isComposing: true }))).toEqual({
      kind: "pass",
    });
    expect(resolveEnterKey(key({ touchOnly: true }))).toEqual({ kind: "pass" });
  });

  it("lets enter type a newline when the preference says so", () => {
    expect(resolveEnterKey(key({ enter: "newline" }))).toEqual({
      kind: "pass",
    });
    expect(resolveEnterKey(key({ enter: "newline", shiftKey: true }))).toEqual({
      kind: "pass",
    });
  });
});

describe("defaultDelivery", () => {
  it("uses enter, or mod+enter when enter types a newline", () => {
    expect(defaultDelivery(DEFAULT_INPUT_PREFS)).toBe("steer");
    expect(defaultDelivery({ ...DEFAULT_INPUT_PREFS, enter: "newline" })).toBe(
      "interrupt",
    );
  });
});
