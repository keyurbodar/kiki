#!/usr/bin/env bun
/// <reference types="node" />
import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Instabox, InstaboxError, instaboxKey } from "./instabox";
import {
  classifyReference,
  isUnverifiable,
  NO_REFERENCE_PNG,
} from "./reference";
import type { Job, JobResult, Shard } from "./runner";
import { runShard } from "./runner";
import {
  expandTargets,
  parseRef,
  shard,
  type Target,
  type TargetsFile,
} from "./targets";

const CANVAS = "tnKVYw9CeC";
const HERE = dirname(fileURLToPath(import.meta.url));
const DRIVE = join(homedir(), ".capy/drive/captain-yuzu");
const HAS_DRIVE = existsSync(DRIVE);
const CACHE = join(homedir(), ".cache/kiki-verify");
const VM_PORT = 4173;
const SNAPSHOT_PREFIX = "kiki-verify-warm";

const USAGE = `kiki-verify: verify a kiki ref in real browsers (agent-browser) on parallel Instabox VMs

  bun tools/verify/kiki-verify.ts --ref <pr|sha|branch> --targets <file.json> [options]
  bun tools/verify/kiki-verify.ts snapshot      build the warm Instabox snapshot
  bun tools/verify/kiki-verify.ts cleanup       delete leftover kiki-verify VMs

Options:
  --targets <file>       targets JSON (repeatable)
  --local                skip Instabox, run agent-browser on this machine
  --per-vm <n>           targets per VM (default 4)
  --max-vms <n>          VMs at once (default 16)
  --vm-concurrency <n>   browser sessions per VM (default 2)
  --local-concurrency <n> browser sessions when local (default 3)
  --size <CxG>           VM size, vCPUs x GiB (default 2x4; falls back to the plan default)
  --max-mismatch <pct>   default pass threshold in percent (default 2)
  --threshold <0-1>      pixel color distance (default 0.05)
  --out <dir>            report dir (default <drive>/renders/verify/<ref>)
  --doop-manifest <file> frame manifest of canvas ${CANVAS}
  --status               post a GitHub commit status "verify" on the sha
  --repo <owner/name>    default keyurbodar/kiki
`;

const log = (msg: string) => process.stderr.write(`[kiki-verify] ${msg}\n`);
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    ref: { type: "string" },
    targets: { type: "string", multiple: true },
    local: { type: "boolean", default: false },
    "per-vm": { type: "string", default: "4" },
    "max-vms": { type: "string", default: "16" },
    "vm-concurrency": { type: "string", default: "2" },
    "local-concurrency": { type: "string", default: "3" },
    size: { type: "string", default: "2x4" },
    "max-mismatch": { type: "string", default: "2" },
    threshold: { type: "string", default: "0.05" },
    out: { type: "string" },
    "doop-manifest": { type: "string" },
    status: { type: "boolean", default: false },
    repo: { type: "string", default: "keyurbodar/kiki" },
    help: { type: "boolean", short: "h", default: false },
  },
});

const repo = opt.repo as string;
const repoUrl = `https://github.com/${repo}`;

