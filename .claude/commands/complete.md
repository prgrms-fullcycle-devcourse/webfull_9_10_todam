---
description: plan을 completed로 이동 (Status 3체크 통과 시). pre-commit 게이트가 최종 강제.
argument-hint: <기능명>
---

`$ARGUMENTS` 기능 plan을 `completed/`로 이동한다.

1. `docs/exec-plans/active/<기능명>.md`의 `## Status` 확인.
   - `- [ ]`(미체크) 항목이 하나라도 있으면 **중단**: 미체크 항목을 나열하고 "/review로 검증 후 진행하라"고 안내.
2. 셋(API 구현/UI 구현/API 연동) 다 `- [x]`면:
   - `Outcome` 섹션의 Status를 완료로, Follow-up 기입.
   - `git mv docs/exec-plans/active/<기능명>.md docs/exec-plans/completed/<기능명>.md`
3. 이동을 커밋하면 `.claude/scripts/plan-gate.mjs`(pre-commit)가 체크리스트를 **다시 검증**한다. 미완료면 커밋이 거부되고 `.claude/logs/gate.jsonl`에 사유가 남는다.

게이트는 우회 불가 — 수동 mv·직접 커밋도 pre-commit에서 막힌다.
