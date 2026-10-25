#!/usr/bin/env bash
# Mac / Linux: ./run-local.sh
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || { echo "Node.js is not installed. Install Node 22+ from https://nodejs.org"; exit 1; }
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ] || { echo "Node 22 or newer is required. Update from https://nodejs.org"; exit 1; }
[ -d node_modules ] || npm install || exit 1
[ -d dist ] || npm run build || exit 1
echo "FMC Patient Flow: http://localhost:3000   (Ctrl+C to stop)"
echo "Login: admin / reception / super / pt.one   Password: Demo-Passw0rd!"
(sleep 2; (open http://localhost:3000 || xdg-open http://localhost:3000) >/dev/null 2>&1) &
npm start