function sh(cmd: string, args: string[], cwd?: string): string {
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function resolveRef(ref: string) {
  const spec = parseRef(ref);
  if (spec.kind === "sha") {
    if (spec.sha.length === 40)
      return { ...spec, sha: spec.sha, fetchRef: spec.sha };
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits/${spec.sha}`,
    );
    if (!res.ok)
      throw new Error(`cannot resolve sha ${spec.sha}: ${res.status}`);
    const sha = ((await res.json()) as { sha: string }).sha;
    return { ...spec, sha, fetchRef: sha };
  }
  const line =
    sh("git", ["ls-remote", repoUrl, spec.fetchRef]).split("\n")[0] ?? "";
  const sha = line.split("\t")[0];
  if (!sha) throw new Error(`${spec.fetchRef} not found on ${repo}`);
  return { ...spec, sha };
}

type Frame = { id: string; width: number; height: number; updatedAt?: string };

function loadManifest(): Map<string, Frame> {
  const file =
    (opt["doop-manifest"] as string | undefined) ??
    [
      join(DRIVE, "renders/verify/_doop", `canvas-${CANVAS}.json`),
      join(CACHE, "doop", `canvas-${CANVAS}.json`),
    ].find(existsSync);
  if (!file || !existsSync(file))
    throw new Error(
      `no frame manifest for canvas ${CANVAS}; refresh it (tools/verify/README.md, "Doop frames") or pass --doop-manifest`,
    );
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    canvas: string;
    frames: Frame[];
  };
  if (data.canvas !== CANVAS)
    throw new Error(`${file} is not the manifest of canvas ${CANVAS}`);
  return new Map(data.frames.map((f) => [f.id, f]));
}

const doopDir = HAS_DRIVE
  ? join(DRIVE, "renders/verify/_doop")
  : join(CACHE, "doop");

async function fetchFrames(targets: Target[]): Promise<Map<string, string>> {
  const wanted = targets.filter((t) => t.frame);
  const paths = new Map<string, string>();
  if (!wanted.length) return paths;
  const manifest = loadManifest();
  mkdirSync(doopDir, { recursive: true });
  for (const t of wanted) {
    const frame = manifest.get(t.frame as string);
    if (!frame)
      throw new Error(
        `target ${t.id}: frame ${t.frame} is not on canvas ${CANVAS} (or the manifest is stale)`,
      );
    t.viewport ??= { width: frame.width, height: frame.height };
    const scale = t.viewport.scale ?? 1;
    const stamp = (frame.updatedAt ?? "").replace(/[^0-9]/g, "").slice(0, 14);
    paths.set(
      `${frame.id}@${scale}`,
      join(doopDir, `${frame.id}@${scale}x${stamp ? `-${stamp}` : ""}.png`),
    );
  }
  await Promise.all(
    [...paths].map(async ([key, file]) => {
      if (existsSync(file)) return;
      const [id, scale] = key.split("@");
      const res = await fetch(`https://doop.design/i/${id}.png?scale=${scale}`);
      const ref = classifyReference(
        res.status,
        new Uint8Array(await res.arrayBuffer()),
      );
      if (ref.status === "error")
        throw new Error(`doop frame ${id}: ${ref.message}`);
      if (ref.status === "unverified") {
        log(`doop frame ${id}: ${ref.reason}, pixel diff skipped`);
        return;
      }
      writeFileSync(file, ref.bytes);
    }),
  );
  return paths;
}

function toJob(t: Target, baseline?: string): Job {
  return {
    id: t.id,
    url: t.route,
    theme: t.theme,
    scheme: t.scheme,
    viewport: t.viewport ?? { width: 1440, height: 900 },
    steps: t.steps,
    fullPage: t.fullPage,
    baseline,
    threshold: t.threshold,
    expect: t.expect,
    capture: t.capture,
  };
}

const prepScript = (fetchRef: string, mode: string) => `set -euo pipefail
export PATH="$HOME/.bun/bin:/opt/npm/bin:$PATH"
command -v bun >/dev/null || (curl -fsSL https://bun.sh/install | bash >/dev/null 2>&1)
command -v agent-browser >/dev/null || npm install -g agent-browser >/dev/null 2>&1
ls "$HOME/.agent-browser/browsers" 2>/dev/null | grep -q . || agent-browser install --with-deps >/dev/null 2>&1
mkdir -p /data/kv/doop /data/kv/out && cd /data/kv
[ -d kiki/.git ] || git clone -q --filter=blob:none ${repoUrl} kiki
cd kiki
git fetch -q --depth=1 origin ${fetchRef}
git checkout -q --force FETCH_HEAD
bun install --frozen-lockfile >/dev/null 2>&1 || bun install >/dev/null
NODE_ENV=${mode} bunx vite build --mode ${mode} --logLevel error
(setsid nohup bunx vite preview --host 127.0.0.1 --port ${VM_PORT} --strictPort >/data/kv/preview.log 2>&1 &)
for i in $(seq 1 150); do curl -sf -o /dev/null http://127.0.0.1:${VM_PORT}/ && exit 0; sleep 0.2; done
cat /data/kv/preview.log; exit 1
`;

