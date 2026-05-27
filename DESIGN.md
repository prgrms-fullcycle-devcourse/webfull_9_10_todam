# DESIGN.md

UI 작업 전 반드시 읽는다. 이 문서와 코드가 어긋나면 멈추고 확인한다. 규칙이 바뀌면 이 문서도 함께 갱신한다.

## 컬러 규칙

- 1순위 semantic 토큰, 2순위 primitives 토큰. 그 외는 사용 금지.
- 원시 hex, 정의되지 않은 Tailwind 기본 팔레트는 사용하지 않는다.
- **추측하지 않는다.** 두 계층에 없으면 코딩을 멈추고 작업자에게 요청한다.

## 사이즈·간격 규칙

- 컬러를 제외한 sizing / gap / padding / radius는 Tailwind 기본 스케일만 쓴다.
- 커스텀 토큰을 만들지 않는다. arbitrary value(`h-[57px]` 등)도 쓰지 않는다.
- 스펙이 기본 스케일에 맞지 않으면 작업자에게 확인한다.

## 컴포넌트 props 규칙

Figma variant property를 기준으로 props를 설계하되 두 가지를 구분한다.

- `style`, `type`, `size` 같은 **디자인 선택값** → props
- `hover`, `active`, `focus`, `disabled`, `pressed` 같은 **상호작용 상태** → props 금지

상호작용 상태는 HTML native 상태와 Tailwind state variant(`hover:`, `focus-visible:`, `active:`, `disabled:`)로만 스타일링한다. `disabled`는 native HTML 속성으로 전달한다.

## 작업 시작 조건

아래가 모두 확보되지 않으면 코딩을 시작하지 않는다.

- [ ] variant 각 축의 정확한 enum 값
- [ ] size별 height / padding / gap / radius
- [ ] 상태별(hover·pressed·disabled 등) 컬러 토큰 규칙

## 컴포넌트 작업 후 Storybook 등록 규칙

`packages/ui`에 컴포넌트를 추가하거나 수정한 뒤 반드시 아래를 수행한다.

- `apps/storybook/src/stories/{ComponentName}.stories.tsx` 파일을 생성한다.
- 스토리는 컴포넌트의 모든 variant · size · 상태(disabled 포함)를 각각 Story로 분리한다.
- 스토리 제목은 `"Components/{ComponentName}"` 형식을 따른다.
- 아이콘은 `Design System/Icons`, 컬러토큰은 `Design System/Colors`로 이미 등록되어 있으므로 별도 추가 불필요.
