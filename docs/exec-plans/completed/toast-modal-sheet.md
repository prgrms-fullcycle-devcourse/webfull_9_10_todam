# Toast · Modal · BottomSheet

## Summary

- Goal: web 앱의 피드백/인터랙션 UI 레이어(Toast, Modal, BottomSheet) 설계 및 구현
- Owner: nogglee
- Date: 2026-05-28

## Context

- Relevant design docs: `DESIGN.md`, `docs/exec-plans/completed/toast-modal-sheet.md`
- 레이아웃: `app-container`가 `max-w-[430px]` h-dvh 프레임으로 뷰포트 가운데 위치
- Open decisions: 없음 (모두 결정 완료, Decision Log 참조)

## Scope

- In:
  - `packages/ui`: Toast · Modal · StandardBottomSheet · FormBottomSheet 순수 UI 컴포넌트 + Storybook
  - `apps/web`: zustand store 3종 + AppToast · AppModal · AppSheet
  - `apps/web/layout.tsx`: App* 오버레이 직접 마운트 + PWA viewport 메타 적용
- Out:
  - admin 앱 (추후 별도 계획)
  - 알림 배지, 토스트 큐 정책 고도화

## 설계 결정

### 렌더 구조

```
app-container (relative, max-w-[430px], h-dvh)
  ├── Header
  ├── main (flex-1, overflow-y-auto)
  ├── BottomNav
  ├── AppModal
  ├── AppSheet
  └── AppToast
```

Toast · Modal · BottomSheet 모두 `app-container` 안에 constrain.
- backdrop이 viewport 전체가 아닌 430px 프레임 안에 고정
- `App*` 컴포넌트를 layout의 app-container 하단에 직접 렌더링
- 별도 `portal` target을 두지 않아 SSR hydration용 mounted guard가 필요 없음

### 파일 구조

```
packages/ui/src/components/
  Toast.tsx           ✅ — 순수 UI (type=icon|button, currentColor 아이콘 상속)
  Modal.tsx           ✅ — 순수 UI (shortText|longText, danger)
  StandardBottomSheet.tsx ✅ — 일반 시트 UI (grabber, subLabel 서브버튼)
  FormBottomSheet.tsx ✅ — 폼 시트 UI (키보드 밀착형, rounded-t only, actionDisabled)

apps/web/src/
  store/
    toast.ts          ✅ — zustand: toasts[], push()→id, dismiss(), useToast()
    modal.ts          ✅ — zustand: isOpen, content, open(), close(), useModal()
    sheet.ts          ✅ — zustand: isOpen, content, open(), close(), useSheet()
  components/
    AppToast.tsx      ✅ — 'use client' | store 구독 + 직접 렌더링
    AppModal.tsx      ✅ — 'use client' | store 구독 + 직접 렌더링
    AppSheet.tsx      ✅ — 'use client' | store 구독 + 직접 렌더링 + drag-to-dismiss
  app/
    layout.tsx        ✅ — AppModal · AppSheet · AppToast 마운트

apps/storybook/src/stories/
  Toast.stories.tsx   ✅ — Playground + TypeIcon + TypeButton + AllVariants
  Modal.stories.tsx   ✅ — shortText + longText + danger + AllVariants
  StandardBottomSheet.stories.tsx ✅ — Default + WithSubAction + Content
  FormBottomSheet.stories.tsx ✅ — Default + Disabled + Content
```

### Store 인터페이스

```ts
// toast.ts — Figma variant 기준 (type = 레이아웃, 색상 단일)
type ToastItem = {
  id: string
  message: ReactNode
  type?: 'icon' | 'button'        // Figma variant: icon | button
  icon?: ReactElement<{ size?: number }>
  actionLabel?: string            // type='button' 액션 라벨 (default '취소')
  onAction?: () => void
  duration?: number               // default 3000ms
}
type ToastStore = {
  toasts: ToastItem[]             // 최대 3개, 새것이 배열 앞
  push: (toast: Omit<ToastItem, 'id'>) => string  // id 반환
  dismiss: (id: string) => void
}

// 편의 훅 — store 직접 import 없이 사용
function useToast(): { push, dismiss }
```

**사용 예시:**
```tsx
const { push } = useToast();

push({ message: '저장됐어요', type: 'icon', icon: <NotiIcon /> });
push({ message: '삭제했어요', type: 'button', actionLabel: '취소', onAction: handleUndo });
```

```ts
// modal.ts / sheet.ts — 동일 패턴
type OverlayStore = {
  isOpen: boolean
  content: ReactNode | null
  open: (content: ReactNode) => void
  close: () => void
}

function useModal(): { open, close }
function useSheet(): { open, close }
```

> ReactNode를 store에 직접 저장하면 zustand devtools에서 직렬화 불가. 감수하거나 content key 방식으로 추후 전환 가능.

### 컴포넌트 스펙

**Toast**

| 항목 | 값 |
|------|-----|
| 위치 | app-container 하단, BottomNav 위 (`bottom-20`) |
| 스택 | 최대 3개, 새것이 위 |
| 자동 dismiss | 3000ms (item별 override 가능) |
| 컨테이너 | `bg-inverse/90` · `rounded-xl` · `px-4 py-3 gap-2` |
| 텍스트 | `text-base leading-5 text-foreground-inverse` |
| type=icon | 아이콘(16px) + 메시지 |
| type=button | 아이콘 + 메시지 + 액션버튼(`text-sm` underline, 우측) |

> Figma variant `type`는 **레이아웃**(icon/button)이지 색상 아님. success/error 색상 variant는 Figma 미존재 → 시안 추가 시 별도 prop으로 확장.

**Modal**