type VmStat = {
  name: string;
  id?: string;
  targets: number;
  bootMs?: number;
  prepMs?: number;
  runMs?: number;
  error?: string;
};

const live = new Set<string>();
let ib: Instabox | undefined;
let sizeSpec: { vcpus?: number; memMiB?: number } = {};

async function warmSnapshot(): Promise<string | undefined> {
  if (!ib) return undefined;
  const snaps = (await ib.snapshots()).filter(
    (s) => s.name.startsWith(SNAPSHOT_PREFIX) && s.status === "ready",
  );
  return snaps.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id;
}

async function createVm(name: string, snapshotId?: string): Promise<string> {
  if (!ib) throw new Error("no instabox");
  const base = {
    name,
    ...(snapshotId ? { snapshotId } : { templateId: "agent-browser" }),
    deleteAfterSeconds: 3600,
  };
  try {
    return await ib.create({ ...base, ...sizeSpec });
  } catch (e) {
    if (
      e instanceof InstaboxError &&
      e.code === "spec_not_allowed" &&
      sizeSpec.vcpus
    ) {
      log(
        `size ${sizeSpec.vcpus}/${sizeSpec.memMiB} not allowed on this plan, using the plan default`,
      );
      sizeSpec = {};
      return ib.create(base);
    }
    throw e;
  }
}

async function runOnVm(
  stat: VmStat,
  targets: Target[],
  frames: Map<string, string>,
  ref: { fetchRef: string },
  mode: string,
  snapshotId: string | undefined,
  targetsDir: string,
): Promise<JobResult[]> {
  const box = ib as Instabox;
  let id: string | undefined;
  try {
    const t0 = Date.now();
    id = await createVm(stat.name, snapshotId);
    live.add(id);
    stat.id = id;
    stat.bootMs = Date.now() - t0;
    const t1 = Date.now();
    const prep = await box.exec(id, prepScript(ref.fetchRef, mode), 600);
    if (prep.exitCode !== 0)
      throw new Error(
        `prep exit ${prep.exitCode}: ${(prep.stderr || prep.stdout).slice(-800)}`,
      );
    stat.prepMs = Date.now() - t1;
    const t2 = Date.now();
    const jobs = targets.map((t) => {
      const local = isUnverifiable(t, frames)
        ? undefined
        : frames.get(`${t.frame}@${t.viewport?.scale ?? 1}`);
      return toJob(
        t,
        local ? `/data/kv/doop/${local.split("/").pop()}` : undefined,
      );
    });
    const uploads = new Map<string, Uint8Array>([
      ["/data/kv/runner.ts", readFileSync(join(HERE, "runner.ts"))],
    ]);
    for (const t of targets) {
      const local = isUnverifiable(t, frames)
        ? undefined
        : frames.get(`${t.frame}@${t.viewport?.scale ?? 1}`);
      if (local)
        uploads.set(
          `/data/kv/doop/${local.split("/").pop()}`,
          readFileSync(local),
        );
    }
    const shardFile: Shard = {
      baseUrl: `http://127.0.0.1:${VM_PORT}`,
      outDir: "/data/kv/out",
      concurrency: Number(opt["vm-concurrency"]),
      jobs,
    };
    uploads.set(
      "/data/kv/shard.json",
      new TextEncoder().encode(JSON.stringify(shardFile)),
    );
    await Promise.all(
      [...uploads].map(([p, b]) => box.put(id as string, p, b)),
    );
    const run = await box.exec(
      id,
      'export PATH="$HOME/.bun/bin:/opt/npm/bin:$PATH"; cd /data/kv && bun runner.ts shard.json && mv out/results.json results.json && tar czf out.tgz -C out .',
      600,
    );
    if (run.exitCode !== 0)
      throw new Error(
        `runner exit ${run.exitCode}: ${(run.stderr || run.stdout).slice(-800)}`,
      );
    const tgz = await box.get(id, "/data/kv/out.tgz");
    const tmp = join(targetsDir, `.${stat.name}.tgz`);
    writeFileSync(tmp, tgz);
    sh("tar", ["xzf", tmp, "-C", targetsDir]);
    rmSync(tmp);
    const results = JSON.parse(
      new TextDecoder().decode(await box.get(id, "/data/kv/results.json")),
    ) as JobResult[];
    stat.runMs = Date.now() - t2;
    return results;
  } finally {
    if (id) {
      await box.delete(id).catch((e) => log(`delete ${id} failed: ${e}`));
      live.delete(id);
    }
  }
}

