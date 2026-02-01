#!/usr/bin/env bun

import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";

const VPS_HOST = "100.90.194.23";
const VPS_USER = "ubuntu";

// SSH ControlMaster for persistent connections
const CONTROL_DIR = join(homedir(), ".ssh", "sockets");
const CONTROL_PATH = join(CONTROL_DIR, "oc-%r@%h:%p");

// Ensure socket directory exists
if (!existsSync(CONTROL_DIR)) {
  mkdirSync(CONTROL_DIR, { recursive: true });
}

// Read the shell script from the separate file
const scriptPath = join(dirname(import.meta.path), "remote.sh");
const REMOTE_SCRIPT = readFileSync(scriptPath, "utf-8");

async function main() {
  const encoded = Buffer.from(REMOTE_SCRIPT).toString("base64");
  const command = `echo '${encoded}' | base64 -d > /tmp/oc-remote.sh && zsh /tmp/oc-remote.sh`;

  const proc = Bun.spawn(
    [
      "ssh",
      "-tt",
      "-o", "ControlMaster=auto",
      "-o", `ControlPath=${CONTROL_PATH}`,
      "-o", "ControlPersist=300",
      `${VPS_USER}@${VPS_HOST}`,
      command,
    ],
    {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }
  );

  process.exitCode = await proc.exited;
}

main();
