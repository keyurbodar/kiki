/**
 * The guard answers one question: does this class token produce a CSS rule?
 *
 * It runs that question twice: once over utility-shaped tokens (a class that
 * looks like Tailwind but compiles to nothing), and once over component-shaped
 * tokens — a plain kebab word in a `className` list that is neither a Tailwind
 * utility nor a selector in one of our stylesheets. The second sweep exists
 * because `chat-scroller` sat in the transcript for weeks styling nothing: the
 * first sweep skipped the whole literal it appeared in, since that literal also
 * held utilities and `chat-scroller` is not one of them.
 *
 * And it still cannot tell a component class Capy defines from a utility composition Capy writes inline,
 * It cannot tell a component class Capy defines from a utility composition
 * Capy writes inline, so a token this file reports as unstyled may be inert in
 * Capy too rather than a rule we never ported. Check the bundle before
 * inventing a rule: `diff-comment-discussion` was reported that way and is
 * composed as utilities on both sides, so the honest fix there was nothing.
 */
export type ClassCandidate = {
  token: string;
  line: number;
};

export type UnstyledClass = {
  file: string;
  token: string;
  line: number;
};

/**
 * Classes that appear in JSX but style nothing in this project or in Tailwind's
 * defaults. Every one is a style somebody meant to apply; they are listed here
 * rather than fixed so the guard stays green while their owners decide the
 * intended form. `src/tokens/COVERAGE.md` documents the shape the canvas colour
 * tokens should take (`bg-(--primary-soft)` and friends).
 */
export const KNOWN_UNSTYLED: ReadonlyArray<{
  file: string;
  token: string;
  note: string;
}> = [
  {
    file: "src/components/image-crop-editor/image-crop-editor.tsx",
    token: "bg-bg",
    note: "bg-(--bg), see COVERAGE.md",
  },
  {
    file: "src/features/settings-appearance/background-effect/background-effect.tsx",
    token: "bg-bg",
    note: "bg-(--bg), see COVERAGE.md",
  },
  {
    file: "src/features/settings-integrations/api/service-user-detail-page.tsx",
    token: "text-text-link",
    note: "text-(--text-link), see COVERAGE.md",
  },
  {
    file: "src/features/settings-notifications/notifications-slack-page/notifications-slack-page.tsx",
    token: "text-text-link",
    note: "text-(--text-link), see COVERAGE.md",
  },
  {
    file: "src/components/pull-view/markdown.tsx",
    token: "text-primary-text",
    note: "text-(--primary-text), see COVERAGE.md",
  },
  {
    file: "src/components/annotation/annotation.tsx",
    token: "bg-primary-soft",
    note: "bg-(--primary-soft), see COVERAGE.md",
  },
  {
    file: "src/features/settings-appearance/theme-publish/publish-theme-page.tsx",
    token: "text-destructive-text",
    note: "text-(--destructive-text), see COVERAGE.md",
  },
  {
    file: "src/features/settings-appearance/theme-publish/publish-theme-page.tsx",
    token: "bg-destructive-text",
    note: "bg-(--destructive-text), see COVERAGE.md",
  },
  {
    file: "src/components/diff-toolbar/diff-toolbar.tsx",
    token: "hover:bg-accent",
    note: "no --accent token exists in either tree",
  },
  {
    file: "src/components/diff-toolbar/diff-toolbar.tsx",
    token: "focus-visible:bg-accent",
    note: "no --accent token exists in either tree",
  },
  {
    file: "src/features/thread-panes/diffs-view/diffs-view.tsx",
    token: "bg-accent",
    note: "no --accent token exists in either tree",
  },
];

/**
 * Component-shaped classes that are deliberately not CSS: markers another
 * system reads, and names both trees compose from utilities. Every entry needs
 * the reason; a stale one — a class that styles something again — fails the
 * check so the list cannot grow silently.
 */
