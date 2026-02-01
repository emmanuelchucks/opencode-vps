#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const VPS = process.env.OC_VPS || "ubuntu@localhost";
const PROJECTS_DIR = process.env.OC_PROJECTS_DIR || "/home/ubuntu/projects";
const SERVER_URL = process.env.OC_SERVER_URL || "http://localhost:4096";
const CACHE_FILE = join(homedir(), ".cache", "oc-cli", "projects.txt");

function readCache(): string[] {
  try {
    return readFileSync(CACHE_FILE, "utf-8").trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

async function writeCache(projects: string[]): Promise<void> {
  await Bun.write(CACHE_FILE, projects.join("\n"));
}

async function fetchProjects(): Promise<string[]> {
  const output = await $`ssh ${VPS} ls -1 ${PROJECTS_DIR}`.quiet().text();
  return output.trim().split("\n").filter(Boolean);
}

async function fzf(
  choices: string[],
  header: string
): Promise<{ key: string; selected: string } | null> {
  const proc = Bun.spawn(
    [
      "fzf",
      "--height=~50%",
      "--layout=reverse",
      "--prompt=project> ",
      `--header=${header}`,
      "--expect=ctrl-r,ctrl-f",
    ],
    { stdin: "pipe", stdout: "pipe" }
  );

  proc.stdin.write(choices.join("\n"));
  proc.stdin.end();

  const result = await new Response(proc.stdout).text();
  if (!result.trim()) return null;

  const lines = result.trim().split("\n");
  return { key: lines[0] || "", selected: lines[1] || lines[0] };
}

async function main() {
  while (true) {
    // Read from cache (instant)
    let projects = readCache();

    // Background refresh (fire and forget)
    fetchProjects().then(writeCache).catch(() => {});

    // If no cache, wait for fetch
    if (projects.length === 0) {
      projects = await fetchProjects();
      await writeCache(projects);
    }

    const choices = ["(global)", ...projects, "+ new"];

    const result = await fzf(choices, "enter:connect  ^r:restart  ^f:refresh");
    if (!result) process.exit(0);

    // ctrl-r: restart server
    if (result.key === "ctrl-r") {
      await $`ssh ${VPS} systemctl --user restart opencode`.quiet();
      console.log("Restarted server");
      await Bun.sleep(500);
      continue;
    }

    // ctrl-f: force refresh
    if (result.key === "ctrl-f") {
      console.log("Refreshing...");
      projects = await fetchProjects();
      await writeCache(projects);
      continue;
    }

    let dir: string | undefined;

    if (result.selected === "(global)") {
      // No --dir for global
    } else if (result.selected === "+ new") {
      const nameProc = Bun.spawn(
        [
          "fzf",
          "--height=~50%",
          "--layout=reverse",
          "--prompt=name> ",
          "--print-query",
        ],
        { stdin: "pipe", stdout: "pipe" }
      );
      nameProc.stdin.end();
      const name = (await new Response(nameProc.stdout).text())
        .trim()
        .split("\n")[0];
      if (!name) continue;

      await $`ssh ${VPS} mkdir -p ${PROJECTS_DIR}/${name}`.quiet();

      // Add to cache immediately
      const cached = readCache();
      if (!cached.includes(name)) {
        cached.push(name);
        cached.sort();
        await writeCache(cached);
      }

      dir = `${PROJECTS_DIR}/${name}`;
    } else {
      dir = `${PROJECTS_DIR}/${result.selected}`;
    }

    const args = ["opencode", "attach", SERVER_URL];
    if (dir) args.push("--dir", dir);

    const attach = Bun.spawn(args, {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    process.exit(await attach.exited);
  }
}

main();
