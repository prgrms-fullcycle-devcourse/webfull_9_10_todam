---
description: 오늘 ai_logs로 Daily Scrum 요약 생성 후 Notion Daily Scrum DB에 작성
---

오늘(KST) AI 작업로그를 요약해 Notion Daily Scrum DB에 작성한다.
특정 날짜를 요약하려면 인자로 `YYYY-MM-DD`를 받는다 (`$ARGUMENTS`).

## 절차

1. **로그 수집**
   `node .claude/scripts/scrum-fetch.mjs $ARGUMENTS` 실행.
   → `{ date, count, logs[] }` JSON 반환. `logs`는 시간순(asc).
   count가 0이면 "해당 날짜 로그 없음" 보고하고 중단.

2. **feature 어휘 로드**
   `.claude/context/features.md`를 읽어 분류 어휘(통제 목록) 확보.

3. **분석**
   - `metadata.session_id` + `created_at`으로 `UserPromptSubmit`(입력) → `Stop`(결과)을 묶어 작업 흐름 재구성.
   - `metadata.branch` + `content`로 feature/진행도 추론 (반드시 features.md 목록 중 하나, 모호하면 unknown).
   - `user_name`별로 누가 무엇을 했는지 정리.

4. **요약 구성** — 아래 JSON 형태로 만든다:
   ```json
   {
     "date": "YYYY-MM-DD",
     "summary": "사람별·기능별 작업 내용과 진행도. 어제 대비 어디까지 왔는지 팀이 싱크 맞출 수 있게.",
     "decisions": "내려진 결정사항 (설계/도메인 변경 등). 없으면 '없음'.",
     "issues": "이슈·블로커·미해결 질문. 없으면 '없음'.",
     "contributors": ["참여자 user_name 배열"]
   }
   ```
   summary는 기능(feature)별로 묶어 서술. 진행도가 드러나야 함 (예: "reservation: 예약 상세 UI 완료, API 연동 진행 중").

5. **Notion 작성**
   위 JSON을 stdin으로 전달:
   `echo '<JSON>' | node .claude/scripts/scrum-write.mjs`
   (긴 JSON은 임시파일에 쓴 뒤 `node .claude/scripts/scrum-write.mjs < /tmp/scrum.json` 사용)

6. 작성된 Notion URL을 사용자에게 보고.

## 주의
- 토큰/키는 스크립트가 `.env`에서 직접 읽으므로 명령 본문이나 출력에 노출하지 말 것.
- 로그 content에 민감정보(토큰 등)가 섞여 있으면 요약에 포함하지 말 것.