let localServer: Promise<{ baseUrl: string; proc: ChildProcess }> | undefined;

function startLocal(ref: { sha: string; fetchRef: string }, mode: string) {
  localServer ??= (async () => {
    const repoDir = join(CACHE, "repo");
    if (!existsSync(join(repoDir, ".git")))
      sh("git", [
        "clone",
        "-q",
        "--filter=blob:none",
        "--no-checkout",
        repoUrl,
        repoDir,
      ]);
    sh("git", ["-C", repoDir, "fetch", "-q", "origin", ref.fetchRef]);
    const wt = join(CACHE, "wt", ref.sha);
    if (!existsSync(join(wt, "package.json"))) {
      rmSync(wt, { recursive: true, force: true });
      sh("git", ["-C", repoDir, "worktree", "prune"]);
      sh("git", [
        "-C",
        repoDir,
        "worktree",
        "add",
        "-f",
        "--detach",
        wt,
        ref.sha,
      ]);
    }
    sh("bun", ["install", "--frozen-lockfile"], wt);
    execFileSync(
      "bunx",
      ["vite", "build", "--mode", mode, "--logLevel", "error"],
      {
        cwd: wt,
        env: { ...process.env, NODE_ENV: mode },
        stdio: ["ignore", "ignore", "inherit"],
      },
    );
    const port = 4600 + Math.floor(Math.random() * 300);
    const proc = spawn(
      "bunx",
      [
        "vite",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      {
        cwd: wt,
        stdio: "ignore",
      },
    );
    const baseUrl = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 150; i++) {
      if (
        await fetch(baseUrl)
          .then((r) => r.ok)
          .catch(() => false)
      )
        return { baseUrl, proc };
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error("local vite preview did not start");
  })();
  return localServer;
}

async function runLocal(
  targets: Target[],
  frames: Map<string, string>,
  ref: { sha: string; fetchRef: string },
  mode: string,
  targetsDir: string,
): Promise<JobResult[]> {
  const { baseUrl } = await startLocal(ref, mode);
  return runShard({
    baseUrl,
    outDir: targetsDir,
    concurrency: Number(opt["local-concurrency"]),
    jobs: targets.map((t) =>
      toJob(
        t,
        isUnverifiable(t, frames)
          ? undefined
          : frames.get(`${t.frame}@${t.viewport?.scale ?? 1}`),
      ),
    ),
  });
}

type Row = Target &
  JobResult & {
    pass: boolean;
    host: string;
    status?: "pass" | "fail" | "error" | "unverified";
    reason?: string;
  };

function writeReports(
  outDir: string,
  meta: Record<string, unknown>,
  rows: Row[],
  frames: Map<string, string>,
) {
  writeFileSync(
    join(outDir, "report.json"),
    JSON.stringify({ ...meta, targets: rows }, null, 2),
  );
  const pct = (n?: number) =>
    n === undefined || Number.isNaN(n) ? "–" : `${n.toFixed(2)}%`;
  const passed = rows.filter((r) => r.status === "pass").length;
  const unverified = rows.filter((r) => r.status === "unverified").length;
  const lines = [
    `# kiki-verify ${meta.ref} (${String(meta.sha).slice(0, 12)})`,
    "",
    `**${passed}/${rows.length} passed**${unverified ? `, ${unverified} unverified (${NO_REFERENCE_PNG})` : ""} in ${secs(Number(meta.durationMs))} on ${meta.hosts}. Pixel compare against Doop canvas ${CANVAS}; pass means mismatch ≤ the target's threshold and every expected style matches. Unverified means Doop had no reference PNG for the frame, so only the style checks ran.`,
    "",
    "| target | route | theme | viewport | mismatch | styles | result | host |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map((r) => {
      const styles = r.checks.length
        ? `${r.checks.filter((c) => c.pass).length}/${r.checks.length}`
        : "–";
      const vp = r.viewport
        ? `${r.viewport.width}×${r.viewport.height}${r.viewport.scale ? `@${r.viewport.scale}` : ""}`
        : "";
      const res =
        r.status === "unverified"
          ? `unverified (${r.reason})`
          : (r.status ?? "");
      const mismatch =
        r.status === "unverified"
          ? NO_REFERENCE_PNG
          : r.frame
            ? `${pct(r.mismatchPct)} (≤${r.maxMismatch}%)`
            : "no frame";
      return `| [${r.id}](targets/${r.id}/shot.png) | \`${r.route}\` | ${r.theme}/${r.scheme} | ${vp} | ${mismatch} | ${styles} | ${res} | ${r.host} |`;
    }),
    "",
  ];
  for (const r of rows.filter((x) => x.status !== "pass")) {
    lines.push(`## ${r.id}`, "");
    if (r.status === "unverified")
      lines.push(
        `Unverified: ${r.reason} for Doop frame \`${r.frame}\`; the pixel diff was skipped and this target counts as neither pass nor fail. Style checks ${r.checks.filter((c) => c.pass).length}/${r.checks.length} passed${r.files.a11y ? `, a11y snapshot at [targets/${r.files.a11y}](targets/${r.files.a11y})` : ""}.`,
        "",
      );
    if (r.error)
      lines.push(
        `Error: \`${r.error.replace(/\s+/g, " ").slice(0, 400)}\``,
        "",
      );
    if (r.frame && r.files.diff) {
      const doop = frames.get(`${r.frame}@${r.viewport?.scale ?? 1}`);
      lines.push(
        `Frame \`${r.frame}\`: mismatch ${pct(r.mismatchPct)}${r.dimensionMismatch ? `, size mismatch ${JSON.stringify(r.dimensionMismatch)}` : ""}.`,
        "",
        `| build | doop | diff |`,
        "| --- | --- | --- |",
        `| ![](targets/${r.files.shot}) | ${doop ? `![](${relative(outDir, doop)})` : ""} | ![](targets/${r.files.diff}) |`,
        "",
      );
    }
    const bad = r.checks.filter((c) => !c.pass);
    if (bad.length) {
      lines.push(
        "| selector | property | expected | actual |",
        "| --- | --- | --- | --- |",
      );
      for (const c of bad)
        lines.push(
          `| \`${c.selector}\` | ${c.property} | \`${c.expected}\` (${c.expectedComputed}) | \`${c.actual ?? "missing"}\` |`,
        );
      lines.push("");
    }
  }
  writeFileSync(join(outDir, "report.md"), lines.join("\n"));
}

