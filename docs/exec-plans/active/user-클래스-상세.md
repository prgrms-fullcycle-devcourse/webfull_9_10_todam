# Feature Plan: 게스트 및 유저 클래스 자세히보기

## Summary

- Goal: Guest 및 인증 User가 공방의 특정 클래스(프로그램) 상세 정보를 조회하고, 리뷰 목록을 확인하며, 예약 가능 여부(예약 버튼 활성/비활성)를 파악할 수 있는 화면을 제공한다.
- Owner:
- Date: 2026-06-02

## Status

<!--
게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제).
각 항목 체크 기준:
- API 구현: 실 BE(`apps/api`) 엔드포인트가 contract대로 존재·동작. MSW mock만 있으면 미체크.
- UI 구현: 화면/컴포넌트 구현 완료.
- API 연동: **실 API** 요청/응답이 contract 스키마로 연결. MSW mock 바인딩만 한 상태는 미체크(연동 아님).
-->

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): docs/requirements.md — `# 클래스 class` 섹션, `# 리뷰 review` 섹션
- 기능명세: "클래스 자세히보기" (기능명세 DB `b242ee66b06c8349805601ce4a05247a` — FE 작업 必)
- API명세 (API명세 DB `5852ee66b06c838bb8ec01c6bf4f2e25` — BE 작업 必):
  - `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭)
  - `GET /stores/{slug}/programs/{programId}/reviews` — 프로그램 리뷰 목록
  - `GET /programs/{programId}/available-slots` — 예약 가능 시간 조회 (고객용 달력, User 인증 필요)
- Relevant design docs: DESIGN.md 작업 시작 조건 확인 필요 (UI 규칙 섹션 참고)
- Open decisions:
  - [Q1] `/programs/{programId}/available-slots`는 `Authorization: Bearer {accessToken}` 필수다. Guest는 예약 버튼 CTA만 보여주고 슬롯 조회는 로그인 후 진행하는지, 아니면 비인증 상태에서도 달력을 미리 보여줄지 결정 필요.
  - [Q2·해소 2026-06-05] `deliveryOption`(3값 enum) 폐기 — DB엔 `deliverable: boolean`만 존재. 화면 "작품 수령 방법"은 deliverable로 렌더(true→"택배·직접수령", false→"직접 수령"). 화면 확인 완료.
  - [Q3·해소 2026-06-05] 비ACTIVE(DRAFT/INACTIVE) 클래스 퍼블릭 접근 → 현 구현은 `status:'ACTIVE'` 필터로 미존재 취급 → 404 `PROGRAM_NOT_FOUND`. (확정)
  - [Q4] 리뷰 목록 화면에 사진 썸네일이 있을 때 원본 이미지 라이트박스 기능 포함 범위 확인 필요.

## API Contract (스냅샷)

<!-- planner가 Notion API명세를 읽어 여기에 고정. BE/FE/reviewer가 바인딩하는 SSOT.
     Notion 원본이 바뀌면 재plan → 이 섹션 diff로 추적. -->

### 데이터 모델

**Program (클래스 상세)**
```typescript
{
  id: string;              // UUID
  storeId: string;         // UUID
  title: string;           // 클래스명
  description: string | null;  // 클래스 소개 (DB nullable)
  materials: string | null;    // 준비물 (DB nullable)
  caution: string | null;      // 유의사항 (DB nullable)
  price: number;           // 가격 (원 단위, 양의 정수)
  durationMinutes: number; // 소요시간 (분)
  capacity: number | null; // 정원 — 출처: Store.maxCapacityPerSlot (공방 슬롯 정원, Int? nullable). 화면 "정원 최대 N명". 퍼블릭 상세에만 포함
  leadTimeDays: number;    // 평균 제작 기간 (일)
  difficulty: "BASIC" | "INTERMEDIATE" | "ADVANCED";  // 난이도 태그 ("기본"/"중급"/"고급")
  childFriendly: boolean;  // "어린이 가능" 태그
  deliverable: boolean;    // "배송 가능" 태그 — 수령방법 true→"택배·직접수령" / false→"직접 수령"
  status: "ACTIVE";        // 퍼블릭 조회 시 ACTIVE만 반환
  images: Array<{
    imageUrl: string;
    thumbnailUrl: string | null;
  }>;
}
// deliveryOption(3값 enum) 폐기 → deliverable(boolean)로 대체 (화면이 boolean으로 충분)
```

**Review**
```typescript
{
  id: string;              // UUID
  userId: string;          // UUID
  nickname: string;        // 작성자 닉네임
  rating: number;          // 1~5
  content: string;         // 리뷰 본문 (최대 500자)
  photos: Array<{
    thumbnailUrl: string;  // 240x240 썸네일
  }>;
  createdAt: string;       // ISO 8601
}
```

**TimeSlot (예약 가능 시간)**
```typescript
{
  slotId: string;          // UUID (StoreTimeSlot.id)
  startAt: string;         // ISO 8601
  endAt: string;           // ISO 8601
  reservedCount: number;   // 예약된 인원
  remainingCount: number;  // 잔여 정원 = Store.maxCapacityPerSlot - reservedCount
  status: "OPEN" | "CLOSED" | "CANCELED";   // CANCELED 추가
  isAvailable: boolean;    // 이 프로그램으로 예약 가능 = OPEN && !ReservationRestriction(programId) && remainingCount>0
}
// capacity(슬롯 정원) 폐기 — 슬롯엔 정원 없음(공방 단위 maxCapacityPerSlot). 슬롯 = 파트너가 미리 생성한 StoreTimeSlot row
```

---

### 엔드포인트

#### 1. `GET /stores/{slug}/programs/{programId}` — 프로그램 상세 (퍼블릭)

**인증**: 불필요 (Guest 포함 모든 사용자)

**Request**
```
GET /stores/{slug}/programs/{programId}
Accept: application/json