export const KNOWN_DEAD_COMPONENT_CLASSES: ReadonlyArray<{
  file: string;
  token: string;
  note: string;
}> = [
  {
    file: "src/components/diff-tab/diff-file-card.tsx",
    token: "diff-comment-discussion",
    note: "a marker both trees compose from utilities; Capy defines no such rule either",
  },
  {
    file: "src/features/explore/setup-panel/setup-panel-art.tsx",
    token: "ph-no-capture",
    note: "PostHog's privacy marker, an attribute for its recorder rather than a style",
  },
  {
    file: "src/primitives/dither/dither-shader.tsx",
    token: "ph-no-capture",
    note: "PostHog's privacy marker, an attribute for its recorder rather than a style",
  },
];

const CLASS_ATTRIBUTE = "className";

/**
 * Prefixes of Tailwind's own utilities. A literal is only read as a class list
 * when every token in it looks like one of these, which keeps variant arguments
 * (buttonVariants({ size: "icon-sm" })) and component stylesheet names out of
 * the sweep: those are not Tailwind utilities, and this guard is about
 * utilities that style nothing.
 */
const UTILITY_PREFIXES = [
  "absolute",
  "active:",
  "align-",
  "animate-",
  "aria-",
  "aspect-",
  "backdrop-",
  "basis-",
  "bg-",
  "block",
  "border",
  "break-",
  "checked:",
  "col-",
  "content-",
  "cursor-",
  "data-",
  "delay-",
  "disabled:",
  "divide-",
  "duration-",
  "ease-",
  "fill-",
  "first:",
  "fixed",
  "flex",
  "focus-visible:",
  "float-",
  "gap-",
  "from-",
  "indent-",
  "left-",
  "line-clamp",
  "list-",
  "mt-",
  "mb-",
  "ml-",
  "mr-",
  "mx-",
  "my-",
  "pt-",
  "pb-",
  "pl-",
  "pr-",
  "px-",
  "py-",
  "top-",
  "right-",
  "bottom-",
  "inset",
  "scale-",
  "rotate-",
  "translate-",
  "table",
  "via-",
  "to-",
  "stroke-",
  "line-through",
  "prose",
  "font-",
  "grid",
  "group-",
  "grow",
  "h-",
  "hidden",
  "hover:",
  "inline",
  "isolate",
  "items-",
  "justify-",
  "last:",
  "leading-",
  "m-",
  "mask-",
  "max-",
  "min-",
  "ml-",
  "mr-",
  "object-",
  "opacity-",
  "order-",
  "outline",
  "overflow",
  "p-",
  "peer-",
  "place-",
  "pointer-",
  "relative",
  "ring",
  "rounded",
  "row-",
  "select-",
  "self-",
  "shadow",
  "shrink",
  "size-",
  "space-",
  "sr-only",
  "static",
  "sticky",
  "text-",
  "tracking-",
  "transition",
  "truncate",
  "underline",
  "uppercase",
  "w-",
  "whitespace-",
  "will-",
  "z-",
  "[",
];

export const isUtility = (token: string) =>
  UTILITY_PREFIXES.some((prefix) => token.startsWith(prefix));

/** Utility words that carry no variant, dash or bracket. */
const SINGLE_WORDS = new Set([
  "absolute",
  "block",
  "border",
  "contents",
  "flex",
  "grid",
  "grow",
  "hidden",
  "inline",
  "isolate",
  "italic",
  "outline",
  "relative",
  "ring",
  "rounded",
  "shadow",
  "shrink",
  "static",
  "sticky",
  "truncate",
  "underline",
  "uppercase",
]);

