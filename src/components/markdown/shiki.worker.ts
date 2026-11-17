/// <reference lib="webworker" />
import {
  type BundledLanguage,
  bundledLanguages,
  createHighlighter,
  type Highlighter,
} from "shiki";
import { capyDarkCodeTheme, capyLightCodeTheme } from "@/tokens/code-themes";
import type { HighlightRequest, HighlightResponse } from "./highlight";

const themes = { light: "capy-light", dark: "capy-dark" } as const;

let highlighter: Promise<Highlighter> | undefined;
const getHighlighter = () => {
  highlighter ??= createHighlighter({
    themes: [capyLightCodeTheme, capyDarkCodeTheme],
    langs: [],
  });
  return highlighter;
};

const styleOf = (style: Record<string, string> | string | undefined) =>
  typeof style === "string"
    ? style
    : Object.entries(style ?? {})
        .map(([key, value]) => `${key}:${value}`)
        .join(";");

const pending = new Map<string, HighlightRequest>();
let running = false;

const post = (message: HighlightResponse) => self.postMessage(message);

async function run(request: HighlightRequest) {
  const shiki = await getHighlighter();
  const language = (
    request.language in bundledLanguages ? request.language : "text"
  ) as BundledLanguage | "text";
  if (language !== "text" && !shiki.getLoadedLanguages().includes(language))
    await shiki.loadLanguage(language);
  const { tokens } = shiki.codeToTokens(request.text, {
    lang: language,
    themes,
    defaultColor: false,
  });
  post({
    type: "highlight",
    id: request.id,
    key: request.key,
    tokens: tokens.flatMap((line, index) =>
      (index === tokens.length - 1
        ? line
        : [...line, { content: "\n", htmlStyle: undefined }]
      )
        .filter((token) => token.content.length > 0)
        .map((token): [string, string] => [
          token.content,
          styleOf(token.htmlStyle),
        ]),
    ),
  });
}

async function drain() {
  if (running) return;
  running = true;
  while (pending.size > 0) {
    const [key, request] = pending.entries().next().value as [
      string,
      HighlightRequest,
    ];
    pending.delete(key);
    try {
      await run(request);
    } catch (error) {
      post({
        type: "error",
        id: request.id,
        key: request.key,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  running = false;
}

self.onmessage = (
  event: MessageEvent<HighlightRequest | { type: "dispose"; key: string }>,
) => {
  const message = event.data;
  const queued = pending.get(message.key);
  if (queued) post({ type: "superseded", id: queued.id, key: queued.key });
  pending.delete(message.key);
  if (message.type === "highlight") pending.set(message.key, message);
  void drain();
};
