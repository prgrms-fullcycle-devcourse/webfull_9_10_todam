---
description: active plan 기반으로 구현 (implementer 에이전트). 모드 be|fe.
argument-hint: <기능명> <be|fe>
---

`$ARGUMENTS` — 기능명과 모드(`be` 또는 `fe`)를 받아 구현한다.

먼저 `docs/exec-plans/active/<기능명>.md` 존재 확인. 없으면 "plan이 먼저 필요하다(/plan)"고 알리고 중단.

`implementer` 서브에이전트(Agent 툴, subagent_type=implementer)를 호출한다.
- plan.md의 **API Contract 스냅샷에 바인딩**해 구현. contract와 다르게 만들지 말 것.
- be: `apps/api` 엔드포인트. fe: UI(사람 작업물) 존중하며 API 연동.
- 완료 단계의 `## Status` 항목 `- [x]` 체크 + `## Out` 기록.

contract 불충분/모순이면 구현 멈추고 재plan 요청.
