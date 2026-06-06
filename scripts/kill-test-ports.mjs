// Frees E2E test ports (3002 store, 3003 admin) on Windows/macOS/Linux.

import { execSync } from "node:child_process";

const PORTS = [3002, 3003];

for (const port of PORTS) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr ":${port}"`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set(
        out
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && /^\d+$/.test(pid))
      );
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Stopped PID ${pid} (port ${port})`);
      }
      if (pids.size === 0) {
        console.log(`Port ${port} is free`);
      }
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, {
        stdio: "inherit",
        shell: true,
      });
      console.log(`Cleared port ${port}`);
    }
  } catch {
    console.log(`Port ${port} is free`);
  }
}