Path Parameters:
  slug: string        // 공방 슬러그
  programId: string   // 프로그램 UUID
```

**Response 200 OK**
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:50:00.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001",
  "message": "클래스 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "storeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "물레 체험 기초반",
      "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
      "materials": "앞치마 (공방 제공), 편한 복장",
      "caution": "체험 당일 취소는 불가합니다.",
      "price": 45000,
      "durationMinutes": 120,
      "capacity": 4,
      "leadTimeDays": 30,
      "difficulty": "BASIC",
      "childFriendly": true,
      "deliverable": true,
      "status": "ACTIVE",
      "images": [
        {
          "imageUrl": "https://cdn.todam.app/programs/prog-uuid-001/01.jpg",
          "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/01_thumb.jpg"
        }
      ]
    }
  },
  "error": null
}
```

**Response 404 Not Found**
```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:50:03.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001",
  "message": "클래스를 찾을 수 없습니다.",
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```

**Response 500 Internal Server Error**
```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:50:08.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001",
  "message": "프로그램 상세 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

#### 2. `GET /stores/{slug}/programs/{programId}/reviews` — 프로그램 리뷰 목록

**인증**: 불필요 (Guest 포함 모든 사용자)

**Request**
```
GET /stores/{slug}/programs/{programId}/reviews
Accept: application/json

Path Parameters:
  slug: string        // 공방 슬러그
  programId: string   // 프로그램 UUID

Query Parameters:
  page: number        // 페이지 번호 (기본값: 1)
  limit: number       // 페이지당 항목 수 (기본값: 10)
  sort: "latest" | "rating_high"  // 기본값: "latest"
```

**Response 200 OK**
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:20:00.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
  "message": "리뷰 목록이 성공적으로 조회되었습니다.",
  "data": {
    "totalCount": 24,
    "averageRating": 4.7,
    "reviews": [
      {
        "id": "review-uuid-001",
        "userId": "user-uuid-001",
        "nickname": "토담이",
        "rating": 5,
        "content": "정말 즐거운 체험이었습니다. 작품도 예쁘게 완성되었어요!",
        "photos": [
          {
            "thumbnailUrl": "https://cdn.todam.app/reviews/review-uuid-001/01_thumb.jpg"
          }
        ],
        "createdAt": "2026-05-10T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "limit": 10
    }
  },
  "error": null
}
```

