# Feature Plan: 파트너 공방 관리 - 공방 리스트 조회 (나의 공방 목록 조회)

## Summary

- Goal: 로그인한 파트너가 설정 > 공방 관리 진입 시 본인 소유 공방 전체를 상태와 함께 목록 조회한다.
- Owner: nogglee
- Date: 2026-06-01

## Context

<!-- 요구사항=docs/requirements.md. 기능/API명세=Notion DB에서 notion-fetch.mjs --find로 select. -->

- 요구사항명세서(고정): docs/requirements.md — `공방 store` 도메인(공방 상태/상태전이, 공방 조회), `partner` 도메인(파트너 상태), 접근 주체/가드(`AuthGuard + PartnerGuard`)
- 기능명세: `나의 공방 목록 조회` (기능명세 DB `b242ee66b06c8349805601ce4a05247a` 에서 select)
  - 실행주체: Partner / 도메인: partner / 연관화면: 설정
  - 표시: 공방명, 대표 이미지, 공방 주소, 사업자 승인 상태, 운영중 여부, 게시 상태(심사중/반려/게시중/게시중단), 현재 선택된 공방
  - 동작: 공방 상세 이동, 공방 등록 이동
  - 제한: 운영 권한 없는 공방 제외, 삭제 공방 제외, 빈 상태 화면, 네트워크 오류 처리
  - 정렬: 최신 생성순, 현재 선택 공방 강조
- API명세: `GET /partner/stores` (내 공방 목록 - 파트너센터). 상세 이동 대상은 별도 기능(`GET /partner/stores/{storeId}`), 등록 이동은 별도 기능(첫/추가 공방 등록) — 본 plan 범위 밖.
- Relevant design docs: DESIGN.md (작업 시작 조건 — variant enum / size별 토큰 / 상태별 컬러 토큰)
- Open decisions:
  - (UI-1) 게시 상태 Badge 컴포넌트: variant enum(`DRAFT|PENDING|PUBLISHED|REJECTED|SUSPENDED` → 심사중/반려/게시중/게시중단 라벨 매핑)과 상태별 컬러 토큰이 DESIGN.md/Figma에 미확정. 확보 전 코딩 시작 금지.
  - (UI-2) 공방 카드 컴포넌트의 size별 height/padding/gap/radius 토큰 미확정.
  - (UI-3) 빈 상태(empty) 화면 카피/일러스트 미확정.
  - (CONTRACT-1) 기능명세의 "사업자 승인 상태"가 API 응답에 별도 필드로 없음. 현재 `GET /partner/stores`는 store `status`만 반환(파트너 승인상태 아님). "사업자 승인 상태" 표시를 store.status로 갈음할지, partner.status를 별도 조회해 함께 표시할지 결정 필요. → 결정 전까지 store.status enum만 사용.
  - (CONTRACT-2) "현재 선택된 공방"(강조)은 클라이언트 선택 상태(`공방 전환` 기능 소관)이며 본 API 응답에 없음. 선택 공방 식별 출처(zustand/cookie/별도 API) 미확정 — 본 plan은 목록 조회만 다루고 강조는 후속.
  - (CONTRACT-3) API 응답 `data.stores`에 페이지네이션/총개수 필드 없음(전체 반환). 공방 다수 파트너 대비 페이징 필요 여부 확인.

## API Contract (스냅샷)

<!-- Notion API명세(5852ee66b06c838bb8ec01c6bf4f2e25)에서 그대로 옮겨 고정. BE/FE SSOT. -->

### 데이터모델 (응답 store 항목)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string(UUID) | 공방 ID |
| `name` | string | 공방명 |
| `slug` | string | 공방 슬러그 |
| `address` | string | 공방 주소 |
| `status` | enum | `DRAFT` \| `PENDING` \| `PUBLISHED` \| `REJECTED` \| `SUSPENDED` |
| `thumbnailUrl` | string(URL) | 대표 이미지 썸네일 |
| `publishedAt` | string(ISO8601) \| null | 게시 일시 |
| `createdAt` | string(ISO8601) | 생성 일시 (정렬 기준: 최신순) |

> store.status enum은 요구사항 공방 상태(DRAFT/PENDING/PUBLISHED/SUSPENDED)에 API명세가 `REJECTED`를 추가로 명시. 라벨 매핑: PENDING→심사중, REJECTED→반려, PUBLISHED→게시중, SUSPENDED→게시중단(DRAFT는 작성중).

### 엔드포인트

