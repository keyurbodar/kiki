import { afterEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { copyText } from "./copy";

const stubClipboard = (writeText: (text: string) => Promise<void>) =>
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });

afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("copyText", () => {
  it("toasts the success copy", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    await copyText("src/a.ts", "Path copied", "Could not copy path");
    expect(writeText).toHaveBeenCalledWith("src/a.ts");
    expect(toast.success).toHaveBeenCalledWith("Path copied");
  });

  it("toasts the failure copy", async () => {
    stubClipboard(() => Promise.reject(new Error("denied")));
    await copyText("https://x.invalid", "Link copied", "Could not copy link");
    expect(toast.error).toHaveBeenCalledWith("Could not copy link");
  });
});
