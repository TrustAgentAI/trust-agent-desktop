#!/usr/bin/env bash
# livekit-test.sh - Quick test to verify LiveKit Cloud configuration
# Usage: bash operations/env/livekit-test.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo " LiveKit Cloud Configuration Test"
echo "========================================"
echo ""

# Load .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
  echo -e "${GREEN}[OK]${NC} Loaded .env file"
else
  echo -e "${YELLOW}[WARN]${NC} No .env file found in current directory"
fi

PASS=true

# Check LIVEKIT_API_KEY
if [ -z "${LIVEKIT_API_KEY:-}" ] || [ "$LIVEKIT_API_KEY" = "your-livekit-api-key" ]; then
  echo -e "${RED}[FAIL]${NC} LIVEKIT_API_KEY is not set or is still a placeholder"
  PASS=false
else
  echo -e "${GREEN}[OK]${NC} LIVEKIT_API_KEY is set (${LIVEKIT_API_KEY:0:6}...)"
fi

# Check LIVEKIT_API_SECRET
if [ -z "${LIVEKIT_API_SECRET:-}" ] || [ "$LIVEKIT_API_SECRET" = "your-livekit-api-secret" ]; then
  echo -e "${RED}[FAIL]${NC} LIVEKIT_API_SECRET is not set or is still a placeholder"
  PASS=false
else
  echo -e "${GREEN}[OK]${NC} LIVEKIT_API_SECRET is set (${LIVEKIT_API_SECRET:0:4}...)"
fi

# Check LIVEKIT_SERVER_URL
if [ -z "${LIVEKIT_SERVER_URL:-}" ] || [[ "$LIVEKIT_SERVER_URL" == *"your-project"* ]]; then
  echo -e "${RED}[FAIL]${NC} LIVEKIT_SERVER_URL is not set or is still a placeholder"
  PASS=false
else
  echo -e "${GREEN}[OK]${NC} LIVEKIT_SERVER_URL = $LIVEKIT_SERVER_URL"
fi

echo ""

# If any check failed, exit early
if [ "$PASS" = false ]; then
  echo -e "${RED}Some environment variables are missing or still use placeholder values.${NC}"
  echo "See operations/env/livekit-setup.md for setup instructions."
  exit 1
fi

# Test token generation using a small Node.js script
echo "Testing token generation with livekit-server-sdk..."
echo ""

TOKEN_OUTPUT=$(node -e "
const { AccessToken } = require('livekit-server-sdk');

async function main() {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: 'test-user', name: 'Test User' }
  );
  at.addGrant({ room: 'test-room', roomJoin: true, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();
  console.log('TOKEN_OK:' + token.substring(0, 20) + '...');
}

main().catch(err => {
  console.error('TOKEN_FAIL:' + err.message);
  process.exit(1);
});
" 2>&1) || true

if echo "$TOKEN_OUTPUT" | grep -q "TOKEN_OK:"; then
  echo -e "${GREEN}[OK]${NC} Token generated successfully"
  echo "    Preview: $(echo "$TOKEN_OUTPUT" | grep TOKEN_OK | sed 's/TOKEN_OK://')"
else
  echo -e "${RED}[FAIL]${NC} Token generation failed"
  echo "    Error: $(echo "$TOKEN_OUTPUT" | grep TOKEN_FAIL | sed 's/TOKEN_FAIL://')"
  echo ""
  echo "Make sure livekit-server-sdk is installed: npm ls livekit-server-sdk"
  exit 1
fi

echo ""

# Test connectivity to LiveKit server
HTTPS_URL="${LIVEKIT_SERVER_URL/wss:\/\//https://}"
echo "Testing connectivity to LiveKit Cloud server..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HTTPS_URL" 2>/dev/null) || HTTP_STATUS="000"

if [ "$HTTP_STATUS" != "000" ]; then
  echo -e "${GREEN}[OK]${NC} LiveKit server reachable (HTTP $HTTP_STATUS)"
else
  echo -e "${YELLOW}[WARN]${NC} Could not reach LiveKit server at $HTTPS_URL"
  echo "    This may be normal if you are behind a firewall or the URL requires WebSocket."
fi

echo ""
echo "========================================"
if [ "$PASS" = true ]; then
  echo -e "${GREEN} All checks passed!${NC}"
else
  echo -e "${RED} Some checks failed.${NC}"
fi
echo "========================================"
