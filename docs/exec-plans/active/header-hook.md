# Header Hook

## Goal

- Root layout에 `Header` 1개.
- `useHeader`가 pathname 보고 `visible`, `type`, `title` 결정.
- 정적 route 자동 처리. 동적 title / 특수 variant는 page가 직접 렌더링.

## Files

```text
apps/web/src/widgets/header/
  model/useHeader.ts
  ui/Header.tsx
  index.ts
```

FSD 기준:

- `app`: route/layout만.
- `widgets/header`: app shell Header UI + 전용 model.
- `packages/ui`: 범용 Header 컴포넌트 유지.

## 관리 범위

| 구분 | type | 처리 |
|---|---|---|
| layout-managed | `home`, `main`, `sub` (정적 title) | `useHeader` + root layout |
| page-managed | `sub` (동적 title), `mainText`, `subText`, `popup`, `search` | page 직접 `<Header />` |

`useHeader`가 모르는 route → `visible: false`. page가 필요하면 직접 붙임.

## Route Config

```ts
const routeConfig: Record<string, { type: LayoutHeaderType; title?: string }> = {
  '/':                      { type: 'home' },
  '/my':                    { type: 'main', title: '마이' },
  '/my/reservations':       { type: 'sub',  title: '예약' },
  '/partner':               { type: 'main', title: '홈' },
  '/partner/reservations':  { type: 'sub',  title: '예약' },
  '/partner/artworks':      { type: 'sub',  title: '작품' },
  '/partner/settings':      { type: 'sub',  title: '설정' },
}
```

`type LayoutHeaderType = 'home' | 'main' | 'sub'`

## Callback 정책

| callback | 처리 |
|---|---|
| `onBack` | hook 기본값 `router.back()` |
| `onNoti` | prop override |
| `onAction`, `onClose`, `onSearch*` | page-managed variant에서 page가 직접 주입 |

## Page-Managed 케이스

```tsx
// 동적 title (detail page)
<Header type="sub" title={data.name} onBack={() => router.back()} />

// 팝업 — 컴포넌트 내부에서
<Header type="popup" onClose={onClose} />

// 선택 모드
<Header type="mainText" title="공방 목록" actionLabel="선택" onAction={handleSelect} />

// 미등록 route (헤더 필수 page)
<Header type="sub" title="..." />
```

## BottomNav 연계

`useBottomNavigation`의 visible path set과 경계 공유.
BottomNav visible → `home` / `main` header.
BottomNav hidden → `sub` or page-managed.

중복 제거 후보: visible path set을 shared config로 분리 (추후).

## Plan

1. `widgets/header` slice 생성.
2. `useHeader` 구현 — routeConfig map + `onBack` 기본값.
3. `widgets/header/ui/Header.tsx` — hook 결과 + prop override 병합 후 `@todam/ui` Header 렌더링.
4. root layout에서 `<Header />` 사용.
5. 기존 `apps/web/src/components/Header.tsx` 참조 제거.

## Verify

- `pnpm --filter @todam/web lint`
- `pnpm --filter @todam/web typecheck`
- 수동 확인:
  - routeConfig route: 올바른 type + title.
  - 미등록 route: Header 없음 (layout).
  - `onBack` 기본 동작.
  - popup / search: page-managed Header 정상 렌더링.

## Status

- 구현 완료.
- lint/typecheck 통과.
- 생성 파일: `apps/web/src/widgets/header/model/useHeader.ts`, `apps/web/src/widgets/header/ui/Header.tsx`, `apps/web/src/widgets/header/index.ts`
- 변경 파일: `apps/web/src/app/layout.tsx` (Header 추가), `apps/web/src/app/page.tsx`, `apps/web/src/app/partner/page.tsx` (Header 제거)
