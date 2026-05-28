# Header 컴포넌트

## Summary

- Goal: 시안 기반 Header 컴포넌트 설계 및 구현
- Owner: nogglee
- Date: 2026-05-28

## Context

- Relevant design docs: `DESIGN.md`, `docs/exec-plans/active/header.md`
- 시안에서 파악된 variant 8종 (아래 Variant 목록 참조)
- Route Group (`(main)` / `(sub)`)은 BottomNav 기준으로 분리 — Header 구성과 1:1 매핑되지 않음
- Open decisions: props 설계 방식, 타이틀 주입 방식, layout vs page 배치 (아래 참조)

## Scope

- In:
  - `packages/ui` — Header 컴포넌트 + Storybook (전 variant)
  - `apps/web` — layout / page 단에서 Header 사용 방식 확립
- Out:
  - admin Header (추후 별도 계획)
  - 검색 input 내부 동작 (자동완성, 결과 렌더링 등)

## 확인된 Variant

시안 이미지 기준. 공통 구조: Left / Content / Right **3-zone**, 높이 일정.

| # | Left | Content | Right | 사용 맥락 |
|---|------|---------|-------|-----------|
| 1 | 로고 | — | 알림(종) | 홈 등 main 탭 |
| 2 | 타이틀(left) | — | 알림(종) | 타이틀 있는 main-like 페이지 |
| 3 | 타이틀(left) | — | 텍스트 액션 | 리스트 선택 모드 등 |
| 4 | < + 타이틀(left) | — | 알림(종) | 뒤로가기 있는 서브 |
| 5 | < + 타이틀(left) | — | 텍스트 액션 | 뒤로가기 + 선택 모드 |
| 6 | — | — | X | 팝업 / 풀스크린 모달 |
| 7 | — | 검색 input | × + 닫기 | 검색 모드 |
| 8 | — | 타이틀(center) | — | 미확인 (right 여부 미정) |

### 축 분석

- **Left**: `logo` \| `back` \| `empty`
- **Content**: `title-left` \| `title-center` \| `search-input` \| `none`
- **Right**: `noti` \| `text-action` \| `close-icon` \| `clear+cancel` \| `none`

## 미결 사항 (설계 전 확정 필요)

### 1. props 설계 방식

DESIGN.md 규칙 — Figma variant property 기준 확정 전 코딩 불가.

| 방식 | 예시 | 특징 |
|------|------|------|
| **type enum** | `<Header type="back-noti" title="..." />` | 타입이 조합을 결정, 단순하지만 조합 수 많음 |
| **slot 조합** | `<Header left={<BackButton />} right={<NotiIcon />} />` | 유연, 일관성 관리 어려움 |
| **type + 부분 override** | `<Header type="back" title="..." right="noti" />` | 구조는 type이, 세부는 props가 결정 |

→ Figma variant property 축 확인 후 결정.

### 2. 타이틀 주입 방식

`(sub)` 페이지마다 타이틀이 다름. layout에 Header가 있을 경우 페이지 → layout으로 데이터 전달 방법이 필요.

| 방식 | 동작 | 한계 |
|------|------|------|
| **page 단 배치** | 각 page가 직접 `<Header title="..." />`를 렌더링 | layout 역할 축소, 반복 코드 |
| **zustand** | page mount 시 `headerStore.set({ title, ... })` | 클라이언트 전용, 깜빡임 가능 |
| **parallel route (@header)** | Next.js slot으로 layout에 주입 | 폴더 복잡도 증가 |

### 3. Header 배치 — layout vs page

| 배치 | 구조 | 트레이드오프 |
|------|------|-------------|
| **layout 포함** | `(main)/layout` · `(sub)/layout`에서 각각 선언 | 설정 주입 방식 결정 필요 |
| **page 단 배치** | layout은 shell만, 각 page가 Header 포함 | 유연하지만 page마다 반복 |

## Plan

1. Figma에서 Header variant property 축 확인 → props 설계 확정
2. 미결 사항 3종 결정 후 Decision Log 기록
3. `packages/ui` — Header 컴포넌트 구현
4. `apps/storybook` — Header.stories.tsx (전 variant · 상태)
5. `apps/web` — layout / page 배치 적용

## Risks

- **variant 누락**: 시안에 없는 케이스가 구현 중 발견될 수 있음 — props 설계를 확장 가능한 구조로
- **타이틀 깜빡임**: zustand 주입 방식 선택 시 SSR → 클라이언트 hydration 구간에 타이틀 미표시
- **8번 variant 미확정**: 타이틀 center 정렬의 right 영역이 명시되지 않음 — 확인 필요

## Validation

- Tests: 없음 (UI 컴포넌트)
- Manual checks:
  - [ ] 전 variant 시각적 확인 (Storybook)
  - [ ] back 버튼 동작 (`router.back()`)
  - [ ] 텍스트 액션 콜백 주입 확인
  - [ ] 검색 input focus / clear 동작

## Decision Log

- 2026-05-28: Route Group(`(main)`/`(sub)`)은 BottomNav 기준으로만 분리. Header 구성은 Route Group과 독립적으로 결정.

## Outcome

- Status: 계획 완료, 미결 사항 확정 대기
- Follow-up: 없음
