---
description: 어제 ai_logs로 Daily Scrum 요약 생성 후 Notion Daily Scrum DB에 작성
---

어제(KST) AI 작업로그를 요약해 Notion Daily Scrum DB에 작성한다 (아침 스크럼 기준).
특정 날짜를 요약하려면 인자로 `YYYY-MM-DD`를 받는다 (`$ARGUMENTS`).

## 절차

1. **로그 수집**
   `node .claude/scripts/scrum-fetch.mjs $ARGUMENTS` 실행. (인자 없으면 어제 KST)
   → `{ date, count, logs[] }` JSON 반환. `logs`는 시간순(asc).
   count가 0이면 "해당 날짜 로그 없음" 보고하고 중단.

2. **feature 어휘 로드**
   `.claude/context/features.md`를 읽어 분류 어휘(통제 목록) 확보.

3. **분석**
   - `metadata.session_id` + `created_at`으로 `UserPromptSubmit`(입력) → `Stop`(결과)을 묶어 작업 흐름 재구성.
   - `metadata.branch` + `content`로 feature/진행도 추론 (반드시 features.md 목록 중 하나, 모호하면 unknown).
   - **도메인(feature)별로 변경사항을 묶어 추적** — 무엇이 추가/수정/완료/진행 중인지. 누가 했는지(contributor)는 다루지 말 것.

4. **요약 구성** — 아래 JSON 형태로 만든다:
   ```json
   {
     "date": "YYYY-MM-DD",
     "summary": "초압축 한 줄 (Notion Summary 컬럼용). 어제 어디까지 갔나 중심. 예: '클래스 상세 UI 끝, API 연동 남음 · 작품 상세 FE 완료'",
     "features": ["추론한 feature 배열, features.md 어휘만. 여러 개 가능. 모호하면 unknown"],
     "body_markdown": "## 오늘 할 일\n- 도메인별로 오늘 이어서 할 액션. 우선순위 높은 것 위로. '뭘 하면 되는지' 한눈에 들어오게 구체적인 동사로\n\n## 어제 한 일\n- 도메인별로 끝낸 것/진행한 것 (오늘 할 일의 배경)\n\n## 막힌 것·주의\n- 블로커, 충돌 위험, 빠뜨리면 안 되는 것 (없으면 '없음')"
   }
   ```
   - **목적**: 아침에 출근해서 이거 한 장 보면 오늘 뭐부터 할지 바로 잡히게. 회고용 아님 — **오늘 할 일이 메인**, 어제 한 일은 배경.
   - **백틱(`code`)·코드표기 쓰지 말 것** — Notion에서 인라인 코드 안 먹어 백틱 문자 그대로 노출됨. 파일명·API 경로·심볼도 그냥 평문으로 (예: GET /partner/programs, ProgramDifficulty).
   - 말투는 **구어체로 눈에 잘 들어오게**. 딱딱한 명사 나열 말고 "~하면 됨", "~부터 보기" 식.
   - contributor 필드 없음 — 참여자는 DB(`ai_logs.user_name`)에만 수집, 요약/Notion엔 넣지 말 것. 사람 이름 넣지 말 것.
   - `summary`: **아주 짧게** 한 줄.
   - `body_markdown`: **도메인(feature)별로 묶어** 진행도 드러나게.
   - 지원 마크다운: `#`/`##`/`###` 제목, `-`/`*` 불릿, `1.` 넘버, 일반 문단, `**굵게**`. (백틱 코드 미지원)

5. **Notion 작성**
   JSON을 임시파일에 쓴 뒤 stdin 전달:
   `node .claude/scripts/scrum-write.mjs < /tmp/scrum.json`

6. 작성된 Notion URL을 사용자에게 보고.

## 주의
- 토큰/키는 스크립트가 `.env`에서 직접 읽으므로 명령 본문이나 출력에 노출하지 말 것.
- 로그 content에 민감정보(토큰 등)가 섞여 있으면 요약에 포함하지 말 것.
