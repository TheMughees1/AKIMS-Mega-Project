#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1
node -e 'if(Number(process.versions.node.split(".")[0])<24)throw new Error("Use Node.js 24 or newer.")'
npm ci --no-fund --no-audit
if [ ! -f .env.local ]; then
  install -m 600 .env.example .env.local
fi
node --env-file-if-exists=.env.local scripts/ensure-database.mjs
npm run db:migrate
node --env-file-if-exists=.env.local --input-type=module -e 'if(process.env.DEMO_MODE==="true"&&process.env.APP_ENV!=="production")await import("./scripts/seed.mjs")'
npm run typecheck
