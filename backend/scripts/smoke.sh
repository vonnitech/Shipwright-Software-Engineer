#!/usr/bin/env bash
# End-to-end smoke test of the Feature Request Board API.
# Starts the real server on a spare port against a throwaway SQLite file seeded
# from tests/setup.sql, exercises the golden path with curl, then tears it down.
set -uo pipefail
cd "$(dirname "$0")/.."   # backend/

PORT="${SMOKE_PORT:-3457}"
BASE="http://127.0.0.1:${PORT}"
TMPDIR_SMOKE="$(mktemp -d)"
DB="${TMPDIR_SMOKE}/smoke.db"
LOG="${TMPDIR_SMOKE}/server.log"
SERVER_PID=""

cleanup() {
  if [ -n "${SERVER_PID}" ] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${TMPDIR_SMOKE}"
}
trap cleanup EXIT

sqlite3 "${DB}" < tests/setup.sql || { echo "FATAL: could not seed ${DB}"; exit 1; }

PORT="${PORT}" TEST_DB="${DB}" AUTH_SECRET="smoke-test-secret" \
  setsid nohup bun src/index.ts > "${LOG}" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null "${BASE}/health" 2>/dev/null; then break; fi
  sleep 0.25
done

code() { printf '%s' "$1"; }

echo "== health"
printf 'GET  /health -> %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/health")"

echo "== signup"
SIGNUP_BODY="$(curl -s -w '\n%{http_code}' -X POST "${BASE}/auth/signup" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke User","email":"smoke@example.com"}')"
SIGNUP_CODE="$(printf '%s' "${SIGNUP_BODY}" | tail -n1)"
USER_TOKEN="$(printf '%s' "${SIGNUP_BODY}" | sed '$d' | jq -r '.token')"
printf 'POST /auth/signup -> %s (user id %s, token len %s)\n' \
  "${SIGNUP_CODE}" "$(printf '%s' "${SIGNUP_BODY}" | sed '$d' | jq -r '.user.id')" "${#USER_TOKEN}"

echo "== create feature request (unauthenticated)"
printf 'POST /api/feature-requests (no auth) -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/feature-requests" \
    -H 'Content-Type: application/json' -d '{"title":"x","description":"y"}')"

echo "== create feature request"
CREATE_BODY="$(curl -s -w '\n%{http_code}' -X POST "${BASE}/api/feature-requests" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer ${USER_TOKEN}" \
  -d '{"title":"Dark mode","description":"Please add a dark theme"}')"
CREATE_CODE="$(printf '%s' "${CREATE_BODY}" | tail -n1)"
FR_ID="$(printf '%s' "${CREATE_BODY}" | sed '$d' | jq -r '.id')"
printf 'POST /api/feature-requests -> %s (id %s, status %s, vote_count %s)\n' \
  "${CREATE_CODE}" "${FR_ID}" \
  "$(printf '%s' "${CREATE_BODY}" | sed '$d' | jq -r '.status')" \
  "$(printf '%s' "${CREATE_BODY}" | sed '$d' | jq -r '.vote_count')"

echo "== list"
LIST_BODY="$(curl -s -w '\n%{http_code}' "${BASE}/api/feature-requests?page=1&per_page=10")"
printf 'GET  /api/feature-requests -> %s (items %s, total %s)\n' \
  "$(printf '%s' "${LIST_BODY}" | tail -n1)" \
  "$(printf '%s' "${LIST_BODY}" | sed '$d' | jq -r '.items | length')" \
  "$(printf '%s' "${LIST_BODY}" | sed '$d' | jq -r '.total')"

echo "== get one"
printf 'GET  /api/feature-requests/:id -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/api/feature-requests/${FR_ID}")"

echo "== vote (add)"
VOTE1="$(curl -s -w '\n%{http_code}' -X POST "${BASE}/api/feature-requests/${FR_ID}/vote" \
  -H "Authorization: Bearer ${USER_TOKEN}")"
printf 'POST /api/feature-requests/:id/vote -> %s (vote_count %s, has_voted %s)\n' \
  "$(printf '%s' "${VOTE1}" | tail -n1)" \
  "$(printf '%s' "${VOTE1}" | sed '$d' | jq -r '.vote_count')" \
  "$(printf '%s' "${VOTE1}" | sed '$d' | jq -r '.has_voted')"

echo "== vote (toggle off)"
VOTE2="$(curl -s -w '\n%{http_code}' -X POST "${BASE}/api/feature-requests/${FR_ID}/vote" \
  -H "Authorization: Bearer ${USER_TOKEN}")"
printf 'POST /api/feature-requests/:id/vote -> %s (vote_count %s, has_voted %s)\n' \
  "$(printf '%s' "${VOTE2}" | tail -n1)" \
  "$(printf '%s' "${VOTE2}" | sed '$d' | jq -r '.vote_count')" \
  "$(printf '%s' "${VOTE2}" | sed '$d' | jq -r '.has_voted')"

echo "== vote (add again, left in place)"
VOTE3="$(curl -s -w '\n%{http_code}' -X POST "${BASE}/api/feature-requests/${FR_ID}/vote" \
  -H "Authorization: Bearer ${USER_TOKEN}")"
printf 'POST /api/feature-requests/:id/vote -> %s (vote_count %s, has_voted %s)\n' \
  "$(printf '%s' "${VOTE3}" | tail -n1)" \
  "$(printf '%s' "${VOTE3}" | sed '$d' | jq -r '.vote_count')" \
  "$(printf '%s' "${VOTE3}" | sed '$d' | jq -r '.has_voted')"

echo "== admin status update (as non-admin user)"
printf 'PATCH /api/feature-requests/:id (user token) -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${BASE}/api/feature-requests/${FR_ID}" \
    -H 'Content-Type: application/json' -H "Authorization: Bearer ${USER_TOKEN}" \
    -d '{"status":"planned"}')"

echo "== promote to admin out of band, then login"
sqlite3 "${DB}" "UPDATE users SET role = 'admin' WHERE email = 'smoke@example.com'"
ADMIN_TOKEN="$(curl -s -X POST "${BASE}/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"smoke@example.com"}' | jq -r '.token')"
PATCH_BODY="$(curl -s -w '\n%{http_code}' -X PATCH "${BASE}/api/feature-requests/${FR_ID}" \
  -H 'Content-Type: application/json' -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{"status":"planned"}')"
printf 'PATCH /api/feature-requests/:id (admin token) -> %s (status now %s)\n' \
  "$(printf '%s' "${PATCH_BODY}" | tail -n1)" \
  "$(printf '%s' "${PATCH_BODY}" | sed '$d' | jq -r '.status')"

echo "== validation"
printf 'POST /api/feature-requests (empty title) -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/feature-requests" \
    -H 'Content-Type: application/json' -H "Authorization: Bearer ${USER_TOKEN}" \
    -d '{"title":"","description":"y"}')"
printf 'PATCH /api/feature-requests/:id (bad status) -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${BASE}/api/feature-requests/${FR_ID}" \
    -H 'Content-Type: application/json' -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -d '{"status":"nope"}')"
printf 'GET  /api/feature-requests/:id (forged token) -> %s\n' \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/feature-requests/${FR_ID}/vote" \
    -H "Authorization: Bearer ${USER_TOKEN%?}X")"

echo "== server log"
cat "${LOG}"