**Response 404 Not Found**
```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T19:20:03.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
  "message": "프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```

---

#### 3. `GET /programs/{programId}/available-slots` — 예약 가능 시간 조회

**인증**: 필요 (`Authorization: Bearer {accessToken}`) — User 이상

**Request**
```
GET /programs/{programId}/available-slots
Accept: application/json
Authorization: Bearer {accessToken}

Path Parameters:
  programId: string   // 프로그램 UUID

Query Parameters:
  year: number        // 조회 연도 (예: 2026)
  month: number       // 조회 월 (예: 6)
```

**Response 200 OK**
```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:55:00.000Z",
  "path": "/programs/prog-uuid-001/available-slots",
  "message": "예약 가능 시간 목록이 성공적으로 조회되었습니다.",
  "data": {
    "slots": [
      {
        "slotId": "slot-uuid-001",
        "startAt": "2026-06-01T10:00:00.000Z",
        "endAt": "2026-06-01T12:00:00.000Z",
        "reservedCount": 2,
        "remainingCount": 2,
        "status": "OPEN",
        "isAvailable": true
      },
      {
        "slotId": "slot-uuid-002",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "reservedCount": 4,
        "remainingCount": 0,
        "status": "OPEN",
        "isAvailable": false
      }
    ]
  },
  "error": null
}
```

**Response 404 Not Found**
```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:55:03.000Z",
  "path": "/programs/prog-uuid-001/available-slots",
  "message": "프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```

---

## Scope

### In
- `GET /stores/{slug}/programs/{programId}` — 클래스 상세 정보 API 구현
- `GET /stores/{slug}/programs/{programId}/reviews` — 클래스 리뷰 목록 API 구현 (페이지네이션, 정렬)
- `GET /programs/{programId}/available-slots` — 예약 가능 시간 슬롯 API 구현 (AuthGuard)
- 클래스 상세 UI 화면 구현:
  - 클래스 이미지 (캐러셀 또는 단일 이미지)
  - 클래스 기본 정보 (클래스명, 가격, 소요시간, 정원, 평균 제작 기간)
  - 카테고리 정보 태그 (기본 / 개인 가능 / 배송 가능)
  - 작품 수령 방법 표시 (`deliverable` boolean → true "택배·직접수령" / false "직접 수령")
  - 클래스 소개, 체험 안내 (준비물, 유의사항)
  - 리뷰 요약 (평균 별점, 리뷰 수) + 리뷰 목록 미리보기 (최대 3건)
  - "리뷰 전체보기" 링크 (클래스 리뷰 전체보기 화면으로 이동)
  - 예약하기 CTA 버튼 (Guest: 로그인 유도 / User: 예약 화면으로 이동)
- MSW mock handler 등록 (개발·테스트용)
- 실 API 연동 (BE 완료 후)

### Out
- 예약하기 화면 구현 (별도 기능: 예약 신청)
- 클래스 리뷰 전체보기 화면 구현 (별도 기능: 클래스 리뷰 전체보기)
- 파트너 전용 클래스 상세 (별도 기능: 클래스 상세 조회)
- 리뷰 작성/수정/삭제 기능
- 공방 찜 기능
- 배송 현황 실시간 추적 (MVP 외)
- 리뷰 답글, 리뷰 신고 (MVP 외)

## Plan

### BE

1. **`GET /stores/{slug}/programs/{programId}` 구현**
   - `slug`로 `PUBLISHED` 상태 공방 조회, 없으면 404
   - `programId`로 `ACTIVE` 상태 프로그램 조회, 없으면 404 (INACTIVE 포함 비활성 상태 404 처리 — Open Decision Q3 해소 후 확정)
   - 프로그램 이미지 목록 함께 조회 (`JOIN` 또는 `SELECT`)
   - 가드: 없음 (공개 엔드포인트)

