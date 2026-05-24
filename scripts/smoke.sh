#!/bin/sh
# Switch smoke test — exercises every CLI command end-to-end WITHOUT spending API money.
# Uses `switch run --dry` so no Claude agent is spawned.
#
# Usage:  sh ~/switch/scripts/smoke.sh
set -e

SWITCH="${SWITCH:-$HOME/switch/bin/switch}"

bold()  { printf "\n\033[1m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*"; }

cleanup() {
  # Reset all tasks created during smoke (status 'rejected' or 'approved')
  # We don't drop the DB — leave history visible.
  :
}
trap cleanup EXIT

bold "1. switch init"
"$SWITCH" init

bold "2. switch mode (read)"
"$SWITCH" mode

bold "3. switch status (empty start)"
"$SWITCH" status

bold "4. switch task add (cautious mode, 2 tasks across 2 products)"
TASK_TM=$("$SWITCH" task add truthmark add_card "smoke test: dry run only" | awk '/^queued/ {print $2}')
TASK_HALO=$("$SWITCH" task add halo add_feature "smoke test: dry run only" | awk '/^queued/ {print $2}')
echo "TruthMark task: $TASK_TM"
echo "Halo task:      $TASK_HALO"

bold "5. switch task list"
"$SWITCH" task list

bold "6. switch run --dry (no API spend — orchestration only)"
"$SWITCH" run --dry

bold "7. switch status (after dry run)"
"$SWITCH" status

bold "8. switch task list (should show awaiting_approval)"
"$SWITCH" task list

bold "9. switch approve $TASK_TM (real merge of dry-run commit — will be reverted in step 9b)"
"$SWITCH" approve "$TASK_TM"

bold "9b. revert the dry-run merge so TruthMark main stays clean"
TM_PATH="$HOME/Documents/truthmark"
# Revert the merge commit (HEAD), then remove the SUMMARY.md artifact if present
(cd "$TM_PATH" && \
  git revert --no-edit -m 1 HEAD 2>/dev/null && \
  ([ -f SUMMARY.md ] && git rm --quiet SUMMARY.md && git commit --quiet -m "Remove smoke-test SUMMARY.md" || true) \
) && green "  TruthMark main reverted to pre-smoke state" \
  || red "  could not auto-revert — inspect $TM_PATH manually"

bold "10. switch reject $TASK_HALO (drop the other one)"
"$SWITCH" reject "$TASK_HALO"

bold "11. switch budget"
"$SWITCH" budget

bold "12. switch status (final)"
"$SWITCH" status

green "smoke test PASSED — every CLI path exercised, zero API spend"
