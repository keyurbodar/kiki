import { isoMinutesAgo, world } from "../fixtures/world.ts";

export interface GitFile {
  readonly path: string;
  readonly content: string;
  readonly language: string;
  readonly size: number;
  readonly updatedAt: string;
}

export interface GitStoredFile extends GitFile {
  readonly turnId: string;
  readonly storedAt: string;
}

export interface GitTurn {
  readonly id: string;
  readonly threadId: string;
  readonly number: number;
  readonly createdAt: string;
  readonly summary: string;
  readonly files: ReadonlyArray<string>;
}

export interface GitThreadState {
  readonly repo: string;
  readonly branch: string;
  readonly head: string;
  readonly files: ReadonlyArray<GitFile>;
  readonly baseline: ReadonlyArray<GitFile>;
  readonly staged: ReadonlyArray<string>;
  readonly untracked: ReadonlyArray<string>;
  readonly snapshots: ReadonlyArray<GitStoredFile>;
  readonly turns: ReadonlyArray<GitTurn>;
}

export interface GitTreeEntry {
  readonly name: string;
  readonly path: string;
  readonly type: "file" | "directory";
  readonly size?: number;
  readonly language?: string;
  readonly children?: ReadonlyArray<GitTreeEntry>;
}

export const gitFileSize = (content: string) =>
  new TextEncoder().encode(content).length;

export const sampleFilePath = "src/checkout/retry.ts";

const file = (
  path: string,
  content: string,
  language: string,
  minutes: number,
): GitFile => ({
  path,
  content,
  language,
  size: gitFileSize(content),
  updatedAt: isoMinutesAgo(minutes),
});

const webRepo = world.repos[0].fullName;
const apiRepo = world.repos[1].fullName;
const docsRepo = world.repos[3].fullName;

const retryContent = [
  "export const retry = async <T>(run: () => Promise<T>, attempts = 3) => {",
  "  let lastError: unknown;",
  "  for (let attempt = 0; attempt < attempts; attempt++) {",
  "    try {",
  "      return await run();",
  "    } catch (error) {",
  "      lastError = error;",
  "    }",
  "  }",
  "  throw lastError;",
  "};",
  "",
].join("\n");

const retryBaseline = [
  "export const retry = async <T>(run: () => Promise<T>) => {",
  "  return await run();",
  "};",
  "",
].join("\n");

const webFiles: ReadonlyArray<GitFile> = [
  file(sampleFilePath, retryContent, "typescript", 12),
  file(
    "src/checkout/client.ts",
    [
      'import { retry } from "./retry.ts";',
      "",
      "export const submitCheckout = (orderId: string) =>",
      '  retry(() => fetch("/api/orders/" + orderId + "/checkout", { method: "POST" }));',
      "",
    ].join("\n"),
    "typescript",
    34,
  ),
  file(
    "tests/checkout/retry.test.ts",
    [
      'import { describe, expect, it } from "vitest";',
      'import { retry } from "../../src/checkout/retry.ts";',
      "",
      'describe("retry", () => {',
      '  it("retries a failing call", async () => {',
      "    let calls = 0;",
      '    const value = await retry(async () => ++calls === 2 ? "ok" : Promise.reject("retry" ));',
      '    expect(value).toBe("ok");',
      "  });",
      "});",
      "",
    ].join("\n"),
    "typescript",
    18,
  ),
  file(
    "README.md",
    [
      "# Web app",
      "",
      "Checkout retries are handled in `src/checkout/retry.ts`.",
      "",
    ].join("\n"),
    "markdown",
    90,
  ),
];

const themeFiles: ReadonlyArray<GitFile> = [
  file(
    "src/settings/theme.ts",
    [
      'export const themes = ["system", "light", "dark"] as const;',
      "export type Theme = (typeof themes)[number];",
      "",
      "export const isTheme = (value: string): value is Theme =>",
      "  themes.includes(value as Theme);",
      "",
    ].join("\n"),
    "typescript",
    25,
  ),
  file(
    "src/settings/ThemeToggle.tsx",
    [
      'import { useState } from "react";',
      'import { themes, type Theme } from "./theme.ts";',
      "",
      "export const ThemeToggle = () => {",
      '  const [theme, setTheme] = useState<Theme>("system");',
      "  return (",
      "    <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>",
      "      {themes.map((option) => <option key={option} value={option}>{option}</option>)}",
      "    </select>",
      "  );",
      "};",
      "",
    ].join("\n"),
    "tsx",
    22,
  ),
  file(
    "README.md",
    [
      "# Web app",
      "",
      "Settings now expose a system, light and dark theme.",
      "",
    ].join("\n"),
    "markdown",
    120,
  ),
];

const apiFiles: ReadonlyArray<GitFile> = [
  file(
    "internal/orders/cursor.go",
    [
      "package orders",
      "",
      "type Cursor struct {",
      "\tOrderID string",
      "\tCreated string",
      "}",
      "",
      "func Decode(value string) (Cursor, error) {",
      "\treturn Cursor{OrderID: value}, nil",
      "}",
      "",
    ].join("\n"),
    "go",
    42,
  ),
  file(
    "internal/orders/handler.go",
    [
      "package orders",
      "",
      'import "net/http"',
      "",
      "func List(w http.ResponseWriter, r *http.Request) {",
      '\tw.Write([]byte(`{"orders":[]}`))',
      "}",
      "",
    ].join("\n"),
    "go",
    75,
  ),
  file(
    "docs/pagination.md",
    ["# Pagination", "", "Orders are paged with an opaque cursor.", ""].join(
      "\n",
    ),
    "markdown",
    150,
  ),
];

