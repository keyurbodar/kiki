# features/settings-agent

Owner: C6. Scope: instructions, skills, threads, git, review, import, memory settings.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

- `agent-scopes/`: Capy's agent scopes (organization, project, you, you in the project, the project's captains), the project menu, the scope-file editor, the volume file reader and writer hooks, SKILL.md frontmatter helpers and the glyphs these pages use.
- `agent-context-preview/`: "Loaded before the first message", the context budget breakdown with its Preview as and Model pickers.
- `instructions-page/`: `/settings/instructions`, one AGENTS.md row per scope and the scope file side sheet (Captain and Crew rules tabs on captain scopes).
- `skills-page/`: `/settings/skills`, skills in Drive across scopes with search, the New skill scope menu, and the create/edit/delete skill side sheet.
- `import-dialog/`: Capy's import dialog for local agent sessions (no frame; opened from onboarding).
- `skill-update/`: the "update available" card for a skill installed from Explore.

Data comes from `@/data/atoms/agent-context`, which decodes Capy's `volumes` shapes (drive scopes, manifests, files, agent context preview) until the group is typed. `/settings/import` is not a page in Capy; its route renders the not-found page.
