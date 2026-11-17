import { describe, expect, it } from "vitest";
import {
  formatRelativeTime,
  pushPatchPayload,
  readPushState,
  subscriptionActivity,
  subscriptionKindsSummary,
} from "./push-state";
import { pushDeviceLabel } from "./web-push";

const now = Date.parse("2026-01-10T12:00:00Z");

describe("readPushState", () => {
  it("reads Capy's push state", () => {
    const state = readPushState({
      vapidPublicKey: null,
      subscriptions: [
        {
          id: "sub_1",
          label: "Chrome on Mac",
          kinds: { mention: false },
          origins: { slack: true },
          lastSeenAt: "2026-01-10T11:00:00Z",
          lastDeliveredAt: null,
          failedAt: null,
        },
      ],
    });
    expect(state.vapidPublicKey).toBeNull();
    expect(state.subscriptions[0]?.label).toBe("Chrome on Mac");
    expect(state.subscriptions[0]?.kinds).toEqual({ mention: false });
  });

  it("falls back for partial rows", () => {
    const state = readPushState({
      subscriptions: [{ id: "sub_2", createdAt: "2026-01-01T00:00:00Z" }, {}],
    });
    expect(state.vapidPublicKey).toBe("");
    expect(state.subscriptions).toHaveLength(1);
    expect(state.subscriptions[0]?.label).toBe("Browser");
    expect(state.subscriptions[0]?.lastSeenAt.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
});

const subscription = (
  overrides: Partial<Parameters<typeof subscriptionActivity>[0]>,
) => ({
  id: "sub",
  label: "Safari on iPhone",
  kinds: {},
  origins: {},
  lastSeenAt: new Date(now - 30_000),
  lastDeliveredAt: null,
  failedAt: null,
  ...overrides,
});

describe("subscription summaries", () => {
  it("lists enabled kinds", () => {
    expect(subscriptionKindsSummary(subscription({}))).toBe("Mentions, errors");
    expect(
      subscriptionKindsSummary(subscription({ kinds: { mention: false } })),
    ).toBe("Errors");
    expect(
      subscriptionKindsSummary(
        subscription({ kinds: { mention: false, error: false } }),
      ),
    ).toBe("Nothing");
  });

  it("describes activity", () => {
    expect(subscriptionActivity(subscription({}), now)).toBe("Active now");
    expect(
      subscriptionActivity(
        subscription({ lastSeenAt: new Date(now - 3 * 3_600_000) }),
        now,
      ),
    ).toBe("Active 3h ago");
    expect(
      subscriptionActivity(
        subscription({
          lastDeliveredAt: new Date(now - 7_200_000),
          failedAt: new Date(now - 60_000),
        }),
        now,
      ),
    ).toBe("Last push failed, retrying");
  });

  it("formats relative time", () => {
    expect(formatRelativeTime(new Date(now - 2_000), now)).toBe("just now");
    expect(formatRelativeTime(new Date(now - 90_000), now)).toBe("1m ago");
    expect(formatRelativeTime(new Date(now - 9 * 86_400_000), now)).toBe(
      "1w ago",
    );
    expect(formatRelativeTime(new Date(now + 2 * 86_400_000), now)).toBe(
      "in 2d",
    );
  });

  it("builds the patch payload from device prefs", () => {
    expect(
      pushPatchPayload({ mention: true, error: false, origins: { web: true } }),
    ).toEqual({
      kinds: { mention: true, error: false },
      origins: { web: true },
    });
  });
});

describe("pushDeviceLabel", () => {
  it("names browser and platform", () => {
    expect(
      pushDeviceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        0,
      ),
    ).toBe("Chrome on Mac");
    expect(
      pushDeviceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        5,
      ),
    ).toBe("Safari on iPad");
    expect(pushDeviceLabel("curl/8", 0)).toBe("Browser on this device");
  });
});