async function verify() {
  if (!opt.ref || !opt.targets?.length) {
    process.stderr.write(USAGE);
    process.exit(2);
  }
  const started = Date.now();
  const ref = await resolveRef(opt.ref as string);
  const base = {
    maxMismatch: Number(opt["max-mismatch"]),
    threshold: Number(opt.threshold),
  };
  const targets = (opt.targets as string[]).flatMap((f) =>
    expandTargets(JSON.parse(readFileSync(f, "utf8")) as TargetsFile, base),
  );
  const frames = await fetchFrames(targets);
  const mode = targets.some((t) => t.route.startsWith("/__"))
    ? "development"
    : "production";
  const outDir =
    (opt.out as string | undefined) ??
    join(
      HAS_DRIVE ? join(DRIVE, "renders/verify") : join(CACHE, "out"),
      ref.label,
    );
  const targetsDir = join(outDir, "targets");
  rmSync(targetsDir, { recursive: true, force: true });
  mkdirSync(targetsDir, { recursive: true });
  log(
    `${ref.label} = ${ref.sha.slice(0, 12)}, ${targets.length} targets, ${frames.size} Doop frames, ${mode} build`,
  );

  const key = opt.local ? undefined : instaboxKey();
  if (!opt.local && !key)
    log(
      "no Instabox key (INSTABOX_API_KEY or ~/.config/instabox/key): running locally",
    );
  if (key) ib = new Instabox(key);
  const m = /^(\d+)x(\d+)$/.exec(opt.size as string);
  if (m) sizeSpec = { vcpus: Number(m[1]), memMiB: Number(m[2]) * 1024 };

  const results: (JobResult & { host: string })[] = [];
  const vms: VmStat[] = [];
  const localTargets: Target[] = [];
  if (ib) {
    const snapshotId = await warmSnapshot().catch((e) => {
      log(`listing snapshots failed: ${e}`);
      return undefined;
    });
    if (!snapshotId)
      log(
        `no ready ${SNAPSHOT_PREFIX}* snapshot, booting from the agent-browser template (run "snapshot" to speed this up)`,
      );
    const run = randomBytes(3).toString("hex");
    const shards = shard(
      targets,
      Number(opt["per-vm"]),
      Number(opt["max-vms"]),
    );
    await Promise.all(
      shards.map(async (part, i) => {
        const stat: VmStat = {
          name: `kiki-verify-${run}-${i}`,
          targets: part.length,
        };
        vms.push(stat);
        try {
          const res = await runOnVm(
            stat,
            part,
            frames,
            ref,
            mode,
            snapshotId,
            targetsDir,
          );
          results.push(...res.map((r) => ({ ...r, host: `vm${i}` })));
          log(
            `vm${i}: ${part.length} targets, boot ${secs(stat.bootMs ?? 0)}, build ${secs(stat.prepMs ?? 0)}, run ${secs(stat.runMs ?? 0)}`,
          );
        } catch (e) {
          stat.error = e instanceof Error ? e.message : String(e);
          log(
            `vm${i} failed (${stat.error.slice(0, 300)}); running its ${part.length} targets locally`,
          );
          localTargets.push(...part);
        }
      }),
    );
  } else {
    localTargets.push(...targets);
  }
  if (localTargets.length) {
    const res = await runLocal(localTargets, frames, ref, mode, targetsDir);
    results.push(...res.map((r) => ({ ...r, host: "local" })));
  }
  const server = localServer
    ? await localServer.catch(() => undefined)
    : undefined;
  server?.proc.kill();

  const byId = new Map(results.map((r) => [r.id, r]));
  const rows: Row[] = targets.map((t) => {
    const r = byId.get(t.id) ?? {
      id: t.id,
      error: "no result",
      styles: {},
      checks: [],
      files: {},
      durationMs: 0,
      host: "?",
    };
    const unverified = isUnverifiable(t, frames);
    const pixelsOk =
      unverified ||
      !t.frame ||
      (r.mismatchPct !== undefined &&
        !r.dimensionMismatch &&
        r.mismatchPct <= t.maxMismatch);
    const checksOk = r.checks.every((c) => c.pass);
    const status: Row["status"] = r.error
      ? "error"
      : unverified
        ? checksOk
          ? "unverified"
          : "fail"
        : pixelsOk && checksOk
          ? "pass"
          : "fail";
    return {
      ...t,
      ...r,
      pass: status === "pass",
      status,
      reason: unverified ? NO_REFERENCE_PNG : undefined,
    };
  });
  const hosts = [
    vms.filter((v) => !v.error).length
      ? `${vms.filter((v) => !v.error).length} Instabox VMs`
      : "",
    localTargets.length
      ? `local agent-browser (${localTargets.length} targets)`
      : "",
  ]
    .filter(Boolean)
    .join(" + ");
  const meta = {
    ref: ref.label,
    sha: ref.sha,
    repo,
    canvas: CANVAS,
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    hosts,
    vms,
    summary: {
      total: rows.length,
      passed: rows.filter((r) => r.status === "pass").length,
      failed: rows.filter((r) => r.status === "fail").length,
      errored: rows.filter((r) => r.status === "error").length,
      unverified: rows.filter((r) => r.status === "unverified").length,
    },
  };
  writeReports(outDir, meta, rows, frames);
  const { passed, failed, errored, unverified } = meta.summary;
  log(
    `${passed}/${rows.length} passed, ${unverified} unverified${unverified ? ` (${NO_REFERENCE_PNG})` : ""}, ${failed} failed, ${errored} errored in ${secs(meta.durationMs)} (${hosts}); report: ${join(outDir, "report.md")}`,
  );
  const clean = failed === 0 && errored === 0;
  if (opt.status) {
    const state = clean ? "success" : "failure";
    sh("gh", [
      "api",
      "-X",
      "POST",
      `repos/${repo}/statuses/${ref.sha}`,
      "-f",
      `state=${state}`,
      "-f",
      "context=verify",
      "-f",
      `description=${passed}/${rows.length} passed${unverified ? `, ${unverified} unverified (no reference PNG)` : ""} (kiki-verify)`,
    ]);
    log(`posted commit status verify=${state}`);
  }
  process.exitCode = clean ? 0 : 1;
}

