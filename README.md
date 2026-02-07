# opencode-vps

A fast CLI for managing remote [OpenCode](https://github.com/sst/opencode) sessions over SSH.

## Features

- **Instant startup** — cached project list, background refresh
- **SSH multiplexing** — near-zero latency on repeat connections
- **fzf picker** — fuzzy search, create new projects inline
- **Directory-scoped sessions** — each project gets isolated context
- **Zero dependencies** — pure bash, no runtime needed

## Requirements

- [fzf](https://github.com/junegunn/fzf)
- SSH access to your server
- [OpenCode](https://github.com/sst/opencode) server running remotely

## Setup

1. Clone and add to PATH:

   ```bash
   git clone https://github.com/emmanuelchucks/opencode-vps.git
   ln -s "$(pwd)/opencode-vps/opencode-vps" ~/.local/bin/opencode-vps
   ```

2. Configure SSH multiplexing for faster connections (recommended):

   ```
   # ~/.ssh/config
   Host vps
     HostName your-server-ip
     User your-user
     ControlMaster auto
     ControlPath ~/.ssh/sockets/%r@%h-%p
     ControlPersist 600
   ```

   ```bash
   mkdir -p ~/.ssh/sockets
   ```

3. Set environment variables (add to your shell rc):

   ```bash
   export OPENCODE_VPS_HOST="vps"                              # SSH host (default: vps)
   export OPENCODE_VPS_PROJECTS_DIR="/home/user/projects"      # remote projects path
   export OPENCODE_VPS_SERVER_URL="http://localhost:4096"       # OpenCode server URL
   export OPENCODE_SERVER_PASSWORD="your-password"    # if server is password-protected
   ```

4. Run:

   ```bash
   opencode-vps
   ```

## Usage

```
opencode-vps              # interactive picker
opencode-vps my-project   # direct attach to a project
```

| Key | Action |
|-----|--------|
| `enter` | Attach to selected project |
| `ctrl-r` | Restart OpenCode server |
| `ctrl-f` | Force refresh project list |
| `ctrl-n` / `ctrl-p` | Navigate up/down |

Select `(global)` to attach without directory scoping.

Select `+ new` to create a new project directory on the server.

## How it works

On launch, the cached project list is displayed instantly via fzf while a background SSH refreshes the cache. SSH connection multiplexing (`ControlMaster`) keeps repeat connections fast. When you pick a project, a single SSH call runs `opencode attach` scoped to that directory.

## License

MIT
