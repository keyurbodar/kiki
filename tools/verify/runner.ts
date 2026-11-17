/// <reference types="node" />
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Job = {
  id: string;
  url: string;
  theme: string;
  scheme: "light" | "dark";
  viewport: { width: number; height: number; scale?: number };
  steps: string[][];
  fullPage: boolean;
  baseline?: string;
  threshold: number;
  expect: Record<string, Record<string, string>>;
  capture: Record<string, string[]>;
};

export type Shard = {
  baseUrl: string;
  outDir: string;
  concurrency: number;
  jobs: Job[];
};

export type StyleCheck = {
  selector: string;
  property: string;
  expected: string;
  expectedComputed: string;
  actual: string | null;
  pass: boolean;
};

export type JobResult = {
  id: string;
  error?: string;
  mismatchPct?: number;
  differentPixels?: number;
  totalPixels?: number;
  dimensionMismatch?: unknown;
  styles: Record<string, Record<string, string> | null>;
  checks: StyleCheck[];
  files: { shot?: string; diff?: string; a11y?: string };
  durationMs: number;
};

const DEFAULT_PROPS = [
  "display",
  "color",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "padding",
  "margin",
  "gap",
  "border-radius",
  "border-color",
  "border-width",
  "box-shadow",
  "opacity",
  "width",
  "height",
];

type AbOutput = {
  success: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
};

function ab(
  session: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<AbOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "agent-browser",
      ["--session", session, "--json", ...args],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      err += d;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      const line = out.trim().split("\n").filter(Boolean).at(-1) ?? "";
      let parsed: AbOutput | undefined;
      try {
        parsed = JSON.parse(line) as AbOutput;
      } catch {}
      if (parsed?.success) return resolve(parsed);
      reject(
        new Error(
          `agent-browser ${args.join(" ")}: ${parsed?.error ?? (err.trim() || out.trim() || `exit ${code}`)}`,
        ),
      );
    });
  });
}

const themeInit = (theme: string, scheme: string) => `(() => {
  try {
    if (location.protocol === "about:") return;
    const theme = ${JSON.stringify(theme)};
    if (theme === "default") localStorage.removeItem("capy-web:color-theme-v2");
    else localStorage.setItem("capy-web:color-theme-v2", JSON.stringify({ kind: "preset", id: theme }));
    const prev = JSON.parse(localStorage.getItem("capy-web:appearance") || "null") || {};
    localStorage.setItem("capy-web:appearance", JSON.stringify({ ...prev, preferences: { ...(prev.preferences || {}), mode: ${JSON.stringify(scheme)} } }));
  } catch {}
})();`;

const SETTLE = `(async () => {
  const s = document.createElement("style");
  s.textContent = "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;caret-color:transparent!important}";
  document.head.appendChild(s);
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
})()`;

const stylesScript = (
  capture: Job["capture"],
  expect: Job["expect"],
) => `(() => {
  const capture = ${JSON.stringify(capture)};
  const expect = ${JSON.stringify(expect)};
  const DEFAULT = ${JSON.stringify(DEFAULT_PROPS)};
  const read = (sel, props) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
  };
  const styles = {};
  for (const [sel, props] of Object.entries(capture)) styles[sel] = read(sel, props.length ? props : DEFAULT);
  for (const sel of Object.keys(expect)) if (!(sel in styles)) styles[sel] = read(sel, DEFAULT);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (v) => {
    if (!v || !ctx || !CSS.supports("color", v)) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const same = (a, b) => {
    if (a === b || a.trim() === b.trim()) return true;
    const x = rgba(a);
    const y = rgba(b);
    return !!x && !!y && x.every((c, i) => Math.abs(c - y[i]) <= 2);
  };
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const checks = [];
  for (const [sel, props] of Object.entries(expect)) {
    const el = document.querySelector(sel);
    for (const [property, expected] of Object.entries(props)) {
      probe.style.setProperty(property, expected);
      const expectedComputed = getComputedStyle(probe).getPropertyValue(property);
      probe.style.removeProperty(property);
      const actual = el ? getComputedStyle(el).getPropertyValue(property) : null;
      checks.push({ selector: sel, property, expected, expectedComputed, actual, pass: actual !== null && (same(actual, expectedComputed) || same(actual, expected)) });
    }
  }
  probe.remove();
  return { styles, checks };
})()`;

export async function runJob(job: Job, shard: Shard): Promise<JobResult> {
  const started = Date.now();
  const dir = join(shard.outDir, job.id);
  mkdirSync(dir, { recursive: true });
  const session = `kv-${job.id}`.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  const result: JobResult = {
    id: job.id,
    styles: {},
    checks: [],
    files: {},
    durationMs: 0,
  };
  const init = join(dir, "theme-init.js");
  writeFileSync(init, themeInit(job.theme, job.scheme));
  const full = job.fullPage ? ["--full"] : [];
  try {
    await ab(session, ["--init-script", init, "open", "about:blank"]);
    const { width, height, scale } = job.viewport;
    await ab(session, [
      "set",
      "viewport",
      String(width),
      String(height),
      ...(scale ? [String(scale)] : []),
    ]);
    await ab(session, ["set", "media", job.scheme, "reduced-motion"]);
    await ab(session, ["open", shard.baseUrl + job.url]);
    await ab(session, ["wait", "--load", "networkidle"]).catch(() => undefined);
    await ab(session, ["eval", SETTLE]);
    for (const step of job.steps) await ab(session, step);
    if (job.steps.length) await ab(session, ["eval", SETTLE]);
    await ab(session, ["screenshot", ...full, join(dir, "shot.png")]);
    result.files.shot = `${job.id}/shot.png`;
    if (job.baseline) {
      const diff = await ab(session, [
        "diff",
        "screenshot",
        "--baseline",
        job.baseline,
        "--output",
        join(dir, "diff.png"),
        "--threshold",
        String(job.threshold),
        ...full,
      ]);
      const d = diff.data ?? {};
      result.mismatchPct = Number(d.mismatchPercentage);
      result.differentPixels = Number(d.differentPixels);
      result.totalPixels = Number(d.totalPixels);
      if (d.dimensionMismatch) result.dimensionMismatch = d.dimensionMismatch;
      result.files.diff = `${job.id}/diff.png`;
    }
    const styles = await ab(session, [
      "eval",
      stylesScript(job.capture, job.expect),
    ]);
    const value = styles.data?.result as Pick<JobResult, "styles" | "checks">;
    result.styles = value.styles;
    result.checks = value.checks;
    const snap = await ab(session, ["snapshot", "-c"]);
    writeFileSync(join(dir, "a11y.txt"), String(snap.data?.snapshot ?? ""));
    result.files.a11y = `${job.id}/a11y.txt`;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  } finally {
    await ab(session, ["close"]).catch(() => undefined);
    rmSync(init, { force: true });
    result.durationMs = Date.now() - started;
  }
  return result;
}

export async function runShard(
  shard: Shard,
  onDone?: (r: JobResult) => void,
): Promise<JobResult[]> {
  const queue = [...shard.jobs];
  const results: JobResult[] = [];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const r = await runJob(job, shard);
      results.push(r);
      onDone?.(r);
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, shard.concurrency) }, worker),
  );
  return results;
}

if (process.argv[1]?.endsWith("runner.ts")) {
  const file = process.argv[2];
  if (!file) throw new Error("usage: bun runner.ts <shard.json>");
  const shard = JSON.parse(readFileSync(file, "utf8")) as Shard;
  const results = await runShard(shard);
  writeFileSync(
    join(shard.outDir, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log(
    `${results.length} targets, ${results.filter((r) => r.error).length} errors`,
  );
}