async function buildSnapshot() {
  const key = instaboxKey();
  if (!key)
    throw new Error(
      "no Instabox key (INSTABOX_API_KEY or ~/.config/instabox/key)",
    );
  ib = new Instabox(key);
  const m = /^(\d+)x(\d+)$/.exec(opt.size as string);
  if (m) sizeSpec = { vcpus: Number(m[1]), memMiB: Number(m[2]) * 1024 };
  const name = `${SNAPSHOT_PREFIX}-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 12)}`;
  const id = await createVm(
    `kiki-verify-snap-${randomBytes(3).toString("hex")}`,
  );
  live.add(id);
  try {
    log(`warming ${id}`);
    const prep = await ib.exec(
      id,
      prepScript("refs/heads/main", "production"),
      600,
    );
    if (prep.exitCode !== 0)
      throw new Error(
        `warm-up failed: ${(prep.stderr || prep.stdout).slice(-800)}`,
      );
    await ib.exec(
      id,
      "pkill -f 'vite preview' || true; rm -rf /data/kv/out /data/kv/kiki/dist",
      60,
    );
    const snap = await ib.snapshot(
      id,
      name,
      "kiki-verify: bun, agent-browser + Chrome, kiki main deps",
    );
    log(`snapshot ${name} = ${snap}`);
    const old = (await ib.snapshots())
      .filter((s) => s.name.startsWith(SNAPSHOT_PREFIX) && s.id !== snap)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(1);
    for (const s of old)
      await ib
        .deleteSnapshot(s.id)
        .catch((e) => log(`delete snapshot ${s.id}: ${e}`));
  } finally {
    await ib.delete(id);
    live.delete(id);
  }
}

async function cleanup() {
  const key = instaboxKey();
  if (!key) throw new Error("no Instabox key");
  ib = new Instabox(key);
  const stale = (await ib.machines()).filter((m) =>
    m.name?.startsWith("kiki-verify-"),
  );
  for (const m of stale) {
    await ib.delete(m.id);
    log(`deleted ${m.name} (${m.id})`);
  }
  log(`${stale.length} leftover VMs deleted`);
}

for (const sig of ["SIGINT", "SIGTERM"] as const)
  process.on(sig, async () => {
    log(`${sig}: deleting ${live.size} VMs`);
    await Promise.all(
      [...live].map((id) => ib?.delete(id).catch(() => undefined)),
    );
    process.exit(130);
  });

const command = positionals[0] ?? "run";
if (opt.help) process.stderr.write(USAGE);
else if (command === "snapshot") await buildSnapshot();
else if (command === "cleanup") await cleanup();
else if (command === "run") await verify();
else {
  process.stderr.write(USAGE);
  process.exitCode = 2;
}