| 항목 | 값 |
|------|-----|
| 위치 | `absolute inset-0` (app-container 전체 커버) |
| backdrop | `bg-inverse/80` |
| dialog | `bg-surface`, `rounded-3xl`, `p-4`, 가운데 정렬 |
| type=shortText | 가로 버튼 |
| type=longText | 세로 버튼 |
| danger | 확인 버튼 danger 색상 |
| 닫기 | backdrop 탭, 내부 닫기 버튼 |

**StandardBottomSheet**

| 항목 | 값 |
|------|-----|
| 위치 | 하단에서 슬라이드 업, `absolute bottom-10 left-2 right-2` |
| backdrop | `bg-inverse/40` |
| 패널 | `bg-surface`, `rounded-3xl`, grabber |
| action | filled primary 버튼 |
| subLabel | ghost 서브버튼 |
| 닫기 | backdrop 탭, AppSheet drag-to-dismiss |

**FormBottomSheet**

| 항목 | 값 |
|------|-----|
| 위치 | 하단 밀착, `absolute bottom-0 left-0 right-0` |
| backdrop | `bg-inverse/40` |
| 패널 | `bg-surface`, `rounded-t-3xl`, 키보드 밀착형 |
| actionDisabled | action 버튼 disabled 전달 |
| subLabel | ghost 서브버튼 |
| 닫기 | backdrop 탭, AppSheet drag-to-dismiss |

## Plan

1. ✅ `layout.tsx` — `viewport-fit=cover` 메타 적용, App* 오버레이 직접 마운트
2. ✅ `packages/ui` — `Toast.tsx` 구현 + `Toast.stories.tsx`
3. ✅ `packages/ui` — `Modal.tsx` 구현 + `Modal.stories.tsx`
4. ✅ `packages/ui` — `StandardBottomSheet.tsx` · `FormBottomSheet.tsx` 구현 + Storybook
5. ✅ `apps/web/store` — `toast.ts` · `modal.ts` · `sheet.ts` (zustand + 편의 훅)
6. ✅ `apps/web/components` — `AppToast.tsx` · `AppModal.tsx` · `AppSheet.tsx`
7. ✅ `apps/web/layout.tsx` — `<AppModal />` · `<AppSheet />` · `<AppToast />` 마운트
8. ⬜ Validation (store unit test, iOS safe-area 실기기)

## Risks

- **SSR hydration**: ✅ 해결 — portal 제거, app-container 내부 직접 렌더링으로 `document` 접근 없음
- **ReactNode in store**: 허용 유지 — zustand devtools 직렬화 불가, 추후 content-key 방식 전환 가능
- **safe-area 미적용 시**: BottomNav + Toast가 홈 인디케이터에 겹침 → iOS 실기기 검증 필요
- **스택 overflow**: ✅ 해결 — `push()`에서 `[new, ...prev].slice(0, 3)` 처리

## Validation

- Tests: ⬜ 각 store unit test (push/dismiss/open/close 동작)
- Manual checks:
  - [x] Storybook — type=icon / type=button / 아이콘 없음 3종 렌더 정상
  - [x] 아이콘 색상 텍스트와 동일 (currentColor 상속)
  - [ ] 토스트 3개 동시 push → 최대 3개 유지, 새것이 위
  - [ ] 3000ms 후 자동 dismiss
  - [ ] framer-motion enter/exit 애니메이션
  - [ ] 모달 backdrop 탭 → 닫힘
  - [ ] 바텀시트 backdrop 탭 → 닫힘
  - [ ] 바텀시트 아래 방향 drag-to-dismiss
  - [ ] 모든 오버레이가 app-container(430px) 안에 constrain
  - [ ] iOS 실기기 safe-area — BottomNav·Toast가 홈 인디케이터와 겹치지 않음
- Observability: 없음 (클라이언트 전용 UI 레이어)

## Decision Log

- 2026-05-28: ToastContainer를 packages/ui에 별도 구성하지 않음. AppToast가 store 구독 + 렌더링까지 담당. admin 미고려 시점에서 중복 레이어 불필요.
- 2026-05-28: Modal · BottomSheet backdrop을 viewport가 아닌 app-container(430px) 안으로 constrain 결정. 모바일 앱 UX 유지.
- 2026-05-28: store는 apps/web에 위치. packages/ui는 순수 UI만 담당. admin 시점에 store 위치 재검토.
- 2026-05-28: 애니메이션 → Framer Motion 채택. 이유: exit 애니메이션 코드 간결화 + 향후 BottomSheet 드래그 제스처(useMotionValue·PanInfo) 확장 시 필수 의존성. 35KB는 PWA 캐싱으로 허용.
- 2026-05-28: store content → ReactNode 직접 저장. 이유: 초기 개발 단계에서 모달 타입 미확정. content-key 방식은 새 타입마다 store 타입 + 렌더러 맵 이중 수정 필요. devtools 직렬화 불가는 클라이언트 전용 UI에서 허용.
- 2026-05-29: Figma `type` variant = 레이아웃(icon/button), 색상 단일. 계획서의 success/error 색상 type은 Figma 미존재 → Figma 구조 그대로 채택. success/error는 시안 생기면 별도 prop으로 확장.
- 2026-05-29: `useToast()` 편의 훅을 `store/toast.ts`에 동거. 단순 push/dismiss 노출 수준이라 별도 파일 분리 불필요. 로직 늘어나면 재검토.
- 2026-05-29: portal target 제거. app-container 안에 App* 컴포넌트를 직접 렌더링해 430px 앱 프레임 제약을 유지하고 hydration guard를 제거.

## Outcome

- Status: **Toast · Modal · BottomSheet 구현 완료** (순수 UI + store + App* 렌더링 + Storybook).
- Follow-up: Toast success/error 색상 시안, store unit test, iOS safe-area 실기기 검증, admin 오버레이 설계
