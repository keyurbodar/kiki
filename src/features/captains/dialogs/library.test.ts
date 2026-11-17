import { describe, expect, it } from "vitest";
import {
  removeForEveryoneDescription,
  toLibraryImages,
  usedByLabel,
} from "./library";

describe("captain library", () => {
  it("reads library rows and drops malformed ones", () => {
    const images = toLibraryImages([
      {
        id: "img_1",
        name: "Banner",
        url: "https://images.example.com/a.png",
        uploadedBy: "user_1",
        createdAt: "2026-01-02T00:00:00.000Z",
        usedBy: 2,
      },
      { id: "img_2" },
      null,
    ]);
    expect(images).toHaveLength(1);
    expect(images[0]?.usedBy).toBe(2);
    expect(images[0]?.createdAt.toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(toLibraryImages({})).toEqual([]);
  });

  it("words usage like Capy", () => {
    expect(usedByLabel(0)).toBe("No Captain uses it");
    expect(usedByLabel(1)).toBe("Used by 1 Captain");
    expect(usedByLabel(3)).toBe("Used by 3 Captains");
    expect(removeForEveryoneDescription(null)).toBe(
      "No Captain uses it, and it leaves every member's picker",
    );
    expect(removeForEveryoneDescription({ usedBy: 1 })).toBe(
      "1 Captain using it goes back to their capybara or emoji, background kept",
    );
    expect(removeForEveryoneDescription({ usedBy: 4 })).toBe(
      "4 Captains using it go back to their capybara or emoji, background kept",
    );
  });
});
