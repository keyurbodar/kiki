# features/composer

Owner: B4. Scope: composer behaviour: Lexical plugins, mentions, slash menu, attachments, footer, context meter, queue.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

Stub units with their final data-slot names: `composer-footer`, `context-meter`, `message-queue`, `upload-send-failure`.
