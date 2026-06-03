#!/usr/bin/env bash
# Codex Desktop 작업로그 수집기를 launchd에 등록한다 (macOS).
# 경로(node, repo, $HOME)를 자동 감지해 plist를 생성하므로 팀원이 그대로 실행하면 된다.
#
# 사용: bash .claude/scripts/install-codex-logger.sh
# 해제: launchctl bootout gui/$(id -u)/com.todam.codex-logger
set -euo pipefail

LABEL="com.todam.codex-logger"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # .claude/scripts
LOGGER="$SCRIPT_DIR/logger-codex.mjs"
ENV_FILE="$SCRIPT_DIR/../.env"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
UID_VAL="$(id -u)"
NODE="$(command -v node || true)"

[ -n "$NODE" ] || { echo "✗ node 없음 — Node.js 먼저 설치"; exit 1; }
[ -f "$LOGGER" ] || { echo "✗ $LOGGER 없음 — repo 최신 pull 필요"; exit 1; }
[ -d "$HOME/.codex/sessions" ] || echo "⚠ ~/.codex/sessions 없음 — Codex Desktop 안 쓰면 등록 의미 없음"

# .env 확인 (claude 로깅과 공용: SUPABASE_URL, SUPABASE_ANON_KEY 필요)
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE 없음 — .env.example 복사 후 SUPABASE_URL / SUPABASE_ANON_KEY 채우기"
  exit 1
fi
# USER_NAME 없으면 git 이름으로 추가 (launchd PATH엔 git 없을 수 있어 .env에 고정)
if ! grep -q '^USER_NAME=' "$ENV_FILE"; then
  GN="$(git config user.name 2>/dev/null || echo unknown)"
  printf '\nUSER_NAME=%s\n' "$GN" >> "$ENV_FILE"
  echo "→ .env에 USER_NAME=$GN 추가"
fi

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE</string>
        <string>$LOGGER</string>
    </array>
    <key>StartInterval</key>
    <integer>60</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.codex/.todam-logger.out.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.codex/.todam-logger.err.log</string>
    <key>ProcessType</key>
    <string>Background</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$UID_VAL/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_VAL" "$PLIST"
launchctl enable "gui/$UID_VAL/$LABEL"
echo "✓ 등록 완료 — 60초마다 Codex 세션 수집 (node=$NODE)"
echo "  확인: launchctl list | grep todam"
echo "  해제: launchctl bootout gui/$UID_VAL/$LABEL"
