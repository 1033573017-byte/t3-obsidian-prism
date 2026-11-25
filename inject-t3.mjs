#!/usr/bin/env node
/**
 * T3 Code × Obsidian Prism Native CDP Injector & Daemon (inject-t3.mjs)
 *
 * Loads unmodified Obsidian Prism source modules:
 *   - D:\T3code\obsidian-prism\dual-mascot-rig.js
 *   - D:\T3code\obsidian-prism\prism-rim-canvas.js
 * plus D:\T3code\t3-obsidian-prism\t3-bridge.js into T3 Code via Electron's native CDP port.
 *
 * Zero external npm dependencies (uses Node.js 22+/24+ built-in fetch & WebSocket).
 * Does NOT modify app.asar or any T3 Code binary.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENDOR_DIR = process.env.OP_VENDOR_DIR || path.join(__dirname, 'vendor', 'obsidian-prism');
const SOURCE_FILES = [
  path.join(VENDOR_DIR, 'ripple-core.js'),
  path.join(VENDOR_DIR, 'home-ripple-host.js'),
  path.join(VENDOR_DIR, 'dual-mascot-rig.js'),
  path.join(VENDOR_DIR, 'prism-rim-canvas.js'),
  path.join(VENDOR_DIR, 'smooth-caret.js'),
  path.join(VENDOR_DIR, 'crystal-prism-core.js'),
  path.join(VENDOR_DIR, 'effort-slider-upstream.js'),
  path.join(__dirname, 't3-bridge.js'),
];

const PID_FILE = path.join(__dirname, '.daemon.pid');
const LOG_FILE = path.join(__dirname, 'daemon.log');
const STARTUP_VBS = path.join(
  process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'T3-Obsidian-Prism.vbs'
);
const CDP_FLAG = '--remote-debugging-port=0';

const USER_DATA_CANDIDATES = [
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 't3code-v2'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'T3 Code (Beta)'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 't3code'),
];

const SHORTCUT_CANDIDATES = [
  path.join(os.homedir(), 'Desktop', 'T3 Code (Token流速版).lnk'),
  path.join(os.homedir(), 'Desktop', 'T3 Code (Beta).lnk'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'T3 Code (Token流速版).lnk'),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'T3 Code (Beta).lnk'),
];

function logLine(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 262144) {
      fs.writeFileSync(LOG_FILE, '');
    }
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {}
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readDaemonPid() {
  try {
    if (!fs.existsSync(PID_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    return Number.isInteger(raw?.pid) ? raw.pid : null;
  } catch {
    return null;
  }
}

function stopDaemonIfRunning() {
  const pid = readDaemonPid();
  if (pid && pid !== process.pid && isPidAlive(pid)) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {}
    // Wait briefly
    const deadline = Date.now() + 1500;
    while (Date.now() < deadline && isPidAlive(pid)) {
      // busy wait brief
    }
    if (isPidAlive(pid)) {
      try { process.kill(pid, 'SIGKILL'); } catch {}
    }
  }
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
  return pid;
}

function buildPayloadBundle() {
  const chunks = [];
  const h = crypto.createHash('sha256');
  for (const file of SOURCE_FILES) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing required source file: ${file}`);
    }
    const content = fs.readFileSync(file, 'utf8');
    h.update(file).update('\n').update(content).update('\n');
    chunks.push({ name: path.basename(file), content });
  }
  const hash = h.digest('hex').slice(0, 12);
  return { hash, chunks };
}

function discoverCdpPort(explicitPort = null) {
  if (explicitPort) {
    return { port: Number(explicitPort), source: 'cli-arg' };
  }
  for (const dir of USER_DATA_CANDIDATES) {
    const portFile = path.join(dir, 'DevToolsActivePort');
    if (fs.existsSync(portFile)) {
      try {
        const lines = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
        const port = Number(lines[0]);
        if (Number.isInteger(port) && port > 0 && port < 65536) {
          return { port, wsPath: lines[1] || '', source: portFile };
        }
      } catch {}
    }
  }
  return null;
}

async function listT3Pages(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from /json/list`);
  const targets = await res.json();
  if (!Array.isArray(targets)) return [];
  return targets.filter((t) => {
    if (!t || t.type !== 'page' || !t.webSocketDebuggerUrl) return false;
    const url = String(t.url || '');
    if (url.startsWith('devtools://') || url.startsWith('chrome-extension://')) return false;
    // Match T3 Code app pages (t3code:// or localhost web ui served by T3 Code)
    const title = String(t.title || '');
    if (title.toLowerCase().includes('antigravity') && !url.startsWith('t3code://')) return false;
    return true;
  });
}

function cdpEval(wsUrl, expression, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 1;
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      reject(new Error(`CDP evaluate timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const finish = (err, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch {}
      if (err) reject(err);
      else resolve(val);
    };

    ws.addEventListener('open', () => {
      const id = seq++;
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
          awaitPromise: false,
        },
      }));
    });

    ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.id === 1) {
          if (msg.error) return finish(new Error(msg.error.message || JSON.stringify(msg.error)));
          if (msg.result?.exceptionDetails) {
            const ex = msg.result.exceptionDetails;
            return finish(new Error(ex.exception?.description || ex.text || 'CDP evaluation exception'));
          }
          return finish(null, msg.result?.result?.value);
        }
      } catch (e) {
        finish(e);
      }
    });

    ws.addEventListener('error', (ev) => {
      finish(new Error(ev?.message || 'WebSocket connection error'));
    });

    ws.addEventListener('close', () => {
      if (!settled) finish(new Error('WebSocket closed before response'));
    });
  });
}

async function injectIntoPage(target, bundle, { force = false } = {}) {
  const checkExpr = `(() => {
    const api = window.__t3ObsidianPrism;
    if (!api || typeof api.status !== 'function') return { present: false };
    return { present: true, hash: window.__t3OpBundleHash || '', status: api.status() };
  })()`;

  const current = await cdpEval(target.webSocketDebuggerUrl, checkExpr, 5000);
  if (!force && current?.present && current.hash === bundle.hash && current.status?.mounted) {
    return { skipped: true, title: target.title, url: target.url, status: current.status };
  }

  await cdpEval(
    target.webSocketDebuggerUrl,
    `window.__agCodexEffortSliderDisableAutoBoot = true; true;`,
    5000
  );
  for (const chunk of bundle.chunks) {
    await cdpEval(target.webSocketDebuggerUrl, `${chunk.content}\n;true;`, 20000);
  }
  const verify = await cdpEval(
    target.webSocketDebuggerUrl,
    `(() => { window.__t3OpBundleHash = ${JSON.stringify(bundle.hash)}; return window.__t3ObsidianPrism ? window.__t3ObsidianPrism.status() : null; })()`,
    5000
  );
  return { skipped: false, title: target.title, url: target.url, status: verify };
}

async function injectAll({ port = null, force = false } = {}) {
  const discovered = discoverCdpPort(port);
  if (!discovered) {
    return { ok: false, reason: 'no-cdp-port', pages: [] };
  }
  const bundle = buildPayloadBundle();
  let pages;
  try {
    pages = await listT3Pages(discovered.port);
  } catch (err) {
    return { ok: false, reason: 'cdp-unreachable', port: discovered.port, error: err.message, pages: [] };
  }
  const results = [];
  for (const p of pages) {
    try {
      const r = await injectIntoPage(p, bundle, { force });
      results.push({ ok: true, ...r });
    } catch (err) {
      results.push({ ok: false, title: p.title, url: p.url, error: err.message });
    }
  }
  return {
    ok: results.some((r) => r.ok),
    reason: results.length === 0 ? 'no-pages' : results.some((r) => r.ok) ? 'ok' : 'inject-failed',
    port: discovered.port,
    source: discovered.source,
    hash: bundle.hash,
    pages: results,
  };
}

function patchShortcuts(mode /* 'add' | 'remove' | 'inspect' */) {
  const existing = SHORTCUT_CANDIDATES.filter((p) => fs.existsSync(p));
  if (existing.length === 0) return { mode, matched: 0, items: [] };

  const psScript = `
$ErrorActionPreference = 'Stop'
$mode = '${mode}'
$flag = '${CDP_FLAG}'
$paths = @(
${existing.map((p) => `  '${p.replace(/'/g, "''")}'`).join(",\n")}
)
$ws = New-Object -ComObject WScript.Shell
$out = @()
foreach ($p in $paths) {
  $s = $ws.CreateShortcut($p)
  $target = [string]$s.TargetPath
  $args = [string]$s.Arguments
  $action = 'unchanged'
  if ($target -match 'T3 Code') {
    if ($mode -eq 'add') {
      if ($args -notmatch '--remote-debugging-port=') {
        $s.Arguments = ($args.Trim() + ' ' + $flag).Trim()
        $s.Save()
        $action = 'patched'
      } else {
        $action = 'already-set'
      }
    } elseif ($mode -eq 'remove') {
      if ($args -match '--remote-debugging-port=0') {
        $s.Arguments = (($args -replace '(^|\\s)--remote-debugging-port=0(?=\\s|$)', ' ').Trim() -replace '\\s{2,}', ' ')
        $s.Save()
        $action = 'restored'
      }
    } else {
      $action = if ($args -match '--remote-debugging-port=') { 'has-flag' } else { 'no-flag' }
    }
  } else {
    $action = 'skipped-non-t3'
  }
  $out += [PSCustomObject]@{ path = $p; target = $target; arguments = $s.Arguments; action = $action }
}
$out | ConvertTo-Json -Compress -Depth 3
`;
  const raw = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
    encoding: 'utf8',
    timeout: 15000,
  }).trim();
  const parsed = raw ? JSON.parse(raw) : [];
  const items = Array.isArray(parsed) ? parsed : [parsed];
  return { mode, matched: items.length, items };
}

function detectRunningT3Process() {
  const ps = `
