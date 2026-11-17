/** A highlighted run: its text and its inline style (--shiki-light/-dark). */
export type CodeToken = [content: string, style: string];

export type HighlightRequest = {
  type: "highlight";
  id: number;
  key: string;
  text: string;
  language: string;
};

export type HighlightResponse =
  | { type: "highlight"; id: number; key: string; tokens: CodeToken[] }
  | { type: "superseded"; id: number; key: string }
  | { type: "error"; id: number; key: string; message: string };

type Waiter = (tokens: CodeToken[] | undefined) => void;

let worker: Worker | undefined;
let unavailable = false;
let nextId = 0;
const waiters = new Map<number, Waiter>();

function getWorker() {
  if (worker || unavailable) return worker;
  if (typeof Worker === "undefined") {
    unavailable = true;
    return;
  }
  try {
    worker = new Worker(new URL("./shiki.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    unavailable = true;
    return;
  }
  const fail = () => {
    unavailable = true;
    for (const resolve of waiters.values()) resolve(undefined);
    waiters.clear();
    worker?.terminate();
    worker = undefined;
  };
  worker.onmessage = (event: MessageEvent<HighlightResponse>) => {
    const resolve = waiters.get(event.data.id);
    waiters.delete(event.data.id);
    resolve?.(event.data.type === "highlight" ? event.data.tokens : undefined);
  };
  worker.onerror = fail;
  worker.onmessageerror = fail;
  return worker;
}

/**
 * Highlights code off the main thread with Capy's capy-light/capy-dark themes.
 * Resolves undefined when superseded by a newer request for the same key, when
 * highlighting fails, or where workers are unavailable (the block then stays
 * plain text).
 */
export function highlightCode(
  key: string,
  text: string,
  language: string,
): Promise<CodeToken[] | undefined> {
  const target = getWorker();
  if (!target) return Promise.resolve(undefined);
  nextId += 1;
  const id = nextId;
  return new Promise((resolve) => {
    waiters.set(id, resolve);
    target.postMessage({
      type: "highlight",
      id,
      key,
      text,
      language,
    } satisfies HighlightRequest);
  });
}

export function disposeHighlight(key: string) {
  worker?.postMessage({ type: "dispose", key });
}

/** Parses a token's "prop:value;prop:value" style into a React style object. */
export function tokenStyle(style: string): Record<string, string> | undefined {
  if (!style) return;
  const result: Record<string, string> = {};
  for (const part of style.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    result[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
  }
  return result;
}
