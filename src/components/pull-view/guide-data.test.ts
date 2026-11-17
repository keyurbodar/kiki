import { describe, expect, it } from "vitest";
import { decodePullGuide, guidePullLabel } from "./guide-data";

const document = {
  id: "guide_pr_128",
  state: "completed",
  overview: "Three passes over the change.",
  groups: [
    {
      id: "surface",
      title: "The surface",
      explanation: "What the reader sees first.",
      files: ["src/app.tsx"],
    },
    {
      title: "The logic",
      explanation: "Where the decisions live.",
      files: [{ path: "src/lib/retry.ts" }],
    },
  ],
};

describe("decodePullGuide", () => {
  it("reads chapters out of the guide document", () => {
    const guide = decodePullGuide(document);
    expect(guide.status).toBe("ready");
    if (guide.status !== "ready") return;
    expect(guide.overview).toBe("Three passes over the change.");
    expect(guide.chapters.map((chapter) => chapter.title)).toEqual([
      "The surface",
      "The logic",
    ]);
    expect(guide.chapters[0]?.id).toBe("surface");
    expect(guide.chapters[1]?.id).toBe("the-logic");
    expect(guide.chapters[0]?.files).toEqual([
      { path: "src/app.tsx", additions: 0, deletions: 0 },
    ]);
    expect(guide.chapters[1]?.files[0]?.path).toBe("src/lib/retry.ts");
  });

  it("reports a guide that is still being written", () => {
    expect(decodePullGuide({ state: "generating", groups: [] }).status).toBe(
      "generating",
    );
  });

  it("reports an empty document as no guide", () => {
    expect(decodePullGuide({ state: "completed", groups: [] }).status).toBe(
      "empty",
    );
    expect(decodePullGuide({ groups: [{ title: "" }] }).status).toBe("empty");
  });

  it("reports a document it cannot read as failed", () => {
    expect(decodePullGuide(null).status).toBe("failed");
    expect(decodePullGuide({ state: "failed" }).status).toBe("failed");
  });

  it("labels the pull the guide belongs to", () => {
    expect(guidePullLabel("acme/web", 128)).toBe("web#128");
  });
});