$procs = Get-CimInstance Win32_Process -Filter "Name = 'T3 Code (Beta).exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -notmatch '--type=' -and $_.CommandLine -notmatch 'server\\.asar' }
if (-not $procs) { '[]'; exit 0 }
@($procs | ForEach-Object {
  [PSCustomObject]@{
    pid = $_.ProcessId
    commandLine = $_.CommandLine
    hasDebugPort = ($_.CommandLine -match '--remote-debugging-port=')
  }
}) | ConvertTo-Json -Compress
`;
  try {
    const raw = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
      encoding: 'utf8',
      timeout: 8000,
    }).trim();
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function ensureStartupAutostart(enable) {
  if (enable) {
    const nodeExe = process.execPath.replace(/"/g, '""');
    const scriptPath = __filename.replace(/"/g, '""');
    const vbs = [
      'Set sh = CreateObject("WScript.Shell")',
      `sh.Run """${nodeExe}"" ""${scriptPath}"" --daemon", 0, False`,
      '',
    ].join('\r\n');
    fs.mkdirSync(path.dirname(STARTUP_VBS), { recursive: true });
    fs.writeFileSync(STARTUP_VBS, vbs, 'utf8');
    return { installed: true, path: STARTUP_VBS };
  }
  if (fs.existsSync(STARTUP_VBS)) {
    fs.unlinkSync(STARTUP_VBS);
    return { installed: false, removed: true, path: STARTUP_VBS };
  }
  return { installed: false, removed: false, path: STARTUP_VBS };
}

function spawnDetachedDaemon() {
  stopDaemonIfRunning();
  const nodeExe = process.execPath;
  const cmdLine = `"${nodeExe}" "${__filename}" --daemon`;
  const ps = `
$ErrorActionPreference = 'Stop'
$startup = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = '${cmdLine.replace(/'/g, "''")}'
  CurrentDirectory = '${__dirname.replace(/'/g, "''")}'
  ProcessStartupInformation = (New-CimInstance -ClassName Win32_ProcessStartup -Property @{ ShowWindow = [uint16]0 } -ClientOnly)
}
[PSCustomObject]@{ returnValue = $startup.ReturnValue; pid = $startup.ProcessId } | ConvertTo-Json -Compress
`;
  const raw = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
    encoding: 'utf8',
    timeout: 10000,
  }).trim();
  const res = JSON.parse(raw);
  if (res.returnValue !== 0 || !res.pid) {
    throw new Error(`Failed to spawn detached daemon: ${raw}`);
  }
  return res.pid;
}

async function runDaemonLoop() {
  const existing = readDaemonPid();
  if (existing && existing !== process.pid && isPidAlive(existing)) {
    process.exit(0);
  }
  fs.writeFileSync(PID_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), 'utf8');
  logLine(`[boot] t3-obsidian-prism daemon started (pid=${process.pid})`);

  let lastState = '';
  const tick = async () => {
    try {
      const r = await injectAll({ force: false });
      if (r.ok) {
        const fresh = r.pages.filter((p) => p.ok && !p.skipped);
        if (fresh.length > 0) {
          for (const p of fresh) {
            logLine(`[injected] port=${r.port} title="${p.title}" actors=${p.status?.actorCount ?? '?'} minis=${p.status?.miniCount ?? '?'} rim=${p.status?.rimControllerReady}`);
          }
        }
        lastState = `ok:${r.port}:${r.pages.length}`;
      } else {
        const sig = `wait:${r.reason}:${r.port || ''}`;
        if (sig !== lastState) {
          logLine(`[wait] ${r.reason}${r.error ? ' (' + r.error + ')' : ''}`);
          lastState = sig;
        }
      }
    } catch (err) {
      const sig = `err:${err.message}`;
      if (sig !== lastState) {
        logLine(`[error] ${err.message}`);
        lastState = sig;
      }
    }
  };

  process.on('SIGTERM', () => {
    logLine('[stop] received SIGTERM');
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
    process.exit(0);
  });
  process.on('SIGINT', () => {
    logLine('[stop] received SIGINT');
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch {}
    process.exit(0);
  });

  await tick();
  setInterval(tick, 3000);
}

async function getStatus(explicitPort = null) {
  const daemonPid = readDaemonPid();
  const daemonAlive = Boolean(daemonPid && isPidAlive(daemonPid));
  const shortcuts = patchShortcuts('inspect');
  const t3Procs = detectRunningT3Process();
  const discovered = discoverCdpPort(explicitPort);
  let livePages = [];
  let cdpReachable = false;

  if (discovered) {
    try {
      const pages = await listT3Pages(discovered.port);
      cdpReachable = true;
      for (const p of pages) {
        try {
          const st = await cdpEval(
            p.webSocketDebuggerUrl,
            `window.__t3ObsidianPrism ? window.__t3ObsidianPrism.status() : { active: false }`,
            4000
          );
          livePages.push({ title: p.title, url: p.url, status: st });
        } catch (err) {
          livePages.push({ title: p.title, url: p.url, error: err.message });
        }
      }
    } catch {}
  }

  const bareT3Running = t3Procs.length > 0 && t3Procs.every((p) => !p.hasDebugPort);
  return {
    sourceFilesReady: SOURCE_FILES.every((f) => fs.existsSync(f)),
    sourceFiles: SOURCE_FILES,
    autostartInstalled: fs.existsSync(STARTUP_VBS),
    autostartPath: STARTUP_VBS,
    daemonPid,
    daemonAlive,
    shortcuts: shortcuts.items,
    runningT3: t3Procs,
    bareT3Running,
    cdpPort: discovered?.port || null,
    cdpSource: discovered?.source || null,
    cdpReachable,
    livePages,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  const explicitPort = portIdx >= 0 ? args[portIdx + 1] : null;
  const force = args.includes('--force');

  if (args.includes('--daemon')) {
    await runDaemonLoop();
    return;
  }

  if (args.includes('--status')) {
    const st = await getStatus(explicitPort);
    console.log(JSON.stringify(st, null, 2));
    return;
  }

  if (args.includes('--uninstall')) {
    const stoppedPid = stopDaemonIfRunning();
    const shortcuts = patchShortcuts('remove');
    const autostart = ensureStartupAutostart(false);
    console.log(JSON.stringify({ ok: true, stoppedPid, shortcuts: shortcuts.items, autostart }, null, 2));
    return;
  }

  if (args.includes('--install')) {
    // 1. Validate source files first
    const bundle = buildPayloadBundle();
    // 2. Patch T3 Code shortcuts with --remote-debugging-port=0
    const shortcuts = patchShortcuts('add');
    // 3. Register silent user-level Windows Startup entry
    const autostart = ensureStartupAutostart(true);
    // 4. Start detached background daemon
    const spawnedPid = spawnDetachedDaemon();
    // Wait briefly so daemon writes PID file
    await new Promise((r) => setTimeout(r, 800));
    const status = await getStatus(explicitPort);
    console.log(JSON.stringify({
      ok: true,
      bundleHash: bundle.hash,
      spawnedPid,
      autostart,
      shortcuts: shortcuts.items,
      status,
    }, null, 2));
    return;
  }

  // Default: single-shot --inject
  const res = await injectAll({ port: explicitPort, force });
  console.log(JSON.stringify(res, null, 2));
  if (!res.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[t3-obsidian-prism] fatal:', err?.stack || err?.message || err);
  process.exit(1);
});