const docsFiles: ReadonlyArray<GitFile> = [
  file(
    "docs/getting-started.md",
    [
      "# Getting started",
      "",
      "Install the CLI, connect a repository, then start a thread.",
      "",
    ].join("\n"),
    "markdown",
    8,
  ),
  file(
    "docs/quickstart.md",
    [
      "# Quickstart",
      "",
      "Create a project and link a repository to it.",
      "",
    ].join("\n"),
    "markdown",
    36,
  ),
];

const bundlerFiles: ReadonlyArray<GitFile> = [
  file(
    "package.json",
    [
      "{",
      '  "name": "web-app",',
      '  "private": true,',
      '  "type": "module"',
      "}",
      "",
    ].join("\n"),
    "json",
    64,
  ),
  file(
    "vite.config.ts",
    [
      'import { defineConfig } from "vite";',
      "",
      "export default defineConfig({",
      '  build: { target: "esnext" },',
      "});",
      "",
    ].join("\n"),
    "typescript",
    58,
  ),
];

const incidentFiles: ReadonlyArray<GitFile> = [
  file(
    "notes/incidents.md",
    [
      "# Incidents",
      "",
      "Last week's checkout timeout was traced to a gateway retry.",
      "",
    ].join("\n"),
    "markdown",
    180,
  ),
];

type WorldThread = (typeof world.threads)[keyof typeof world.threads];

const turnsFor = (
  thread: WorldThread,
  paths: ReadonlyArray<string>,
): ReadonlyArray<GitTurn> => [
  {
    id: `turn_${thread.number}_2`,
    threadId: thread.id,
    number: 2,
    createdAt: isoMinutesAgo(18),
    summary: `Applied file changes for ${thread.title}`,
    files: paths.slice(0, 2),
  },
  {
    id: `turn_${thread.number}_1`,
    threadId: thread.id,
    number: 1,
    createdAt: isoMinutesAgo(74),
    summary: `Inspected the repository for ${thread.title}`,
    files: paths.slice(0, 1),
  },
];

interface ThreadStateOptions {
  readonly repo: string;
  readonly branch: string;
  readonly files: ReadonlyArray<GitFile>;
  readonly staged?: ReadonlyArray<string>;
  readonly untracked?: ReadonlyArray<string>;
  readonly baselineEdits?: Readonly<Record<string, string>>;
}

const stateFor = (
  thread: WorldThread,
  options: ThreadStateOptions,
): GitThreadState => {
  const turns = turnsFor(
    thread,
    options.files.map((entry) => entry.path),
  );
  const firstTurnId = `turn_${thread.number}_2`;
  return {
    repo: options.repo,
    branch: options.branch,
    head: `head_${thread.number}`,
    files: options.files,
    baseline: options.files.map((entry) => {
      const content = options.baselineEdits?.[entry.path];
      return content === undefined
        ? entry
        : { ...entry, content, size: gitFileSize(content) };
    }),
    staged: options.staged ?? [],
    untracked: options.untracked ?? [],
    snapshots: options.files.map((entry, index) => ({
      ...entry,
      turnId: firstTurnId,
      storedAt: isoMinutesAgo(30 + index),
    })),
    turns,
  };
};

export const initialGitStates: ReadonlyMap<string, GitThreadState> = new Map([
  [
    world.threads.checkoutTest.id,
    stateFor(world.threads.checkoutTest, {
      repo: webRepo,
      branch: world.branches[1],
      files: webFiles,
      staged: [sampleFilePath],
      untracked: ["src/checkout/telemetry.ts"],
      baselineEdits: { [sampleFilePath]: retryBaseline },
    }),
  ],
  [
    world.threads.darkMode.id,
    stateFor(world.threads.darkMode, {
      repo: webRepo,
      branch: world.branches[1],
      files: themeFiles,
      staged: ["src/settings/theme.ts"],
    }),
  ],
  [
    world.threads.paginate.id,
    stateFor(world.threads.paginate, {
      repo: apiRepo,
      branch: world.branches[2],
      files: apiFiles,
      staged: ["internal/orders/cursor.go"],
    }),
  ],
  [
    world.threads.rateLimit.id,
    stateFor(world.threads.rateLimit, {
      repo: apiRepo,
      branch: world.branches[2],
      files: apiFiles,
    }),
  ],
  [
    world.threads.gettingStarted.id,
    stateFor(world.threads.gettingStarted, {
      repo: docsRepo,
      branch: "docs/quickstart",
      files: docsFiles,
    }),
  ],
  [
    world.threads.incidents.id,
    stateFor(world.threads.incidents, {
      repo: webRepo,
      branch: world.branches[0],
      files: incidentFiles,
    }),
  ],
  [
    world.threads.bundler.id,
    stateFor(world.threads.bundler, {
      repo: webRepo,
      branch: world.branches[3],
      files: bundlerFiles,
      staged: ["vite.config.ts"],
    }),
  ],
]);

export const treeEntries = (
  files: ReadonlyArray<Pick<GitFile, "path" | "size" | "language">>,
  prefix = "",
): ReadonlyArray<GitTreeEntry> => {
  const names = [
    ...new Set(
      files
        .filter((entry) => entry.path.startsWith(prefix))
        .map((entry) => entry.path.slice(prefix.length).split("/")[0])
        .filter((name): name is string => name !== undefined),
    ),
  ].sort();
  return names.map((name) => {
    const path = `${prefix}${name}`;
    const descendants = files.filter((entry) =>
      entry.path.startsWith(`${path}/`),
    );
    const current = files.find((entry) => entry.path === path);
    if (current && descendants.length === 0) {
      return {
        name,
        path,
        type: "file" as const,
        size: current.size,
        language: current.language,
      };
    }
    return {
      name,
      path,
      type: "directory" as const,
      children: treeEntries(files, `${path}/`),
    };
  });
};