- `GET /partner/stores` — 내 공방 목록 (파트너센터)
  - 가드: `AuthGuard + PartnerGuard` (인증 토큰으로 파트너 capability 검증)
  - Request Headers: `Accept: application/json`, `Authorization: Bearer {accessToken}`
  - Request: path/query/body 없음
  - 시스템 처리: 요청자 식별 → partner capability 검증 → `stores` 테이블에서 `partner_id` 소속 공방 전체 조회 → 상태 무관 본인 소유 전부 반환
  - Response `200 OK`:
    ```json
    {
      "statusCode": 200,
      "timestamp": "2026-05-25T18:10:00.000Z",
      "path": "/partner/stores",
      "message": "내 공방 목록이 성공적으로 조회되었습니다.",
      "data": {
        "stores": [
          {
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "토담 공방",
            "slug": "todam-studio",
            "address": "서울특별시 성동구 성수이로 12길 34",
            "status": "PUBLISHED",
            "thumbnailUrl": "https://cdn.todam.app/stores/todam-studio/thumb.jpg",
            "publishedAt": "2026-05-20T10:00:00.000Z",
            "createdAt": "2026-05-18T12:00:00.000Z"
          }
        ]
      },
      "error": null
    }
    ```
  - 에러:
    - `401 UNAUTHORIZED` — "인증이 필요합니다."
    - `403 FORBIDDEN` — "파트너 권한이 필요합니다."
    - `500 INTERNAL_SERVER_ERROR` — "공방 목록 조회 중 서버 오류가 발생했습니다."
  - 공통 응답 봉투: `{ statusCode, timestamp, path, message, data, error }`

## Scope

- In:
  - BE: `GET /partner/stores` 구현(파트너 소유 공방 전체 조회, 최신 생성순 정렬, 삭제 공방 제외, 공통 응답 봉투).
  - UI: 공방 관리 목록 화면 — 공방 카드(이미지/이름/주소/게시상태 Badge), 빈 상태, 로딩/네트워크 오류 처리, 공방 상세/등록 진입 링크(라우팅만).
  - 연동: 목록 조회 API 바인딩(타입/쿼리 훅), 상태 enum → 라벨/Badge 매핑.
- Out:
  - 공방 상세 조회(`GET /partner/stores/{storeId}`) 화면.
  - 공방 등록 플로우(첫/추가 공방 등록).
  - "현재 선택된 공방" 전환 로직(`공방 전환` 기능) — 본 화면에서는 강조 표시만 후속 결정.
  - 파트너 승인 상태(partner.status) 별도 조회/표시 — CONTRACT-1 결정 후.

## Plan

1. (BE) `GET /partner/stores` 컨트롤러/서비스 구현: PartnerGuard 적용, `partner_id` 기준 조회, `deletedAt` 제외, `createdAt DESC` 정렬, 응답 DTO를 API Contract 스냅샷 스키마로 직렬화.
2. (UI) 공방 관리 목록 화면 + 공방 카드/게시상태 Badge/빈 상태 컴포넌트. UI-1~3 토큰 확보 전엔 mock으로 골격만, 토큰 확정 후 스타일 적용. DESIGN.md 준수.
3. (연동) 응답 타입 정의 + 조회 훅(react-query 등), status enum→라벨 매핑 유틸, 로딩/401·403·500/빈 배열 상태 처리. 상세·등록 라우팅 연결.

## Status

<!-- 게이트가 읽는 체크리스트. 셋 다 [x] 여야 completed/ 이동 가능 (pre-commit이 강제). -->

- [ ] API 구현
- [ ] UI 구현
- [ ] API 연동

## Out (단계별 완료물)

- API: <!-- 구현된 엔드포인트, 파일 -->
- UI: <!-- 구현된 화면, 컴포넌트 -->
- 연동: <!-- 연결 지점, 검증 결과 -->

## Risks

- CONTRACT-1: "사업자 승인 상태" 표시 의미가 store.status와 partner.status 중 무엇인지 미확정 → 잘못 바인딩 시 사용자 혼동.
- store.status에 `REJECTED`가 API명세에만 존재(요구사항 공방 상태 전이엔 DRAFT 반려로 기재) → enum 매핑 불일치 가능. 라벨 매핑 확정 필요.
- 페이지네이션 부재 — 공방 다수 파트너에서 응답 비대 가능(CONTRACT-3).

## Validation

- Tests: BE 서비스 단위(소유 공방만/정렬/삭제 제외), 가드(401·403) e2e. FE enum→라벨 매핑 단위, 빈 상태/에러 상태 렌더 테스트.
- Manual checks: 파트너 토큰으로 목록 조회, 비파트너 토큰 403, 공방 0개 빈 상태, 네트워크 차단 시 오류 UI.
- Observability: 조회 실패(500) 로깅.

## Decision Log

- 기능명 `파트너 공방 관리 - 공방 리스트 조회`는 기능명세 DB에 정확 일치 없음 → 후보 중 `나의 공방 목록 조회`로 매칭(실행주체 partner, 연관화면 설정, 표시 항목 일치). API는 `GET /partner/stores`로 확정.

## Outcome

- Status:
- Follow-up:
