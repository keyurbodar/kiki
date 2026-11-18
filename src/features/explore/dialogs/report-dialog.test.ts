import { describe, expect, it } from "vitest";
import { findSampleListing } from "@/data/mocks/explorePublic/fixtures";
import { errorMessage } from "./error-message";
import { reportPayload, reportReasons } from "./report-dialog";

const card = findSampleListing("plugin", "cloudflare")?.card;
if (card === undefined) throw new Error("missing fixture");

describe("report dialog", () => {
  it("drops empty details from the payload", () => {
    expect(reportPayload(card, "broken", "  ")).toEqual({
      kind: "plugin",
      slug: "cloudflare",
      reason: "broken",
      text: undefined,
    });
    expect(reportPayload(card, "unsafe", " looks off ").text).toBe("looks off");
  });

  it("labels every reason", () => {
    expect(Object.values(reportReasons)).toEqual([
      "It does not work",
      "It looks unsafe",
      "It does not do what it says",
      "It is out of date",
      "Something else",
    ]);
  });

  it("falls back when an error has no message", () => {
    expect(errorMessage(new Error("Boom"), "Fallback")).toBe("Boom");
    expect(errorMessage(null, "Fallback")).toBe("Fallback");
  });
});
