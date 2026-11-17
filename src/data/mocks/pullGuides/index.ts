import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { emptyGuide, pullGuideDocuments } from "./fixtures.ts";

const fallback = emptyGuide("pr_unknown");

export const PullGuidesMock = mockGroup("pullGuides", (handlers) =>
  Effect.gen(function* () {
    return handlers.handle("get", ({ params }) =>
      Effect.succeed(
        pullGuideDocuments.find(
          (document) => document.pullId === params.pullId,
        ) ?? fallback,
      ),
    );
  }),
);
