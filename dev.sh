#!/usr/bin/env bash
#
# SooterMandi local development helper.
#
# Laravel 11 is not deprecation-clean on PHP 8.5, and this machine's default
# `php` is 8.5 with no php.ini (display_errors=On). Those notices get written
# into HTTP response bodies ahead of the JSON and force a 200 status, which
# breaks the frontend. Always run artisan through PHP 8.3 -- that is what this
# script is for.
#
#   ./dev.sh backend     start the Laravel API   (http://localhost:8000)
#   ./dev.sh frontend    start the Next.js app   (http://localhost:3000)
#   ./dev.sh fresh       drop + re-migrate + re-seed the database
#   ./dev.sh migrate     run pending migrations
#   ./dev.sh artisan ... run any artisan command
#   ./dev.sh check       verify PHP 8.3 and MySQL are available

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHP="/opt/homebrew/opt/php@8.3/bin/php"
MYSQL_PORT=8889

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }

check() {
  if [ ! -x "$PHP" ]; then
    red "PHP 8.3 not found at $PHP"
    echo "Install it with:  brew install php@8.3"
    exit 1
  fi
  green "PHP    $("$PHP" -r 'echo PHP_VERSION;')"

  if lsof -nP -iTCP:"$MYSQL_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    green "MySQL  listening on $MYSQL_PORT (MAMP)"
  else
    red "MySQL is not listening on $MYSQL_PORT."
    echo "Open the MAMP app and press 'Start Servers', then try again."
    echo "(This is the same MySQL that MAMP's phpMyAdmin shows you.)"
    exit 1
  fi
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  backend)
    check
    cd "$ROOT/backend"
    exec "$PHP" artisan serve
    ;;
  frontend)
    cd "$ROOT/frontend"
    exec npm run dev
    ;;
  fresh)
    check
    cd "$ROOT/backend"
    exec "$PHP" artisan migrate:fresh --seed
    ;;
  migrate)
    check
    cd "$ROOT/backend"
    exec "$PHP" artisan migrate
    ;;
  artisan)
    cd "$ROOT/backend"
    exec "$PHP" artisan "$@"
    ;;
  check)
    check
    ;;
  *)
    cat <<'USAGE'
SooterMandi local development

  ./dev.sh backend      start the Laravel API   http://localhost:8000
  ./dev.sh frontend     start the Next.js app   http://localhost:3000
  ./dev.sh fresh        drop + re-migrate + re-seed the database
  ./dev.sh migrate      run pending migrations
  ./dev.sh artisan ...  run any artisan command, e.g. ./dev.sh artisan route:list
  ./dev.sh check        verify PHP 8.3 and MySQL are available

Start MAMP first (it provides MySQL on port 8889), then run `backend` and
`frontend` in two terminals and open http://localhost:3000

Seeded logins, password `password` for all:
  client  loom.owner@example.com
  broker  broker@sootermandi.local
  admin   admin@sootermandi.local
USAGE
    ;;
esac
