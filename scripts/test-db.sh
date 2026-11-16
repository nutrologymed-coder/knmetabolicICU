#!/usr/bin/env bash
# Runs migrations + pgTAP tests against a throwaway database on a local Postgres (with pgtap installed).
# Fails on SQL errors, failed assertions, plan mismatches and bailouts.
# Usage: PGHOST=... PGUSER=... scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="knm_test_$$"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
args=(-v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/ci/bootstrap.sql)
for f in supabase/migrations/*.sql; do args+=(-f "$f"); done
psql "${args[@]}"

shopt -s nullglob
tests=(supabase/tests/*.sql)
[ ${#tests[@]} -gt 0 ] || { echo "No pgTAP tests found" >&2; exit 1; }
for t in "${tests[@]}"; do
  out=$(psql -v ON_ERROR_STOP=1 -q -t -A -d "$DB" -f "$t") || { echo "$out"; echo "SQL error in $t" >&2; exit 1; }
  echo "$out" | grep -E "^(ok|not ok|#)" || true
  plan=$(echo "$out" | sed -n 's/^1\.\.\([0-9]*\)$/\1/p' | head -1)
  oks=$(echo "$out" | grep -c "^ok " || true)
  if echo "$out" | grep -qE "^not ok|^Bail out|# Looks like"; then echo "pgTAP failures in $t" >&2; exit 1; fi
  if [ -z "$plan" ] || [ "$plan" != "$oks" ]; then echo "Plan mismatch in $t (plan=${plan:-none}, ok=$oks)" >&2; exit 1; fi
done
echo "DB tests passed"
