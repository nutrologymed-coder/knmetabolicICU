#!/usr/bin/env bash
# Runs migrations + pgTAP tests against a throwaway database on a local Postgres (with pgtap installed).
# Usage: PGHOST=... PGUSER=... scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="knm_test_$$"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
args=(-v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/ci/bootstrap.sql)
for f in supabase/migrations/*.sql; do args+=(-f "$f"); done
psql "${args[@]}"
out=$(for t in supabase/tests/*.sql; do psql -q -t -d "$DB" -f "$t"; done)
echo "$out" | grep -E "^ *(ok|not ok|#)" || true
if echo "$out" | grep -q "not ok"; then echo "pgTAP failures" >&2; exit 1; fi
echo "DB tests passed"
