import { describe, expect, it } from "vitest";
import {
  checksSummary,
  checksVerdict,
  checkVerdict,
  type PullCheck,
  sortChecks,
} from "./checks";

const check = (
  name: string,
  verdict: string | null,
  kind: "check" | "status" = "check",
): PullCheck => ({
  kind,
  name,
  state: kind === "status" ? verdict : null,
  conclusion: kind === "check" ? verdict : null,
  detailsUrl: null,
});

describe("check verdicts", () => {
  it("maps check conclusions and commit status states", () => {
    expect(checkVerdict(check("a", "failure"))).toBe("failure");
    expect(checkVerdict(check("b", "timed_out"))).toBe("failure");
    expect(checkVerdict(check("c", null))).toBe("pending");
    expect(checkVerdict(check("d", "skipped"))).toBe("neutral");
    expect(checkVerdict(check("e", "success", "status"))).toBe("success");
    expect(checkVerdict(check("f", "error", "status"))).toBe("failure");
  });

  it("summarises counts and sorts by severity", () => {
    const rows = [
      check("pass", "success"),
      check("run", null),
      check("fail", "failure"),
    ];
    expect(checksSummary(rows)).toBe("1 failed, 1 running, 1 passed");
    expect(checksSummary([])).toBe("No checks yet");
    expect(checksVerdict(rows)).toBe("failure");
    expect(sortChecks(rows).map((row) => row.name)).toEqual([
      "fail",
      "run",
      "pass",
    ]);
  });
});