2. **`GET /stores/{slug}/programs/{programId}/reviews` 구현**
   - `slug` + `programId` 유효성 검증 후 해당 프로그램의 리뷰 목록 조회
   - `totalCount`, `averageRating` 집계 함께 반환
   - `sort` 파라미터로 `latest`(createdAt DESC) / `rating_high`(rating DESC, createdAt DESC) 정렬 처리
   - cursor 없이 offset 페이지네이션 적용 (`page`, `limit`)
   - 가드: 없음 (공개 엔드포인트)

3. **`GET /programs/{programId}/available-slots` 구현**
   - `AuthGuard` 적용 (User 이상)
   - `programId`로 소속 store 해석 + 프로그램 ACTIVE 검증 (미존재/비ACTIVE → 404 `PROGRAM_NOT_FOUND`)
   - `year`, `month` → KST 일범위 변환(`kstDayRange` 재사용) → 해당 store의 `StoreTimeSlot` 조회 (파트너 사전생성 row 읽기, 즉석 계산 아님)
   - `ReservationRestriction(storeId, startAt, programId)` 대조로 프로그램별 제한 판별
   - `remainingCount = Store.maxCapacityPerSlot - reservedCount`
   - `isAvailable = status==OPEN && !restricted && remainingCount>0` (restricted/CANCELED/full → false, FE 회색 처리)
   - 구현: timeslot DDD 포트 재사용(`StoreTimeSlotRepository.findByStore`, `ReservationRestrictionRepository.findByStartAts`) — **#180 머지 후**. 단 program→store 공개 read는 추가 필요(taesong 조율)

### FE

4. **MSW mock handler 등록**
   - `GET /stores/:slug/programs/:programId` mock 응답
   - `GET /stores/:slug/programs/:programId/reviews` mock 응답 (페이지네이션 포함)
   - `GET /programs/:programId/available-slots` mock 응답 (인증 상태 분기)

5. **API 클라이언트 함수 작성**
   - `fetchProgramDetail(slug, programId)` — 인증 불필요
   - `fetchProgramReviews(slug, programId, params: { page, limit, sort })` — 인증 불필요
   - `fetchAvailableSlots(programId, params: { year, month })` — 인증 필요, 미인증 시 로그인 유도 처리

6. **UI: DESIGN.md 준수**
   - DESIGN.md "작업 시작 조건"의 variant enum, size별 height/padding/gap/radius, 상태별 토큰 확인 후 구현
   - 클래스 상세 화면 레이아웃 구현:
     - 이미지 영역 (단일 또는 캐러셀)
     - 기본 정보 섹션 (제목, 가격, 소요시간, 정원, 리드타임)
     - 카테고리/수령방법 태그 섹션
     - 클래스 소개 / 체험 안내 / 유의사항 섹션
     - 리뷰 요약 + 리뷰 카드 목록 (최대 3건 미리보기)
     - "리뷰 전체보기" 이동 링크
   - 예약하기 CTA 버튼:
     - Guest: 클릭 시 로그인 화면으로 이동 (or 로그인 모달)
     - User (본인 공방 제외): 예약 신청 화면으로 이동
     - User (본인 공방의 Partner): 버튼 비활성화 (요구사항: 자기거래 차단)

7. **실 API 연동 (BE 완료 후)**
   - MSW mock를 실 API 호출로 교체
   - 응답 스키마 검증 (zod 또는 타입 가드)
   - 에러 상태 처리 (404 → 404 페이지, 500 → 에러 메시지 토스트)

## Out (단계별 완료물)

- API:
  - `GET /stores/{slug}/programs/{programId}` 엔드포인트
  - `GET /stores/{slug}/programs/{programId}/reviews` 엔드포인트
  - `GET /programs/{programId}/available-slots` 엔드포인트
