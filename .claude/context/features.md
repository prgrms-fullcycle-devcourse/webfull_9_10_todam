# Feature 통제 어휘 (controlled vocabulary)

스크럼 요약 워크플로우가 `ai_logs`를 읽어 작업을 분류할 때 쓰는 **고정 feature 목록**.
LLM이 자유 라벨 뱉지 않도록 반드시 이 목록 중 하나로만 매핑. 애매하면 `unknown`.

## 추론 규칙 (우선순위)
1. **git branch** (`metadata.branch`) — 가장 강한 신호.
   예: `feature/reservation-detail` → `reservation`, `fix/auth-token` → `auth`
2. **content 키워드** — branch로 안 잡히면 프롬프트/응답 내용으로 매핑.
3. 둘 다 모호 → `unknown` (요약에 "분류 불가"로 표기).

## Feature 목록

| feature | 설명 | 키워드 예시 |
|---------|------|------------|
| `reservation` | 예약 도메인 | 예약, 일정, 슬롯, booking |
| `artwork` | 작품 도메인 | 작품, 등록, 상태필터, artwork |
| `store` | 공방/스토어 | 공방, 스토어, 등록, like, store |
| `class` | 클래스/수업 | 클래스, 수업, 강의, class |
| `review` | 리뷰 | 리뷰, 평점, review |
| `partner` | 파트너 온보딩 | 파트너, 온보딩, 입점, partner |
| `auth` | 인증/계정 | 로그인, 회원, 토큰, auth, session |
| `payment` | 결제 | 결제, 환불, payment, pay |
| `notification` | 알림 | 알림, 푸시, notification |
| `infra` | 인프라/공통 | 빌드, 배포, 모노레포, CI, FSD, storybook, infra |

## 비고
- 한 작업이 여러 feature 걸치면 가장 비중 큰 것 1개. 필요시 요약에 보조 feature 언급.
- 목록 추가/변경은 팀 합의 후 이 파일만 수정 (로그 스키마 불변).
