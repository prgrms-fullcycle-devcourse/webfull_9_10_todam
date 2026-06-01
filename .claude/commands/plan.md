---
description: 기능 하나의 실행계획(plan)을 명세서 기반으로 작성 (planner 에이전트)
argument-hint: <기능명> [기능명세 링크] [요구사항 링크]
---

`$ARGUMENTS` 기능의 실행계획을 만든다.

`planner` 서브에이전트(Agent 툴, subagent_type=planner)를 호출해 진행한다.
- 기능명세서 + 요구사항명세서 Notion 게시 링크가 첨부됐는지 확인. 없으면 사용자에게 요구하고 중단.
- 결과: `docs/exec-plans/active/<기능명>.md` 생성. API Contract 스냅샷 포함.

생성 후 사용자에게 plan 경로와 API Contract 요약을 보여주고, **사람이 contract를 검토·승인**한 뒤 `/impl`로 넘어가라고 안내한다.
