# Toast · Modal · BottomSheet

## Summary

- Goal: web 앱의 피드백/인터랙션 UI 레이어(Toast, Modal, BottomSheet) 설계 및 구현
- Owner: nogglee
- Date: 2026-05-28

## Context

- Relevant design docs: `DESIGN.md`, `docs/exec-plans/active/toast-modal-sheet.md`
- 레이아웃: `app-container`가 `max-w-[430px]` h-dvh 프레임으로 뷰포트 가운데 위치
- Open decisions: 없음 (모두 결정 완료, Decision Log 참조)

## Scope

- In:
  - `packages/ui`: Toast · Modal · BottomSheet UI 컴포넌트 + Storybook
  - `apps/web`: zustand store 3종 + AppToast · AppModal · AppBottomSheet
  - `apps/web/layout.tsx`: portal target 삽입 + PWA viewport 메타 적용
- Out:
  - admin 앱 (추후 별도 계획)
  - 드래그-to-dismiss (BottomSheet 제스처) — 추후 보강
  - 알림 배지, 토스트 큐 정책 고도화

## 설계 결정

### 렌더 구조

```
app-container (relative, max-w-[430px], h-dvh)
  ├── Header
  ├── main (flex-1, overflow-y-auto)
  ├── BottomNav
  ├── <div id="toast-root" />
  ├── <div id="modal-root" />
  └── <div id="sheet-root" />
```

Toast · Modal · BottomSheet 모두 `app-container` 안에 constrain.
- backdrop이 viewport 전체가 아닌 430px 프레임 안에 고정
- `createPortal`로 각 root div에 마운트 → DOM 트리와 렌더 위치 분리

### 파일 구조

```
packages/ui/src/components/
  Toast.tsx           — 개별 토스트 item UI (type별 색상)
  Modal.tsx           — 다이얼로그 UI (backdrop + dialog box)
  BottomSheet.tsx     — 시트 UI (backdrop + slide-up panel)

apps/web/src/
  store/
    toast.ts          — zustand: toasts[], push(), dismiss()
    modal.ts          — zustand: isOpen, content, open(), close()
    sheet.ts          — zustand: isOpen, content, open(), close()
  components/
    AppToast.tsx      — 'use client' | store 구독 + portal to #toast-root
    AppModal.tsx      — 'use client' | store 구독 + portal to #modal-root
    AppBottomSheet.tsx — 'use client' | store 구독 + portal to #sheet-root
  app/
    layout.tsx        — portal target div 삽입, App* 컴포넌트 마운트
```

### Store 인터페이스

```ts
// toast.ts
type ToastItem = {
  id: string
  message: string
  type?: 'default' | 'success' | 'error'
  duration?: number   // default 3000ms
}
type ToastStore = {
  toasts: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}
```

```ts
// modal.ts / sheet.ts — 동일 패턴
type OverlayStore = {
  isOpen: boolean
  content: ReactNode | null
  open: (content: ReactNode) => void
  close: () => void
}
```

> ReactNode를 store에 직접 저장하면 zustand devtools에서 직렬화 불가. 감수하거나 content key 방식으로 추후 전환 가능.

### 컴포넌트 스펙

**Toast**

| 항목 | 값 |
|------|-----|
| 위치 | app-container 하단, BottomNav 위 (`bottom-20`) |
| 스택 | 최대 3개, 새것이 위 |
| 자동 dismiss | 3000ms (type별 override 가능) |
| type: default | `bg-inverse` · `text-foreground-inverse` |
| type: success | `bg-success-subtle` · `text-success-darker` |
| type: error | `bg-danger-subtle` · `text-danger-darker` |

**Modal**

| 항목 | 값 |
|------|-----|
| 위치 | `absolute inset-0` (app-container 전체 커버) |
| backdrop | `bg-inverse/50` |
| dialog | `bg-surface`, `rounded-2xl`, `p-6`, 가운데 정렬 |
| 닫기 | backdrop 탭, 내부 닫기 버튼 |

**BottomSheet**

| 항목 | 값 |
|------|-----|
| 위치 | 하단에서 슬라이드 업, `absolute inset-x-0 bottom-0` |
| backdrop | `bg-inverse/50` (Modal과 동일) |
| 패널 | `bg-surface`, `rounded-t-2xl`, handle bar |
| 닫기 | backdrop 탭 (드래그 제스처는 Scope Out) |

## Plan

1. `layout.tsx` — `viewport-fit=cover` 메타, safe-area-inset, overscroll-behavior 적용
2. `packages/ui` — `Toast.tsx` 구현 + `Toast.stories.tsx`
3. `packages/ui` — `Modal.tsx` 구현 + `Modal.stories.tsx`
4. `packages/ui` — `BottomSheet.tsx` 구현 + `BottomSheet.stories.tsx`
5. `apps/web/store` — `toast.ts` · `modal.ts` · `sheet.ts` (zustand)
6. `apps/web/components` — `AppToast.tsx` · `AppModal.tsx` · `AppBottomSheet.tsx`
7. `apps/web/layout.tsx` — portal target div 삽입 + App* 마운트
8. Validation

## Risks

- **SSR hydration**: `createPortal`은 클라이언트 전용 — `useEffect` 마운트 후 portal 활성화 필요 (`mounted` state guard)
- **ReactNode in store**: zustand devtools 직렬화 불가 — 허용하되 추후 content-key 방식으로 전환 가능
- **safe-area 미적용 시**: BottomNav + Toast가 홈 인디케이터에 겹침 (step 1이 전제 조건)
- **스택 overflow**: 토스트 3개 초과 시 오래된 것부터 자동 제거 처리 필요

## Validation

- Tests: 각 store unit test (push/dismiss/open/close 동작)
- Manual checks:
  - [ ] 토스트 3개 동시 push → 최대 3개 유지
  - [ ] 모달 backdrop 탭 → 닫힘
  - [ ] 바텀시트 backdrop 탭 → 닫힘
  - [ ] 모든 오버레이가 app-container(430px) 안에 constrain
  - [ ] iOS 실기기 safe-area — BottomNav·Toast가 홈 인디케이터와 겹치지 않음
- Observability: 없음 (클라이언트 전용 UI 레이어)

## Decision Log

- 2026-05-28: ToastContainer를 packages/ui에 별도 구성하지 않음. AppToast가 store 구독 + portal 마운트까지 담당. admin 미고려 시점에서 중복 레이어 불필요.
- 2026-05-28: Modal · BottomSheet backdrop을 viewport가 아닌 app-container(430px) 안으로 constrain 결정. 모바일 앱 UX 유지.
- 2026-05-28: store는 apps/web에 위치. packages/ui는 순수 UI만 담당. admin 시점에 store 위치 재검토.
- 2026-05-28: 애니메이션 → Framer Motion 채택. 이유: exit 애니메이션 코드 간결화 + 향후 BottomSheet 드래그 제스처(useMotionValue·PanInfo) 확장 시 필수 의존성. 35KB는 PWA 캐싱으로 허용.
- 2026-05-28: store content → ReactNode 직접 저장. 이유: 초기 개발 단계에서 모달 타입 미확정. content-key 방식은 새 타입마다 store 타입 + 렌더러 맵 이중 수정 필요. devtools 직렬화 불가는 클라이언트 전용 UI에서 허용.

## Outcome

- Status: 계획 완료, 구현 대기
- Follow-up: 드래그 제스처(BottomSheet), 애니메이션 라이브러리 선택, admin 오버레이 설계