const isSkipped = (token: string) => {
  if (token.includes("${") || token.includes("'") || token.includes('"')) {
    return true;
  }
  if (token === "group" || token.startsWith("group/")) return true;
  if (token === "peer" || token.startsWith("peer/")) return true;
  if (!/^[a-z![]/.test(token)) return true;
  if (/[^a-z0-9:/.[\]()%#!_-]/.test(token)) return true;
  const looksLikeUtility =
    token.includes("-") ||
    token.includes(":") ||
    token.includes("[") ||
    SINGLE_WORDS.has(token);
  return !looksLikeUtility;
};

/** Every string literal inside the `{...}` at `start`, following nesting. */
function literalsInBraces(source: string, start: number) {
  const spans: { text: string; offset: number }[] = [];
  let depth = 0;
  let quote: string | null = null;
  let literalStart = -1;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote !== null) {
      if (char === "\\") i++;
      else if (char === quote) {
        spans.push({
          text: source.slice(literalStart + 1, i),
          offset: literalStart + 1,
        });
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      literalStart = i;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return spans;
}

/**
 * Every class token written in a `className` attribute, with the line it sits
 * on. Conditional lists (`className={cx("a", open && "b")}`) are included,
 * because the literals inside the braces are what reaches the browser.
 */
export function findClassCandidates(source: string): ClassCandidate[] {
  const found: ClassCandidate[] = [];
  const seen = new Set<string>();
  const lineOf = (offset: number) => source.slice(0, offset).split("\n").length;

  let index = source.indexOf(CLASS_ATTRIBUTE);
  while (index !== -1) {
    let cursor = index + CLASS_ATTRIBUTE.length;
    while (source[cursor] === " " || source[cursor] === "\n") cursor++;
    if (source[cursor] !== "=") {
      index = source.indexOf(CLASS_ATTRIBUTE, cursor);
      continue;
    }
    cursor++;
    while (source[cursor] === " " || source[cursor] === "\n") cursor++;

    const quote = source[cursor];
    const spans: { text: string; offset: number }[] = [];
    if (quote === '"' || quote === "'") {
      const end = source.indexOf(quote, cursor + 1);
      if (end === -1) break;
      spans.push({ text: source.slice(cursor + 1, end), offset: cursor + 1 });
      cursor = end + 1;
    } else if (quote === "{") {
      spans.push(...literalsInBraces(source, cursor));
      cursor = index + CLASS_ATTRIBUTE.length;
    } else {
      index = source.indexOf(CLASS_ATTRIBUTE, cursor);
      continue;
    }

    for (const span of spans) {
      const tokens = [...span.text.matchAll(/\S+/g)]
        .map((match) => ({ token: match[0], index: match.index ?? 0 }))
        .filter(({ token }) => !isSkipped(token));
      if (!tokens.every(({ token }) => isUtility(token))) continue;
      for (const { token, index } of tokens) {
        if (seen.has(token)) continue;
        seen.add(token);
        found.push({ token, line: lineOf(span.offset + index) });
      }
    }

    index = source.indexOf(CLASS_ATTRIBUTE, cursor);
  }
  return found;
}

/**
 * Component-shaped tokens: a plain kebab-case word with no variant, bracket or
 * arbitrary value. These are the names a stylesheet is expected to define
 * (`chat-scroller`, `kiki-menu-row`), so a component token that Tailwind does
 * not compile and no stylesheet selects is a class that styles nothing.
 */
const isComponentShaped = (token: string) =>
  /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(token);

/**
 * Every component-shaped class token written in a `className` attribute,
 * regardless of whether the literal around it also holds utilities.
 */
export function findComponentClassCandidates(source: string): ClassCandidate[] {
  const found: ClassCandidate[] = [];
  const seen = new Set<string>();
  const lineOf = (offset: number) => source.slice(0, offset).split("\n").length;

  let index = source.indexOf(CLASS_ATTRIBUTE);
  while (index !== -1) {
    let cursor = index + CLASS_ATTRIBUTE.length;
    while (source[cursor] === " " || source[cursor] === "\n") cursor++;
    if (source[cursor] !== "=") {
      index = source.indexOf(CLASS_ATTRIBUTE, cursor);
      continue;
    }
    cursor++;
    while (source[cursor] === " " || source[cursor] === "\n") cursor++;

    const quote = source[cursor];
    const spans: { text: string; offset: number }[] = [];
    if (quote === '"' || quote === "'") {
      const end = source.indexOf(quote, cursor + 1);
      if (end === -1) break;
      spans.push({ text: source.slice(cursor + 1, end), offset: cursor + 1 });
      cursor = end + 1;
    } else if (quote === "{") {
      // A single-token literal in braces is ambiguous: `buttonVariants({ size:
      // "icon-sm" })` names a variant and `visibility === "message-hover"`
      // compares a prop, and neither is a class. Only a space-separated list is
      // certainly a class list, so a lone class token in braces is left to the
      // utility sweep and to review.
      spans.push(
        ...literalsInBraces(source, cursor).filter((span) =>
          span.text.includes(" "),
        ),
      );
      cursor = index + CLASS_ATTRIBUTE.length;
    } else {
      index = source.indexOf(CLASS_ATTRIBUTE, cursor);
      continue;
    }

    for (const span of spans) {
      for (const match of span.text.matchAll(/\S+/g)) {
        const token = match[0];
        if (!isComponentShaped(token) || isSkipped(token)) continue;
        if (isUtility(token)) continue;
        if (seen.has(token)) continue;
        seen.add(token);
        found.push({ token, line: lineOf(span.offset + (match.index ?? 0)) });
      }
    }

    index = source.indexOf(CLASS_ATTRIBUTE, cursor);
  }
  return found;
}

/** The selector Tailwind emits for a class, with variants and arbitrary values escaped. */
export function selectorOf(token: string): string {
  const head = `.${token.replace(/[^\w-]/g, (char) => `\\${char}`)}`;
  const colon = token.lastIndexOf(":");
  return colon === -1 ? head : head.replace(/\\:/g, "\\:");
}

export function isAllowed(unstyled: UnstyledClass): boolean {
  return KNOWN_UNSTYLED.some(
    (known) => known.file === unstyled.file && known.token === unstyled.token,
  );
}

export function isAllowedDead(dead: UnstyledClass): boolean {
  return KNOWN_DEAD_COMPONENT_CLASSES.some(
    (known) => known.file === dead.file && known.token === dead.token,
  );
}

export type DeadComponentVerdict = {
  /** Allowlisted, but it styles something now: the entry should go. */
  stale: UnstyledClass[];
  /** No rule anywhere, and nobody has claimed it. */
  unknown: UnstyledClass[];
};

export function classifyDeadComponentClasses(
  hits: ReadonlyArray<UnstyledClass & { styled: boolean }>,
): DeadComponentVerdict {
  const stale: UnstyledClass[] = [];
  const unknown: UnstyledClass[] = [];
  for (const { file, token, line, styled } of hits) {
    const entry = { file, token, line };
    const allowed = isAllowedDead(entry);
    if (!styled && !allowed) unknown.push(entry);
    if (styled && allowed) stale.push(entry);
  }
  return { stale, unknown };
}

export type ClassVerdict = {
  /** Allowlisted, but it compiles now: the entry should be deleted. */
  stale: UnstyledClass[];
  /** No rule anywhere, and nobody has claimed it. */
  unknown: UnstyledClass[];
};

/**
 * Splits the classes that produced no CSS into the ones we already know about
 * and the ones nobody has seen. An allowlisted class that *does* compile is
 * reported too, so the list cannot quietly become permanent.
 */
export function classify(
  hits: ReadonlyArray<UnstyledClass & { styled: boolean }>,
): ClassVerdict {
  const stale: UnstyledClass[] = [];
  const unknown: UnstyledClass[] = [];
  for (const { file, token, line, styled } of hits) {
    const entry = { file, token, line };
    const allowed = isAllowed(entry);
    if (!styled && !allowed) unknown.push(entry);
    if (styled && allowed) stale.push(entry);
  }
  return { stale, unknown };
}
