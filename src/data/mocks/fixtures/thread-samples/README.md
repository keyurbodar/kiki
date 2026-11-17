# Thread sample fixtures

Six neutral, deterministic sample threads in encoded `EventRow` form for thread-view work. Nothing here comes from real threads or private capture data.

Each sample is a `ThreadSample` exported from `index.ts`:

1. `todo-filter` — todo app: context, rule, successful tool use, every notification key.
2. `cli-docs` — CLI docs site: successful and failed tool results, review request, CI notice.
3. `todo-compaction` — todo app: compaction, background operation, every control command, context markers.
4. `docs-reports` — docs site: subagent and crew reports, retryable error.
5. `takeovers` — CLI tool: clarify and environment requests with their notices.
6. `workspace-move` — todo app: handoff in both directions, mobile session, legacy event, machine notices.

The fixtures are intentionally not wired into `MockServices`; import them directly from this directory in tests.