- UI:
  - 클래스 상세 화면 (`/stores/[slug]/programs/[programId]` 또는 유사 라우트)
  - 리뷰 요약 + 리뷰 카드 컴포넌트
  - 예약하기 CTA 컴포넌트 (Guest/User 분기)
- 연동:
  - 실 API ↔ FE 화면 바인딩 검증

## Risks

- **슬롯 조회 인증 정책(Q1)**: Guest 상태에서 달력/슬롯 노출 범위 미결정. CTA 버튼 활성화 여부에 직접 영향.
- **정원(capacity) 출처 변경**: 정원이 Program이 아닌 `Store.maxCapacityPerSlot`로 이동(타임슬롯 마이그레이션). 상세 엔드포인트가 현재 이 값을 미반환 → 구현 추가 필요(cross-lane, program 모듈).
- **available-slots 구현 의존성(#180)**: timeslot DDD 포트 전환 머지 후 착수. program→store 공개 read 메서드는 추가 필요(taesong 조율).
- **리뷰 사진 원본 접근**: API 응답에 `thumbnailUrl`만 포함, `imageUrl`(원본) 없음. 라이트박스 기능이 필요한 경우 API 스키마 확장 필요(Q4).

## Validation

- Tests:
  - BE: 단위 테스트 — `PUBLISHED` 공방 + `ACTIVE` 프로그램 조합 / `404` 케이스(미존재, INACTIVE)
  - BE: 단위 테스트 — 리뷰 집계(`totalCount`, `averageRating`) 정확성, 정렬(`latest`/`rating_high`) 검증
  - BE: 단위 테스트 — 슬롯 계산 로직 (운영시간 + 휴게시간 + BlockedSlot 조합)
  - FE: 컴포넌트 테스트 — Guest/User 상태별 CTA 버튼 렌더링
- Manual checks:
  - Guest로 접근 시 클래스 상세 정상 조회
  - User로 접근 시 클래스 상세 + 예약하기 버튼 활성화
  - INACTIVE 클래스 URL 직접 접근 시 404 처리
  - 리뷰 없는 클래스의 평균 별점/리뷰 수 표시 (0건 처리)
  - 정렬(최신순/별점 높은 순) 동작
  - 페이지네이션 동작
- Observability:
  - 404 응답 모니터링 (INACTIVE 클래스 접근 빈도)

## Decision Log

- 2026-06-02: 기능명 "게스트 및 유저 클래스 자세히보기"는 Notion 기능명세 DB의 "클래스 자세히보기" (실행주체: guest, user)와 동일 기능으로 확인. 파트너 전용 "클래스 상세 조회"와 분리하여 계획.
- 2026-06-02: API 경로는 `/classes` 아닌 `/programs` 패턴 사용 확인 (API 명세 DB 기준).
- 2026-06-05: §1 상세 계약을 실제 구현/DB·화면(source of truth)에 맞춰 재정합. capacity 출처=Store.maxCapacityPerSlot(★구현 추가 필요), deliveryOption enum→deliverable boolean, difficulty/childFriendly 추가, description/materials/caution/thumbnailUrl nullable, message "클래스" 기준. reviewer 대조 결과 기반. → Notion API 명세서 동일 갱신 **완료(2026-06-05)**.
- 2026-06-05: §3 available-slots 계약을 StoreTimeSlot 모델(#164)에 맞춰 재정합. capacity 필드 폐기, status에 CANCELED 추가, isAvailable 추가, remainingCount=maxCapacityPerSlot-reservedCount, 슬롯=파트너 사전생성 row. 구현은 timeslot DDD 포트(#180) 재사용 + program→store 공개 read 추가 필요. → Notion 동일 갱신 **완료(2026-06-05)**.

## Outcome

- Status: planning
- Follow-up:
  - Open Decision Q1~Q4 해소 후 Plan 6 (FE UI 구현) 착수
  - BE 엔드포인트 완료 후 Plan 7 (실 API 연동) 착수
  - "예약 신청" 기능 plan과 연계 (CTA 버튼 → 예약 플로우 진입점)
