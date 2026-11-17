# kiki-verify

Real-browser verification for a kiki ref. It builds the ref, opens every target in [agent-browser](https://github.com/vercel-labs/agent-browser) (Chrome for Testing over CDP, no Playwright), takes a screenshot, the computed styles of key elements and the accessibility snapshot, compares the screenshot pixel by pixel with the target's Doop frame from canvas `tnKVYw9CeC`, checks the computed styles against the values you expect, and writes JSON and Markdown pass/fail reports.

Targets fan out across parallel [Instabox](https://instabox.sh/llms.txt) VMs. Each VM builds and serves the ref once (`vite preview`) and runs its share of targets, then is deleted, on errors too. Without an Instabox key, or when a VM fails, the same runner drives agent-browser locally.

```sh
bun run verify --ref 42 --targets tools/verify/targets/main-proof.json            # PR #42
bun run verify --ref 5806a90 --targets my-targets.json --status                     # a sha, and post a "verify" commit status
bun run verify --ref main --targets my-targets.json --local                         # skip Instabox
```

`--ref` takes a PR number, a sha (short or full) or a branch. Exit code 0 means every target passed, 1 means at least one failed, 2 is a usage error.

## Requirements

- bun, and `agent-browser` on PATH for local runs (`bun add -g agent-browser`, then `agent-browser install --with-deps`; if the bun-installed wrapper needs node, link the native binary: `ln -sf ~/.bun/install/global/node_modules/agent-browser/bin/agent-browser-linux-x64 ~/.bun/bin/agent-browser`).
- An Instabox API key in `INSTABOX_API_KEY` or `~/.config/instabox/key`. The script reads it and never prints it.
- `gh` signed in, only for `--status`.
- The Doop frame manifest (below), only for targets with a `frame`.

## Targets

A targets file is JSON. `matrix` expands every target over themes and color schemes unless the target pins its own `theme` or `scheme`; `variants` overrides fields for one theme (`"github"`), one scheme (`"light"`) or one pair (`"default/dark"`), most specific last. `{theme}` and `{scheme}` in a route are filled in.

```json
{
  "matrix": { "theme": ["default", "catppuccin"], "scheme": ["dark", "light"] },
  "defaults": { "maxMismatch": 2 },
  "targets": [
    {
      "id": "settings-models",
      "route": "/settings/models",
      "state": "model menu open",
      "viewport": "1440x818",
      "steps": [
        ["click", "button[aria-haspopup=menu]"],
        ["wait", "[role=menu]"]
      ],
      "capture": {
        "[role=menu]": ["background-color", "border-radius", "box-shadow"]
      },
      "variants": {
        "default/dark": {
          "frame": "vpK_uBrg0B",
          "expect": {
            "[role=menu]": {
              "background-color": "#1e1e1f",
              "border-radius": "8px"
            }
          }
        }
      }
    }
  ]
}
```

| field         | meaning                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route`       | path and query, opened on the served build                                                                                                                                                                              |
| `id`, `state` | name in the report (default: the route); `state` is a label for what `steps` reach                                                                                                                                      |
| `theme`       | `default` or a preset id from `src/tokens/theme.ts`; seeded into the app's appearance storage before any script runs                                                                                                    |
| `scheme`      | `dark` or `light`; sets both the app's mode and `prefers-color-scheme`                                                                                                                                                  |
| `viewport`    | `{ "width", "height", "scale" }` or `"WxH@scale"`; default is the Doop frame's size, else 1440×900. Use `@2` with a 2× Doop export                                                                                      |
| `steps`       | agent-browser commands run in order after load, each an argv array: `["click", "sel"]`, `["hover", "sel"]`, `["fill", "sel", "text"]`, `["press", "Escape"]`, `["wait", "sel"]`, `["eval", "js"]` and so on             |
| `frame`       | Doop frame id on canvas `tnKVYw9CeC` to compare against                                                                                                                                                                 |
| `expect`      | `{ selector: { css-property: value } }`, the bundle values. Values are compared after the browser computes both sides, so `#1e1e1f`, `rgb(30 30 31)` and an `oklch()` of the same color all match, and `var(--x)` works |
| `capture`     | extra `{ selector: [properties] }` to record (`[]` = a default set). `html`, `body`, `#root > *` and `h1` are always captured                                                                                           |
| `fullPage`    | full-page screenshot instead of the viewport                                                                                                                                                                            |
| `maxMismatch` | pass threshold in percent of pixels (default `--max-mismatch`, 2)                                                                                                                                                       |
| `threshold`   | per-pixel color distance, 0 to 1 (default 0.05). Keep it low: Capy is mostly near-black, and at 0.1 an empty placeholder page scored 3% against the real Issues screen, while at 0.05 it scores 27%                     |

A target passes when it ran without error, its mismatch is at or under `maxMismatch` with matching image sizes (when it has a frame), and every `expect` value matches. Animations, transitions and the caret are disabled and fonts awaited before capture.

## Doop frames

Frames come from canvas `tnKVYw9CeC` only. The script refuses any frame id missing from the canvas manifest, `~/.capy/drive/captain-yuzu/renders/verify/_doop/canvas-tnKVYw9CeC.json` (or `--doop-manifest`), and downloads each frame's PNG once, at the target's scale, from Doop's render endpoint (the same image `getFrameScreenshot` returns). PNGs are cached next to the manifest, keyed by frame id, scale and the frame's `updatedAt`, so an edited frame is fetched again after the manifest is refreshed.

To refresh the manifest after frames are added or edited, run this in a Capy `execute` program (Doop is an MCP tool, so the script cannot list the canvas itself):

```js
const pages = JSON.parse(
  await tools.doop.getCanvas({ canvas_id: "tnKVYw9CeC" }),
).pages;
const frames = [];
for (const p of pages) {
  const t = await tools.doop.getCanvas({
    canvas_id: "tnKVYw9CeC",
    page_id: p.id,
  });
  const re =
    /"id": "([^"]+)",\s*"pageId": "([^"]+)",\s*"name": "((?:[^"\\]|\\.)*)",[\s\S]*?"width": (\d+),\s*"height": (\d+),\s*"updatedAt": "([^"]+)"/g;
  for (const m of t.matchAll(re))
    frames.push({
      id: m[1],
      pageId: m[2],
      name: m[3],
      width: +m[4],
      height: +m[5],
      updatedAt: m[6],
    });
}
await tools.capy.write({
  path: "~/.capy/drive/captain-yuzu/renders/verify/_doop/canvas-tnKVYw9CeC.json",
  content: JSON.stringify({
    canvas: "tnKVYw9CeC",
    refreshedAt: new Date(await now()).toISOString(),
    frames,
  }),
});
```

The manifest lists every frame with its name and page, so it is also the quickest way to find the frame id for a screen.

## Instabox

- Targets are split round robin into shards of `--per-vm` (default 4), at most `--max-vms` (default 16) at once, and every shard gets its own VM at `--size` (default `2x4`, the cheapest; it drops to the plan default when the plan has no 2/4 size).
- A VM boots from the newest ready `kiki-verify-warm-*` snapshot (bun, agent-browser with Chrome and its libraries, a kiki checkout with main's dependencies), or from the `agent-browser` template when there is none. It fetches the ref, runs `bun install` (a no-op unless the lockfile changed), builds once and serves the build with `vite preview`, then runs `runner.ts` with `--vm-concurrency` browser sessions.
- Every VM is created with a one-hour `deleteAfterSeconds` backstop and deleted (with `X-Confirm-Delete`) the moment its shard finishes or fails, and on Ctrl-C. `bun run verify cleanup` deletes any `kiki-verify-*` VM left over.
- A shard whose VM cannot be created or fails falls back to local agent-browser on the machine running the script, and the report says which host ran each target.
- Rebuild the snapshot when main's dependencies change a lot: `bun run verify snapshot` (keeps the two newest).

Routes under `/__` (the `/__tokens` specimen) exist only in development builds, so a run that includes one builds with `--mode development`.

## Output

Reports go to `~/.capy/drive/captain-yuzu/renders/verify/<ref>/` when that drive is mounted (else `~/.cache/kiki-verify/out/<ref>/`, or `--out`), where `<ref>` is `pr-<n>`, the short sha or the branch:

- `report.md`: a table of every target with its mismatch, style checks and result, then build | Doop | diff images and the failing style values for each failure.
- `report.json`: the same, plus every captured computed style, the hosts and per-VM timings.
- `targets/<id>/shot.png`, `diff.png` (red marks mismatched pixels) and `a11y.txt` (the agent-browser accessibility snapshot).

Never commit any of it. `--status` posts a `verify` commit status (success only when every target passed) on the resolved sha.
