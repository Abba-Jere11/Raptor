import { readFileSync, writeFileSync } from "fs";
import { execFile } from "child_process";
import { createConnection } from "net";

const out = [];
const log = (line) => out.push(line);

function redact(s, keep = 12) {
  if (!s || s.length <= keep * 2) return s ? `${s.slice(0, 4)}…` : "(missing)";
  return `${s.slice(0, keep)}…${s.slice(-8)}`;
}

function parseEnvLocal() {
  const raw = readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function portPid(port) {
  return new Promise((resolve) => {
    const s = createConnection({ host: "127.0.0.1", port }, () => {
      s.end();
      resolve({ port, open: true });
    });
    s.on("error", () => resolve({ port, open: false }));
    s.setTimeout(800, () => {
      s.destroy();
      resolve({ port, open: false });
    });
  });
}

function runSupabaseStatus() {
  return new Promise((resolve) => {
    const child = execFile(
      "npx",
      ["supabase", "status", "-o", "env"],
      { cwd: process.cwd(), timeout: 90000, shell: true },
      (err, stdout, stderr) => {
        resolve({ err, stdout: stdout || "", stderr: stderr || "" });
      }
    );
    child.on("error", () => resolve({ err: new Error("spawn failed"), stdout: "", stderr: "" }));
  });
}

function killPids(pids) {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve([]);
    const args = pids.flatMap((p) => ["/PID", String(p), "/F"]);
    execFile("taskkill", args, { timeout: 15000 }, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

function netstatPorts() {
  return new Promise((resolve) => {
    execFile("netstat", ["-ano"], { timeout: 15000, maxBuffer: 5_000_000 }, (err, stdout) => {
      const lines = (stdout || "").split("\n");
      const hits = [];
      for (const port of [3000, 3001]) {
        const re = new RegExp(`:${port}\\s`);
        for (const line of lines) {
          if (re.test(line) && line.includes("LISTENING")) hits.push(line.trim());
        }
      }
      resolve({ err, hits });
    });
  });
}

async function authPassword(anon, url) {
  const endpoint = `${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anon,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "ceo@raptors.test",
        password: "Test-CEO-2026!",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 200) };
    }
    return { status: res.status, body: parsed };
  } catch (e) {
    return { error: String(e.message || e) };
  }
}

async function main() {
  log("=== KILL HUNG PIDS ===");
  const kill = await killPids([11192, 30348, 32604, 23636]);
  log(kill.stdout.trim() || kill.stderr.trim() || (kill.err ? String(kill.err.message) : "taskkill attempted"));

  log("\n=== SUPABASE STATUS -o env ===");
  const st = await runSupabaseStatus();
  const envFromCli = {};
  if (st.stdout) {
    for (const line of st.stdout.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) envFromCli[m[1]] = m[2].trim().replace(/^"|"$/g, "");
    }
    log(st.stdout.slice(0, 4000));
  } else {
    log(`status failed: ${st.err?.message || st.stderr || "no output"}`);
  }

  const local = parseEnvLocal();
  const cliUrl =
    envFromCli.API_URL ||
    envFromCli.SUPABASE_URL ||
    envFromCli.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const cliAnon =
    envFromCli.ANON_KEY ||
    envFromCli.SUPABASE_ANON_KEY ||
    envFromCli.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    envFromCli.SUPABASE_PUBLISHABLE_KEY ||
    "";
  const cliService =
    envFromCli.SERVICE_ROLE_KEY ||
    envFromCli.SUPABASE_SERVICE_ROLE_KEY ||
    envFromCli.SUPABASE_SECRET_KEY ||
    "";

  log("\n=== REDACTED KEYS ===");
  log(`NEXT_PUBLIC_SUPABASE_URL local=${local.NEXT_PUBLIC_SUPABASE_URL} cli=${cliUrl || "(n/a)"}`);
  log(`ANON local=${redact(local.NEXT_PUBLIC_SUPABASE_ANON_KEY)} cli=${redact(cliAnon)}`);
  log(`SERVICE local=${redact(local.SUPABASE_SERVICE_ROLE_KEY)} cli=${redact(cliService)}`);

  const anonMatch =
    cliAnon && local.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? cliAnon === local.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "MATCH"
        : "MISMATCH"
      : cliAnon
        ? "MISMATCH (cli has key, compare skipped partial)"
        : "UNKNOWN (cli anon missing)";
  const svcMatch =
    cliService && local.SUPABASE_SERVICE_ROLE_KEY
      ? cliService === local.SUPABASE_SERVICE_ROLE_KEY
        ? "MATCH"
        : "MISMATCH"
      : cliService
        ? "MISMATCH (cli has key)"
        : "UNKNOWN (cli service missing)";

  log(`\n=== KEY MATCH ===\nANON: ${anonMatch}\nSERVICE: ${svcMatch}`);

  log("\n=== AUTH PASSWORD ===");
  const auth = await authPassword(local.NEXT_PUBLIC_SUPABASE_ANON_KEY, local.NEXT_PUBLIC_SUPABASE_URL);
  log(JSON.stringify(auth, null, 2));

  log("\n=== PORTS ===");
  const ns = await netstatPorts();
  log(ns.hits.join("\n") || "no LISTEN on 3000/3001 in netstat");
  const p3000 = await portPid(3000);
  const p3001 = await portPid(3001);
  log(`tcp probe: 3000 open=${p3000.open} 3001 open=${p3001.open}`);

  writeFileSync(".diag-report.txt", out.join("\n"), "utf8");
  console.log(out.join("\n"));
}

main().catch((e) => {
  writeFileSync(".diag-report.txt", String(e), "utf8");
  process.exit(1);
});
