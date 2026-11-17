# markdown chips

Capy's `shared/markdown/chips.tsx`: the inline chips the markdown renderer draws for files, pull requests, commits, threads, subagents, issues, drive files and composer mentions, each with its tooltip or hover card. WP B6.

## Plugging into the markdown pipeline

```tsx
import { markdownChipComponents } from "@/components/markdown-chips";

<MarkdownComponentsProvider value={markdownChipComponents}>
  <Markdown text={body} />
</MarkdownComponentsProvider>
```

`markdownChipComponents` is exactly the markdown package's two plug-in points:

| key          | what it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `chip`       | `MarkdownChipRenderer`, rendering anchors with `data-chip` and spans with `data-chip` / `data-mention` |
| `transforms` | `[chipTransform]`, the hast pass that marks the chip-able runs             |

They are already the defaults in `defaultMarkdownComponents`, so `<Markdown>` chips everything without any provider. Use the provider for a scoped override, for example a preview that renders chips as plain text (`interactive: false`) or a surface whose reference map differs.

`createChipTransform({ issuePrefix })` builds the same pass with a project's issue prefix, so `KIKI-12` becomes an issue chip instead of a thread chip. Every function in `references.ts` is pure and exported: `classifyHref` (link target → pull request, commit, file, drive, Paper), `parseCodes` (thread codes, `Subagent N`, `owner/repo#N`), `parseDriveReference` and `splitText`.

## What the transform marks

- **Links.** GitHub pull request and commit URLs, `drive:` targets, Paper file URLs and repository paths become chip anchors (`data-chip`, kind on the anchor).
- **Text.** File paths (`src/app/main.tsx:12`), `drive:` refs, `owner/repo#N` / `repo#N` / `#N`, thread codes, `Subagent N` and, with an issue prefix, issue codes become `<span data-chip data-chip-value>`.
- **Inline code.** A code span that is exactly one path becomes a chip; a directory-ish code span becomes a `path` chip when the surface resolves paths.
- Nothing inside `code`, `pre`, `a`, existing chips or mentions is touched. A bare `#N` inherits the repository of an earlier ref in the same block (Capy's `inheritPullRepositories`).

## Data

Chips never fetch. A surface fills `MarkdownChipsContextValue` (`context.tsx`) from its own atoms and passes callbacks for the interactive bits:

```tsx
<MarkdownChipsProvider
  value={{
    projectId,
    repository: "acme/web",
    pullRequests,          // Map<"owner/repo#N", ChipPull>
    threads,               // Map<code, ChipThread | "ambiguous">
    tasks,                 // Map<localIndex, ChipTask>
    issues,                // Map<code, ChipIssue>
    mentions,              // Map<index, ChipMention>
    openFile, openFolder, openTask, openThread, openIssue, openPull,
    driveOpener, paperOpener,
    renderIssueState, renderIssuePriority,
    interactive: true,     // false renders chips as plain text
    preview: "card",       // "none" drops hover cards
  }}
>
```

Unknown references degrade exactly like Capy's: an unresolved thread code stays text, an unresolved pull ref links to its GitHub issue, an unresolved issue code falls back to a thread chip.

`fixtures.ts` holds the neutral Acme sample data used by the tests and the specimen page.

## Hover surfaces

- `PullReferenceLink` + `PullRequestHoverPanel` — pull reference hover card (`w-96`), diff counts and author, 300 ms open delay.
- `ThreadLinkChip` + `ThreadChipPreview` — thread hover card header (`w-96`). The issues, pulls and crew sections of the full card belong to the thread-preview package.
- `IssueChip` + `IssuePreview` (`w-80`), `TaskChip` + `TaskPreview` (subagent), `FileChip` and `DriveReferenceChip` tooltips, and the dotted-underline ambiguous thread code tooltip.
- Every popup uses `@/primitives/preview-card` and `@/primitives/tooltip` with Capy's class strings in `classes.ts`.

## Icons

`icons.tsx` draws Capy's pull-state, thread-status, subagent-status and mention glyphs. The shared sprite (`src/primitives/icon`) has no pull-state, archive or mention-kind icons yet, so `glyphs.ts` carries the path data ported from the bundle's icon components and `ChipGlyph` draws them on Capy's 24-grid. Swap them for sprite ids when those land. File-type icons come from `@pierre/trees`' complete set, the same source the composer's strip uses.

## Specimen

`/__chips` (dev only) renders the real pipeline plus each hover surface open, for kiki-verify and pixel comparison against the Doop chip-hover frames.
