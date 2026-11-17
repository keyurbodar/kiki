import { expect, it } from "vitest";
import {
  buildOmniboxSuggestions,
  parseAddress,
  suggestionValue,
} from "./omnibox-logic.ts";

it("parses http URLs, bare domains and localhost without guessing search terms", () => {
  expect(parseAddress("https://example.com/app")).toEqual({
    url: "https://example.com/app",
  });
  expect(parseAddress("example.com")).toEqual({
    url: "http://example.com",
    hostname: "example.com",
  });
  expect(parseAddress("localhost:3000")).toBeUndefined();
  expect(parseAddress("hello world")).toBeUndefined();
  expect(parseAddress("not a url")).toBeUndefined();
});

it("ranks port, history, URL and search suggestions", () => {
  const suggestions = buildOmniboxSuggestions({
    query: "example",
    ports: [{ port: "3000", detail: "Primary machine · example" }],
    history: [{ url: "https://example.com/docs", title: "Example docs" }],
    searchEngine: "google",
  });
  expect(suggestions.map((item) => item.kind)).toEqual([
    "port",
    "history",
    "search",
  ]);
  expect(suggestionValue(suggestions[2])).toBe(
    "https://www.google.com/search?q=example",
  );
});

it("omits unmatched ports and empty search suggestions", () => {
  const suggestions = buildOmniboxSuggestions({
    ports: [{ port: "3000", detail: "unrelated" }],
    history: [],
    searchEngine: "bing",
  });
  expect(suggestions).toHaveLength(1);
});
