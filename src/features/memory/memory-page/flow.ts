import type {
  MemoryLocation,
  MemoryPageRow,
  MemorySort,
  MemoryTopic,
} from "./types.ts";

export const memoryReactivityKey = (orgId: string) => `volume:${orgId}`;

export const memoryListQuery = (
  location: MemoryLocation,
  query: string,
  cursor?: string,
): Record<string, string> => {
  const search = query.trim();
  return {
    ...(location.where === "everywhere" ? { scope: "user" } : {}),
    ...(location.who === "you"
      ? { tab: "personal" }
      : location.who === "everyone"
        ? { tab: "shared" }
        : {}),
    ...(location.where !== undefined && location.where !== "everywhere"
      ? { projectId: location.where }
      : {}),
    ...(search === "" ? {} : { search }),
    ...(cursor === undefined ? {} : { cursor }),
  };
};

export const scopeLabel = (scope: MemoryTopic["scope"] | undefined) => {
  switch (scope) {
    case "project":
      return "Everyone";
    case "project-user":
    case "personal":
      return "Only you";
    default:
      return "Everywhere";
  }
};

export const whereLabel = (
  where: string | undefined,
  projects: readonly { id: string; name: string }[],
) =>
  where === undefined
    ? "All"
    : where === "everywhere"
      ? "Everywhere"
      : (projects.find((project) => project.id === where)?.name ?? "Project");

export const whoLabel = (who: string | undefined) =>
  who === undefined ? "All" : who === "you" ? "Only you" : "Everyone";

export const memoryErrorCopy = (error: unknown, fallback: string) => {
  const tag =
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    typeof error._tag === "string"
      ? error._tag
      : "";
  return tag === "capy/VolumeHeadMoved"
    ? {
        message: "Could not update memory",
        description:
          "Keep your draft, reload the latest memory before saving again",
      }
    : { message: fallback, description: undefined };
};

const sortValue = (topic: MemoryTopic, column: MemorySort["column"]) => {
  switch (column) {
    case "title":
      return topic.title;
    case "who":
      return scopeLabel(topic.scope);
    case "where":
      return topic.projectId ?? "";
    case "source":
      return topic.source ?? "";
    case "confirmed":
      return topic.lastConfirmed ?? "";
  }
};

export const sortMemories = (
  items: readonly MemoryTopic[],
  sort: MemorySort,
) => {
  const direction = sort.direction === "ascending" ? 1 : -1;
  return [...items].sort((a, b) => {
    const primary = sortValue(a, sort.column).localeCompare(
      sortValue(b, sort.column),
    );
    return primary === 0 ? a.title.localeCompare(b.title) : primary * direction;
  });
};

export const emptyStateCopy = (
  query: string,
  page: Pick<MemoryPageRow, "nextCursor" | "skipped">,
  filtered: boolean,
) => {
  const more = page.nextCursor !== null || page.skipped > 0;
  if (query !== "") {
    return {
      title: `No memories match “${query}”`,
      detail: more
        ? "Continue to the next page to browse more memories"
        : "Try a different search or change the filters",
    };
  }
  if (more) {
    return {
      title: "No readable memories on this page",
      detail:
        page.nextCursor !== null
          ? "Continue to the next page to browse more memories"
          : "Some memories could not be read",
    };
  }
  return {
    title: "No memories match these filters",
    detail: filtered
      ? "Change who can see it or where it applies"
      : "Change who can see it or where it applies",
  };
};

export const plainSource = (source: string) =>
  source.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");

export const forgetTitle = (topic: MemoryTopic | undefined) =>
  topic?.scope === "project"
    ? "Forget this shared memory?"
    : "Forget this memory?";

export const forgetDescription = (
  topic: MemoryTopic | undefined,
  where: string,
) =>
  topic?.scope === "project"
    ? `Removes it from ${where} shared memory for everyone`
    : "Removes it from your saved memories";
