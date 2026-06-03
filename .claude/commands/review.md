---
description: 구현을 plan/contract와 대조해 drift 검출 및 단계 완료 판정 (reviewer 에이전트)
argument-hint: <기능명>
---

`$ARGUMENTS` 기능의 구현을 검증한다.

`reviewer` 서브에이전트(Agent 툴, subagent_type=reviewer)를 호출한다.
- `docs/exec-plans/active/<기능명>.md`의 API Contract와 구현 diff를 대조.
- 스펙 drift 목록 + 단계별 판정(API구현/UI구현/연동 ✅·❌) 보고.
- (권고·비차단) 공통 컴포넌트로 대체 가능한 로컬 구현, 공용화(상수/포매터/유틸)·기존 공용 심볼로 대체 가능한 부분도 함께 리마인드.

reviewer가 **셋 다 ✅ + drift 0** 판정이면:
- plan.md의 `## Status` 3항목을 `- [x]`로 체크.
- 사용자에게 "/complete 가능"이라고 안내.

문제 있으면 그대로 보고하고 Status는 체크하지 않는다.
