# oc

A fast CLI for managing remote OpenCode sessions.

Connects to an OpenCode server over SSH/HTTP and lets you quickly switch between project directories with fzf.

## Features

- **Instant startup** - Project list is cached locally and refreshed in the background
- **fzf integration** - Fuzzy search through your projects
- **Directory-scoped sessions** - Each project gets its own isolated OpenCode sessions
- **Simple keybinds** - `enter` to connect, `ctrl-r` to restart server, `ctrl-f` to refresh

## Requirements

- [Bun](https://bun.sh)
- [fzf](https://github.com/junegunn/fzf)
- [OpenCode](https://github.com/sst/opencode) server running remotely
- SSH access to your server

## Setup

1. Clone and link:
   ```bash
   git clone https://github.com/emmanuelchucks/oc-cli.git
   cd oc-cli
   bun link
   ```

2. Set up your environment (add to your shell rc file):
   ```bash
   export OC_VPS="user@your-server"
   export OC_PROJECTS_DIR="/path/to/projects"
   export OC_SERVER_URL="http://your-server:4096"
   ```

3. Create the cache directory and populate it:
   ```bash
   mkdir -p ~/.cache/oc-cli
   ssh $OC_VPS ls -1 $OC_PROJECTS_DIR > ~/.cache/oc-cli/projects.txt
   ```

4. Run it:
   ```bash
   oc
   ```

## Usage

```
oc
```

Use fzf to select a project and press enter. You'll be attached to OpenCode scoped to that directory.

| Keybind | Action |
|---------|--------|
| `enter` | Connect to selected project |
| `ctrl-r` | Restart OpenCode server |
| `ctrl-f` | Force refresh project list |

Select `(global)` to attach without directory scoping (full system access).

Select `+ new` to create a new project directory on the server.

## How it works

On startup, the CLI reads a cached project list from `~/.cache/oc-cli/projects.txt` for instant display, then kicks off a background SSH to refresh the cache for next time. When you pick a project, it runs `opencode attach` with `--dir` to scope the session.

## License

MIT
