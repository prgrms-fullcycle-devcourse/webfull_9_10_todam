# Bottom Navigation Hook

## Goal

- Root layout에 `BottomNav` 1개만 둔다.
- `useBottomNavigation`이 pathname 보고 `visible`, `role`, `items` 결정한다.
- user/partner 같은 app shell 쓴다.

## Files

```text
apps/web/src/widgets/bottom-navigation/
  model/useBottomNavigation.ts
  ui/BottomNav.tsx
  index.ts
```

FSD 기준:

- `app`: route/layout만.
- `widgets/bottom-navigation`: app shell UI + 그 UI 전용 model.
- `shared`: 앱 route 정책 모르게 둔다.

## Route Rule

BottomNav 보이는 route만 allowlist.

user:

- `/`
- `/my`
- `/my/reservations`

partner:

- `/partner`
- `/partner/settings`
- `/partner/reservations`
- `/partner/artworks`

주의:

- user nav item에는 `찾기 -> /search` 포함.
- 하지만 `/search` 진입 시 BottomNav 숨김.
- 상세/인증/등록/수정 화면도 숨김.

## Zustand Decision

지금은 Zustand 안 쓴다.

이유:

- 현재 상태는 pathname에서 바로 계산 가능.
- 전역 mutable state 아님.
- store 만들면 source of truth 2개(pathname + store) 생김.

Zustand 추가 조건:

- 로그인 role/session 따라 nav 달라짐.
- partner 선택 공방 상태가 nav에 필요함.
- 권한/온보딩/서버 설정으로 item이 바뀜.
- 여러 widget이 같은 nav 상태를 수정/공유해야 함.

그때 위치 후보:

```text
apps/web/src/widgets/bottom-navigation/model/bottomNavigationStore.ts
```

## Plan

1. `widgets/bottom-navigation` slice 생성.
2. `useBottomNavigation`에 route allowlist, role, active 계산 넣기.
3. `BottomNav`는 hook 결과만 렌더링.
4. root layout에서 `BottomNav` 사용.
5. 기존 `components/BottomNav.tsx` 참조 제거.

## Verify

- `pnpm --filter @todam/web lint`
- `pnpm --filter @todam/web typecheck`
- 수동 확인:
  - allowlist route: BottomNav 표시.
  - `/search`, auth, 상세 route: BottomNav 숨김.

## Outcome

- 구현 완료. lint/typecheck 통과.
- 생성: `widgets/bottom-navigation/{model/useBottomNavigation.ts, ui/BottomNav.tsx, index.ts}`.
- 기존 `postcss.config.mjs` anonymous default export warning 1개 남음 (무관).

### 후속 작업 (조건부, tech-debt-tracker 추적)

- BottomNav Zustand store 도입 — 트리거: 로그인 role/session·선택공방·권한/온보딩 기반 nav 변동, 여러 widget 공유 중 하나 발생 시. 현재 pathname 계산으로 충분.
- visible path set을 Header와 공유하는 shared config로 분리 (header-hook.md와 공통).
