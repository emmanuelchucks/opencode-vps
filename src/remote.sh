#!/usr/bin/env zsh

PROJECTS_DIR="/home/ubuntu/projects"
OPENCODE_BIN="/home/ubuntu/.opencode/bin/opencode"
SYSTEM_PORT=4096

ensure_server_running() {
  if ! curl -sf --max-time 0.5 "http://localhost:$SYSTEM_PORT/global/health" >/dev/null 2>&1; then
    echo "Starting system server..."
    systemctl --user start opencode
    for i in {1..50}; do
      curl -sf --max-time 0.2 "http://localhost:$SYSTEM_PORT/global/health" >/dev/null 2>&1 && break
      sleep 0.2
    done
  fi
}

get_choices() {
  choices="system (main :$SYSTEM_PORT)"
  for p in $(ls -1 "$PROJECTS_DIR" 2>/dev/null); do
    [[ -n "$p" ]] && choices=$(printf "%s\n%s" "$choices" "$p")
  done
  choices=$(printf "%s\n+ new" "$choices")
  printf "%s" "$choices"
}

restart_server() {
  systemctl --user restart opencode
  echo "Restarted system server"
}

# Main loop
while true; do
  result=$(get_choices | fzf \
    --height=~50% \
    --layout=reverse \
    --prompt="project> " \
    --header="enter:connect  ^r:restart-server" \
    --bind="ctrl-n:down,ctrl-p:up,j:down,k:up" \
    --expect="ctrl-r")
  
  [[ -z "$result" ]] && exit 0
  
  key=$(echo "$result" | head -1)
  selected=$(echo "$result" | tail -1)
  
  [[ -z "$selected" ]] && continue
  
  if [[ "$key" == "ctrl-r" ]]; then
    restart_server
    sleep 0.5
    continue
  fi
  
  # Handle system (home directory)
  if [[ "$selected" == "system (main :$SYSTEM_PORT)" ]]; then
    ensure_server_running
    exec "$OPENCODE_BIN" attach "http://localhost:$SYSTEM_PORT"
  fi
  
  # Handle new project
  if [[ "$selected" == "+ new" ]]; then
    name=$(printf "" | fzf --height=~50% --layout=reverse --prompt="name> " --print-query | head -1) || continue
    [[ -z "$name" ]] && continue
    mkdir -p "$PROJECTS_DIR/$name"
    selected="$name"
  fi
  
  # Attach with directory scope
  ensure_server_running
  exec "$OPENCODE_BIN" attach "http://localhost:$SYSTEM_PORT" --dir "$PROJECTS_DIR/$selected"
done
