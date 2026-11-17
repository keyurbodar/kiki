import { Effect } from "effect";
import { mockGroup } from "../mockGroup.ts";
import { sampleProjects } from "./fixtures.ts";

export const ProjectsMock = mockGroup("projects", (handlers) =>
  Effect.succeed(
    handlers.handle("list", ({ query }) =>
      Effect.succeed(
        sampleProjects.filter(
          (project) => project.deleted === (query.deleted === "true"),
        ),
      ),
    ),
  ),
);
