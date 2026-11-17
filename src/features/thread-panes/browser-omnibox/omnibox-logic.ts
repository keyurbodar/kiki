export type OmniboxSearchEngine = "google" | "duckduckgo" | "bing";

export type OmniboxPort = {
  readonly port: string;
  readonly detail: string;
  readonly machineId?: string;
};

export type OmniboxHistoryEntry = {
  readonly url: string;
  readonly title: string;
};

export type OmniboxSuggestion =
  | { readonly kind: "port"; readonly port: string; readonly detail: string }
  | { readonly kind: "history"; readonly visit: OmniboxHistoryEntry }
  | { readonly kind: "url"; readonly url: string }
  | {
      readonly kind: "search";
      readonly query: string;
      readonly engine: OmniboxSearchEngine;
    };

export const searchEngines: Record<
  OmniboxSearchEngine,
  { label: string; url: string }
> = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
};

const domainPattern =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function parseAddress(
  value: string,
): { url: string; hostname?: string } | undefined {
  const trimmed = value.trim();
  if (trimmed === "" || /\s/.test(trimmed)) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return URL.canParse(trimmed) && /^https?:$/i.test(new URL(trimmed).protocol)
      ? { url: trimmed }
      : undefined;
  }
  if (!/[.:]/.test(trimmed) && trimmed !== "localhost") return undefined;
  const url = `http://${trimmed}`;
  if (!URL.canParse(url)) return undefined;
  return domainPattern.test(trimmed) ? { url, hostname: trimmed } : { url };
}

export function suggestionValue(suggestion: OmniboxSuggestion): string {
  switch (suggestion.kind) {
    case "port":
      return `http://127.0.0.1:${suggestion.port}`;
    case "history":
      return suggestion.visit.url;
    case "url":
      return suggestion.url;
    case "search":
      return `${searchEngines[suggestion.engine].url}${encodeURIComponent(suggestion.query)}`;
  }
}

export function suggestionLabel(suggestion: OmniboxSuggestion): string {
  switch (suggestion.kind) {
    case "port":
      return suggestion.detail;
    case "history":
      return suggestion.visit.title === ""
        ? suggestion.visit.url
        : suggestion.visit.title;
    case "url":
      return suggestion.url;
    case "search":
      return `Search ${searchEngines[suggestion.engine].label} for "${suggestion.query}"`;
  }
}

function matches(
  query: string,
  ...values: readonly (string | undefined)[]
): boolean {
  return values.some((value) => value?.toLowerCase().includes(query) === true);
}

export function buildOmniboxSuggestions(input: {
  readonly query?: string;
  readonly ports: readonly OmniboxPort[];
  readonly history: readonly OmniboxHistoryEntry[];
  readonly searchEngine: OmniboxSearchEngine;
}): readonly OmniboxSuggestion[] {
  const query = (input.query ?? "").trim().toLowerCase();
  const parsed = parseAddress(input.query ?? "");
  const urlSuggestion =
    parsed === undefined ? [] : [{ kind: "url", url: parsed.url } as const];
  return [
    ...input.ports
      .filter((port) => matches(query, port.detail))
      .map((port) => ({
        kind: "port",
        port: port.port,
        detail: port.detail,
      })),
    ...input.history
      .filter((visit) => matches(query, visit.url, visit.title))
      .map((visit) => ({
        kind: "history",
        visit,
      })),
    ...urlSuggestion,
    ...(query === "" || input.query === undefined
      ? []
      : [
          {
            kind: "search",
            query: input.query.trim(),
            engine: input.searchEngine,
          },
        ]),
  ];
}
