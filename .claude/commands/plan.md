---
description: 기능 하나의 실행계획(plan)을 명세서 기반으로 작성 (planner 에이전트)
argument-hint: <기능명> [기능명세 링크] [요구사항 링크]
---

`$ARGUMENTS` 기능의 실행계획을 만든다.

`planner` 서브에이전트(Agent 툴, subagent_type=planner)를 호출해 진행한다.
- **기능명만 주면 된다** (`$ARGUMENTS`). planner가 알아서:
  - 요구사항 → `docs/requirements.md`
  - 기능명세 → 기능명으로 Notion DB에서 select (`notion-fetch --find`)
  - API명세 → 기능명세 보고 API 추론 후 URI로 select
- 기능명이 모호하거나 매칭 안 되면 planner가 후보를 보여주고 확인 요청.
- 결과: `docs/exec-plans/active/<기능명>.md` 생성. API Contract 스냅샷 포함.

생성 후 사용자에게 plan 경로와 API Contract 요약을 보여주고 **사람이 contract를 검토·승인**하게 한다.

승인되면 구현 전에 다음 순서를 안내한다 (contract를 일찍 공유해 BE/FE 병렬 착수 가능하게):
1. `/issue <기능명>` — 이슈 생성
2. 작업 브랜치 생성 → plan 커밋 → push → `/pr` (이슈 연결, 구현 전 오픈)
3. `/impl <기능명> be|fe` — 구현 착수

(이미 active plan이 있는 기능이면 `/plan` 없이 바로 `/impl`로 간다.)
