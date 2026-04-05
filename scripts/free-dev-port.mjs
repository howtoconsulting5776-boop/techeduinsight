/**
 * Stops a stale `next dev` instance so a new one can start.
 * Next 16 writes `.next/dev/lock` with { pid, port }; we kill that PID and remove the lock.
 * Also tries to free port 3000 (fallback).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");

function killPid(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
    } else {
      execFileSync("kill", ["-9", String(pid)], { stdio: "ignore" });
    }
  } catch {
    /* process already gone */
  }
}

if (fs.existsSync(lockPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    killPid(data.pid);
  } catch {
    /* invalid JSON */
  }
  try {
    fs.unlinkSync(lockPath);
  } catch {
    /* ignore */
  }
}

function freeWindowsPort3000() {
  const ps = `
    $conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
      $conns | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
  `.replace(/\n/g, " ");
  try {
    execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], {
      stdio: "ignore",
    });
  } catch {
    /* ignore */
  }
}

function freeUnixPort3000() {
  try {
    execFileSync("sh", ["-c", "lsof -ti:3000 | xargs kill -9 2>/dev/null || true"], {
      stdio: "ignore",
    });
  } catch {
    /* ignore */
  }
}

if (process.platform === "win32") {
  freeWindowsPort3000();
} else {
  freeUnixPort3000();
}
