import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CrewAsksMenu } from "./crew-asks";
import type { CrewAsk } from "./crew-asks-model";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ask = (overrides: Partial<CrewAsk> = {}): CrewAsk => ({
  threadId: "thread_a",
  key: "ask_1",
  causeKey: null,
  text: "Need a decision on Thread A",
  askedAt: new Date("2026-01-01T00:00:00.000Z"),
  stale: false,
  ...overrides,
});

const threads = [{ id: "thread_a", title: "Thread A" }];

describe("CrewAsksMenu", () => {
  it("takes its footer label breakpoints from the crew asks container token", () => {
    render(
      <CrewAsksMenu
        captainId="captain"
        asks={[ask()]}
        threads={threads}
        onOpenJam={() => {}}
        onDismiss={async () => []}
      />,
    );
    const trigger = screen.getByRole("button", { name: "1 crew ask" });
    const labels = Array.from(
      trigger.querySelectorAll("span[aria-hidden]"),
    ).map((label) => label.className);
    expect(labels.some((c) => c.includes("@max-crew-asks-footer/footer"))).toBe(
      true,
    );
    expect(labels.some((c) => c.includes("@crew-asks-footer/footer"))).toBe(
      true,
    );
    expect(labels.some((c) => /\d(?:\.\d+)?rem/.test(c))).toBe(false);
  });

  it("restores the asks dismissed before a later batch failed", async () => {
    const asks = Array.from({ length: 101 }, (_, index) =>
      ask({ threadId: `thread_${index}` }),
    );
    let call = 0;
    const onDismiss = vi.fn(
      async (batch: { threadIds: string[]; keys: string[] }) => {
        call += 1;
        if (call === 2) throw new Error("offline");
        return batch.threadIds.map((threadId) => ({
          threadId,
          key: batch.keys[0] ?? "",
        }));
      },
    );
    const onRestore = vi.fn(async () => {});
    render(
      <CrewAsksMenu
        captainId="captain"
        asks={asks}
        threads={[]}
        onOpenJam={() => {}}
        onDismiss={onDismiss}
        onRestore={onRestore}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "101 crew asks" }));
    fireEvent.click(await screen.findByText("Dismiss all"));
    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not dismiss the asks"),
    );
    const [, options] = toast.success.mock.calls.at(-1) ?? [];
    expect(options?.action?.label).toBe("Undo");
    options?.action?.onClick();
    await vi.waitFor(() =>
      expect(onRestore).toHaveBeenCalledWith(
        Array.from({ length: 100 }, (_, index) => ({
          threadId: `thread_${index}`,
          key: "ask_1",
        })),
      ),
    );
  });
});
