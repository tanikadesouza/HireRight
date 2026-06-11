#!/usr/bin/env node
// start-dev.mjs — reads PORT from .env.local, checks availability, starts Next.js dev server
import { execSync, spawn } from "child_process";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { createServer } from "net";
import { resolve } from "path";

function readPort() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return 3000;
  const content = readFileSync(envPath, "utf8");
  const match = content.match(/^PORT=(\d+)/m);
  return match ? parseInt(match[1], 10) : 3000;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function findFreePort(start) {
  for (let port = start; port < start + 10; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error("No free port found in range");
}

async function main() {
  const requestedPort = readPort();
  const port = await findFreePort(requestedPort);

  if (port !== requestedPort) {
    console.log(
      `Port ${requestedPort} in use — using ${port} instead`
    );
  }

  // Write chosen port for tooling
  const nextDir = resolve(process.cwd(), ".next");
  try {
    if (!existsSync(nextDir)) {
      import("fs").then(({ mkdirSync }) =>
        mkdirSync(nextDir, { recursive: true })
      );
    }
    writeFileSync(resolve(nextDir, "dev-port"), String(port), "utf8");
  } catch {
    // ignore
  }

  console.log(`Starting Next.js dev server on port ${port}...`);
  const child = spawn(
    "npx",
    ["next", "dev", "-p", String(port)],
    { stdio: "inherit" }
  );

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
