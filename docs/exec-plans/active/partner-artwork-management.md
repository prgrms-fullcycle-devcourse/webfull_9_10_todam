# Feature Plan: 파트너 작품 관리

## Summary

- Goal: 승인된 파트너가 현재 선택한 공방의 작품을 상태 그룹/세부 상태로 조회하고, 작품 상세에서 제작 단계·사진·예약/수령 정보를 확인하며, 순차 상태 변경·사진 업로드·배송/픽업 처리를 수행한다.
- Owner: FE / BE 미정
- Date: 2026-06-08

## Status

- [x] API 구현
- [ ] UI 구현
- [ ] API 연동

## Context

- 요구사항명세서(고정): `docs/requirements.md`
  - 접근 주체: `Partner.status = APPROVED`, `AuthGuard + PartnerGuard`, 작품이 속한 공방 소유권 검증.
  - `artwork` §1 상태 전이, §3 상태 변경, §5 작품 관리 조회, §6 사진 업로드.
  - `reservation` §8 배송 처리. 작품 제작 완료 후 수령 흐름은 `Reservation.status`가 담당한다.
- 기능명세 DB 조회(2026-06-08):
  - `작품 목록 조회`, `작품 상태 그룹 및 필터 적용`, 파트너용 `작품 상세 조회`, `작품 이미지 업로드`, `초벌 시작 처리`, `배송 시작 처리`, `작품 배송 정보 업데이트`.
- API명세 DB 조회(2026-06-08):
  - `GET /partner/stores/{storeId}/artworks`
  - `GET /partner/artworks/count-by-step`
  - `GET /partner/artworks/{artworkId}`
  - `PATCH /partner/artworks/{artworkId}/status`
  - `POST /partner/artworks/{artworkId}/photos`
  - `PATCH /partner/artworks/{artworkId}/delivery`
- API명세 DB 신규 등록 필요:
  - `POST /partner/artworks/{artworkId}/photos/{photoId}/confirm`
  - `DELETE /partner/artworks/{artworkId}/photos/{photoId}`
  - `PATCH /partner/artworks/bulk-status`
  - `PATCH /partner/artworks/{artworkId}/delivery-info`
- 연관 plan:
  - `docs/exec-plans/active/partner-reservation-management.md` — 예약 확정/체험 완료로 Artwork 생성 및 `VISITED` 전이.
  - `docs/exec-plans/active/stepper-media-upload.md` — 미디어 업로드 공통 설계.
  - `docs/exec-plans/active/유저 예약 - 작품 상세 조회.md` — 고객용 작품 타임라인 계약.
- Figma 정본 확인(2026-06-08):
  - `작품 관리 - 리스트 조회.svg`, `Artwork.svg`
  - `작품 관리 - 상세 조회.svg`, `ArtworkDetail.svg`
  - `작품 관리 - 배송 정보.svg`, `ArtworkDeliveryInfo.svg`
  - 목록/상세/배송정보 화면 흐름과 표시 필드, CTA 분기를 본 plan에 반영했다.
- 추가 운영 시안 확인(2026-06-08):
  - COMPLETED 직후 택배/직접수령 운영 상세 분기.
  - 운송장 입력·확인·배송 시작, 픽업 준비/완료 처리 흐름.
  - 작품 목록 다중 선택 및 일괄 공정 변경 흐름.
- 현재 구현 상태:
  - `apps/api/src/modules/artwork/`는 `.gitkeep`만 있는 스캐폴드로 파트너 작품 API는 미구현.
  - `apps/web/src/app/partner/artworks/page.tsx`, `[id]/page.tsx`는 placeholder.
  - Prisma에는 `Artwork`, `ArtworkLog`, `ArtworkPhoto`, `Delivery`, `QrToken` 모델이 존재한다.

## Open Decisions

- ~~**D1 상태 그룹 세부 매핑**~~ **해소:** 서버가 `Artwork.status + Reservation.status + deliveryMethod`를 조합해 `statusGroup`과 `detailStatus`를 계산한다. 기본 그룹은 `IN_PROGRESS(제작 중)`이며 그룹 변경 바텀시트에서 `WAITING(제작 대기) | IN_PROGRESS(제작 중) | RECEIVING(수령 대기) | RECEIVED(수령 완료)` 중 단일 선택한다. 매핑:
  - `WAITING`: Artwork `RESERVED | VISITED` → `RESERVED(예약 확정) | VISITED(체험 완료)`
  - `IN_PROGRESS`: Artwork `DRYING | BISQUE_FIRING | GLAZING | GLAZE_FIRING` → `건조 | 초벌 | 유약 | 재벌`
  - `RECEIVING`: Artwork `COMPLETED` 또는 Reservation `SHIPPED | PICKUP_READY` → deliveryMethod에 따라 `DELIVERY_READY(배송 준비) | SHIPPED(배송 중) | PICKUP_READY(픽업 가능)`
  - `RECEIVED`: Reservation `DELIVERED | PICKUP_DONE` → `DELIVERED(배송 완료) | PICKUP_DONE(픽업 완료)`
  - Artwork `CANCELED` 및 Reservation `CANCELED`은 모든 그룹/카운트/목록에서 제외한다.
- ~~**D2 목록 표시 필드**~~ **해소(Figma):** 카드에는 `체험일(월.일+요일)`, `클래스명`, `예약자명 + 외 N명`, `수령 방식`, `현재 세부 단계 badge`를 표시한다. 이미지/예상 완성일은 카드에 표시하지 않는다. 정본 목록 API에 `scheduledAt`, `programTitle`, `participantCount`, `deliveryMethod`, `reservationStatus`, `statusGroup`, `detailStatus` 추가가 필요하다.
- ~~**D3 상태 그룹/단계 카운트 API**~~ **해소:** 기존 `GET /partner/artworks/count-by-step`을 확장한다. `storeId`와 선택 `group`을 받아 해당 그룹의 단계별 count를 반환하며, 작품 관리 상단 count chip의 SSOT로 사용한다. 대시보드의 기존 제작 중 4단계 응답과의 하위 호환 방식은 API 구현 시 확정한다.
- ~~**D4 상세 표시 계약**~~ **해소(Figma):** 상세는 전체 타임라인과 단계별 날짜/사진을 표시하고 현재 단계를 활성화한다. 상단 수령 방식 카드, 하단 `예약 정보` + 현재 상태별 CTA를 노출한다. 예약정보 바텀시트는 클래스명, 예약번호, 날짜, 시간, 인원, 예약자, 연락처, 내부 메모를 표시한다. 정본 상세 API에 `deliveryMethod`, `timeline[]`, `reservation`, `availableAction` 추가가 필요하다.
- ~~**D5 내부 메모 표시 위치**~~ **해소(Figma):** 상세의 `예약 정보` 바텀시트에 노출되는 내부 메모는 `Reservation.internalMemo`다. `Artwork.internalMemo`는 현재 Figma에 노출 지점이 없으므로 본 UI 범위에서 제외한다.
- ~~**D6 사진 업로드/삭제 연결**~~ **해소:** 상태 변경 1회마다 `ArtworkLog` 1개를 생성하고, 해당 단계 사진 여러 장은 동일한 `ArtworkLog.id`를 참조한다(`ArtworkLog 1:N ArtworkPhoto`). 상세 응답의 현재 단계에 `artworkLogId`를 포함하며 클라이언트는 presign 요청에 이를 전달한다. 서버는 로그가 해당 작품 소속인지, 작품의 현재 단계 로그인지, 해당 로그의 `PENDING + UPLOADED` 사진 합계가 최대 5장 이하인지 검증한다. confirm은 presign 시 연결된 로그를 유지한다. 사진 삭제는 파트너가 소유한 작품의 사진에 허용하고 DB 삭제 후 S3 삭제 작업을 등록한다.
- ~~**D7 업로드 완료 확인**~~ **해소:** S3 PUT 성공 후 사진별 confirm API를 호출하여 `ArtworkPhoto.status`를 `PENDING → UPLOADED`로 전이한다. confirm 시 업로드 객체 존재 여부와 소유권을 검증하고 이미지 후처리 작업을 등록한다. 24시간 이상 confirm되지 않은 `PENDING` row는 worker가 정리한다.
- ~~**D8 파트너 수령 정보 수정 API**~~ **해소:** 예약 생성 시 저장된 `Reservation.deliveryMethod`를 기본 선택값으로 표시하며, 파트너는 예약 이후에도 작품 화면에서 수령 방식을 변경할 수 있다. 변경은 배송/픽업 처리가 시작되기 전(`Reservation.status`가 `SHIPPED | DELIVERED | PICKUP_READY | PICKUP_DONE`이 아님)에만 허용한다. `DELIVERY → PICKUP` 변경 시 기존 Delivery 주소/운송장 정보는 삭제하지 않고 보존하되 배송 처리에는 사용하지 않는다. `PICKUP → DELIVERY` 변경 시 배송 필수 정보 입력을 요구한다. 파트너 전용 `PATCH /partner/artworks/{artworkId}/delivery-info`를 사용한다. 기존 `PATCH /reservations/{reservationId}/delivery`는 고객 배송지 정보 수정 API이며 `deliveryMethod`를 변경하지 않는다.
- ~~**D9 배송/픽업 액션 검증**~~ **해소:** `PATCH /partner/artworks/{artworkId}/delivery`는 action별 `deliveryMethod + Artwork.status + Reservation.status`를 함께 검증한다.
  - `SHIP`: `DELIVERY` + Artwork `COMPLETED` + Reservation `IN_PROGRESS` → Reservation `SHIPPED`. 수령인/주소/택배사/운송장/발송일 필수, 고객 배송 시작 알림, 발송 7일 후 자동 `DELIVERED` 작업 등록.
  - `PICKUP_READY`: `PICKUP` + Artwork `COMPLETED` + Reservation `IN_PROGRESS` → Reservation `PICKUP_READY`. 고객 픽업 가능 알림 발송.
  - `PICKUP_DONE`: `PICKUP` + Reservation `PICKUP_READY` → Reservation `PICKUP_DONE`. 되돌릴 수 없는 종료 처리.
  - `DELIVERED`: `DELIVERY` + Reservation `SHIPPED` → Reservation `DELIVERED`. 파트너 수동 배송 완료를 허용하고 자동 완료 작업을 취소한다. 되돌릴 수 없는 종료 처리.
  - 상태/수령 방식이 일치하지 않거나 동일 action을 중복 호출하면 `409 INVALID_RESERVATION_STATUS`.
- ~~**D10 상태 변경과 사진 원자성**~~ **해소(Figma):** 사진 등록은 단계별 독립 액션이며 상태 변경 CTA와 원자 작업으로 묶지 않는다. 상태 변경 후 상세 재조회 및 완료 토스트를 노출한다.
- ~~**D11 예상 완성일 보정**~~ **해소:** MVP에서는 자동 보정을 제외한다. Artwork 생성 시 `체험일 + Program.leadTimeDays`로 최초 계산한 값을 유지하며, 단계 정체에 따른 자동 변경과 파트너 수동 수정은 본 범위에서 제외한다. 단계별 표준 소요일 정책이 정의된 후 별도 worker 기능으로 재계획한다.
- ~~**D12 일괄 공정 변경 API**~~ **해소:** 동일 공방·동일 현재 단계 작품만 최대 50개 선택하여 다음 단계로만 일괄 변경한다. 일괄 되돌리기는 금지한다. 모든 항목을 먼저 검증하고 하나라도 실패하면 전체 롤백하는 단일 트랜잭션으로 처리하며 작품별 `ArtworkLog`를 생성한다. 동시 상태 변경은 `fromStatus` 비교로 감지하여 `409 ARTWORK_STATUS_CHANGED`를 반환한다.
- ~~**D13 배송사 enum/운송장 스캔**~~ **해소:** 서버는 배송사 enum `CJ_LOGISTICS | LOTTE | HANJIN | KOREA_POST | LOGEN | COUPANG_LOGISTICS`를 사용한다. 발송 가능한 고정 택배사만 선택하며 임의 택배사 입력은 제공하지 않는다. 운송장 번호는 문자열로 저장하며 FE가 공백/하이픈을 제거하고 서버가 숫자/길이를 검증한다. 바코드 스캔은 FE 입력 보조 기능으로만 제공하며 별도 API를 만들지 않고, 카메라 미지원/권한 거부 시 수동 입력을 제공한다.

## API Contract (스냅샷)

> 공통 응답 envelope는 `statusCode/timestamp/path/message/data/error`를 따른다. 아래는 2026-06-08 API명세 DB 정본이며, Open Decisions가 해소되기 전에는 부족한 필드를 임의 추가하지 않는다.

### 데이터모델

- `Artwork`: 예약과 1:1. `status`, `internalMemo`, `customerMemo`, `estimatedCompletedAt`.
- `ArtworkLog`: 상태 변경 감사 로그. `fromStatus`, `toStatus`, `changedBy`, `memo`, `createdAt`.
- `ArtworkPhoto`: `ArtworkLog`에 종속. `imageUrl`, `thumbnailUrl`, `status`.
- `Delivery`: 예약과 1:1. 수령인/주소/택배사/운송장/발송일.
- `ArtworkStatus`: `RESERVED → VISITED → DRYING → BISQUE_FIRING → GLAZING → GLAZE_FIRING → COMPLETED`; `CANCELED`는 종료 상태.
- 수령 이후 상태는 `ReservationStatus.SHIPPED | DELIVERED | PICKUP_READY | PICKUP_DONE`이 담당한다.
- 목록 가공 상태:
  - `ArtworkStatusGroup = WAITING | IN_PROGRESS | RECEIVING | RECEIVED`
  - `ArtworkDetailStatus = RESERVED | VISITED | DRYING | BISQUE_FIRING | GLAZING | GLAZE_FIRING | DELIVERY_READY | SHIPPED | PICKUP_READY | DELIVERED | PICKUP_DONE`
  - `CANCELED`은 목록/카운트에서 제외.

### `GET /partner/stores/{storeId}/artworks` — 공방 작품 목록

- 가드: AuthGuard + PartnerGuard + 공방 소유권.
- query: `status?`, `cursor?`, `limit?`(기본 20).
- 정렬: 기능명세는 최신 체험일/예약일 내림차순. 커서 기준 필드는 API명세에 미정.
- res `200`:
  ```json
  {
    "data": {
      "artworks": [{
        "id": "artwork-uuid-001",
        "reserverName": "김토담",
        "status": "DRYING",
        "estimatedCompletedAt": "2026-07-01T00:00:00.000Z",
        "thumbnailUrl": "https://cdn.todam.app/artworks/artwork-uuid-001/thumb.jpg",
        "updatedAt": "2026-06-02T10:00:00.000Z"
      }],
      "nextCursor": "artwork-uuid-002",
      "hasMore": true
    }
  }
  ```
- errors: `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`.
- Figma 계약 추가 필요:
  - 목록 item: `scheduledAt`, `programTitle`, `participantCount`, `deliveryMethod`, `reservationStatus`, `statusGroup`, `detailStatus`.
  - 현재 그룹 단계별 count는 확장된 `GET /partner/artworks/count-by-step`에서 제공.

### `GET /partner/artworks/count-by-step` — 제작 단계별 작품 수

- query: `storeId?`, `group?`; 지정 시 소유권 검증. `group = WAITING | IN_PROGRESS | RECEIVING | RECEIVED`.
- res `200` 확장 계약:
  ```json
  {
    "data": {
      "group": "IN_PROGRESS",
      "total": 25,
      "steps": {
        "drying": 12,
        "bisqueFiring": 8,
        "glazing": 4,
        "glazeFiring": 1
      }
    }
  }
  ```
- errors: `401 UNAUTHORIZED`, `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`.
- 기존 대시보드 제작 중 4단계 응답의 하위 호환 방식은 구현 시 확정한다.

### `GET /partner/artworks/{artworkId}` — 파트너 작품 상세

- 가드: AuthGuard + PartnerGuard + 작품 소속 공방 소유권.
- 처리: 내부 상태, `displayState`, 현재 단계 사진, 내부 메모, 전체 로그, 예상 완성일, 경과일 반환.
- res `200` 핵심:
  ```json
  {
    "data": {
      "artwork": {
        "id": "artwork-uuid-001",
        "reservationId": "res-uuid-001",
        "reserverName": "김토담",
        "status": "DRYING",
        "displayState": { "label": "제작 중", "description": "작품이 단단해지도록 정성껏 말리고 있어요.", "subLabel": "건조" },
        "internalMemo": "물레 성형 완료, 균열 없음",
        "estimatedCompletedAt": "2026-07-01T00:00:00.000Z",
        "elapsedDays": 5,
        "currentStagePhotos": [{ "id": "photo-uuid-001", "thumbnailUrl": "...", "imageUrl": "..." }],
        "logs": [{ "id": "log-uuid-001", "fromStatus": "VISITED", "toStatus": "DRYING", "changedByNickname": "토담공방", "memo": "건조 시작", "createdAt": "2026-06-02T10:00:00.000Z" }]
      }
    }
  }
  ```
- errors: `403 FORBIDDEN`, `500 INTERNAL_SERVER_ERROR`.
- Figma 계약 추가 필요:
  - `deliveryMethod`
  - `timeline[] = { stage, state, changedAt, photos[] }`
  - `reservation = { id, reservationNumber, programTitle, scheduledAt, participantCount, reserverName, reserverPhone, internalMemo }`
  - `availableAction` 또는 현재 상태에 대응하는 다음 CTA.

### `PATCH /partner/artworks/{artworkId}/status` — 작품 상태 변경

- req: `{ "status": "BISQUE_FIRING", "memo": "초벌 가마 투입 완료" }`
- 조건: 현재 상태가 `COMPLETED/CANCELED`가 아니며 목표 상태가 직전 또는 직후 단계.
- 처리: 작품 상태 갱신 + `ArtworkLog` 생성 + 고객 알림 큐 등록.
- res `200`: `{ "data": { "artwork": { "id": "...", "status": "BISQUE_FIRING", "updatedAt": "..." } } }`
- errors: `400 INVALID_STATUS_TRANSITION`, `409 ARTWORK_ALREADY_COMPLETED`, `500 INTERNAL_SERVER_ERROR`.

### `POST /partner/artworks/{artworkId}/photos` — 작품 사진 presigned URL 발급

- req:
  ```json
  {
    "artworkLogId": "log-uuid-current-stage",
    "files": [{ "filename": "pottery_drying.jpg", "fileSize": 1048576, "contentType": "image/jpeg" }]
  }
  ```
- 조건: 작품이 `CANCELED`가 아님, `artworkLogId`가 해당 작품의 현재 단계 로그, 해당 로그의 `PENDING + UPLOADED` 사진 합계 최대 5장, 각 5MB 이하, JPG/PNG/HEIC.
- 처리: 각 파일을 동일한 `artworkLogId`에 연결한 `PENDING` 사진 row로 생성 + 10분 유효 S3 PUT URL 발급. 24시간 이상 PENDING은 worker가 정리.
- res `200`: `{ "data": { "photos": [{ "photoId": "...", "uploadUrl": "...", "imageUrl": "..." }] } }`
- errors: `400 INVALID_FILE_SPEC`, `403 FORBIDDEN`, `409 ARTWORK_CANCELED`, `500 INTERNAL_SERVER_ERROR`.
- Figma 계약 추가 필요:
  - 없음. confirm/삭제 endpoint는 아래 신규 계약으로 구현한다.

### `POST /partner/artworks/{artworkId}/photos/{photoId}/confirm` — 작품 사진 업로드 확정

- req body: 없음.
- 조건: 파트너 작품 소유권, `photoId`가 해당 작품/대상 로그에 속함, 현재 상태 `PENDING`, S3 객체 존재.
- 처리: `ArtworkPhoto.status = UPLOADED` 전이 + 이미지 압축/썸네일/EXIF 보정 worker 작업 등록.
- res `200`: `{ "data": { "photo": { "id": "photo-uuid-001", "status": "UPLOADED" } } }`
- errors: `403 FORBIDDEN`, `404 PHOTO_NOT_FOUND`, `409 PHOTO_ALREADY_CONFIRMED`, `422 UPLOAD_OBJECT_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`.

### `DELETE /partner/artworks/{artworkId}/photos/{photoId}` — 작품 사진 삭제

- req body: 없음.
- 조건: 파트너 작품 소유권, `photoId`가 해당 작품의 `ArtworkLog`에 속함.
- 처리: `ArtworkPhoto` DB row 삭제 + S3 원본/썸네일 삭제 worker 작업 등록.
- res `200`: `{ "data": { "deletedPhotoId": "photo-uuid-001" } }`
- errors: `403 FORBIDDEN`, `404 PHOTO_NOT_FOUND`, `500 INTERNAL_SERVER_ERROR`.

### `PATCH /partner/artworks/{artworkId}/delivery` — 배송/픽업 처리

- req:
  - 배송: `{ "action": "SHIP", "trackingNumber": "1234567890123", "carrier": "CJ_LOGISTICS", "shippedAt": "2026-05-25" }`
  - 픽업 준비: `{ "action": "PICKUP_READY" }`
  - 픽업 완료: `{ "action": "PICKUP_DONE" }`
  - 수동 배송 완료: `{ "action": "DELIVERED" }`
- 조건:
  - `SHIP`: `deliveryMethod=DELIVERY`, Artwork `COMPLETED`, Reservation `IN_PROGRESS`, 배송 필수 정보 존재.
  - `PICKUP_READY`: `deliveryMethod=PICKUP`, Artwork `COMPLETED`, Reservation `IN_PROGRESS`.
  - `PICKUP_DONE`: `deliveryMethod=PICKUP`, Reservation `PICKUP_READY`.
  - `DELIVERED`: `deliveryMethod=DELIVERY`, Reservation `SHIPPED`.
- 처리: Delivery 갱신, Reservation 상태 전이, 알림/배송완료 스케줄 등록.
- res `200`: `{ "data": { "reservation": { "id": "...", "status": "SHIPPED", "trackingNumber": "...", "carrier": "CJ_LOGISTICS", "shippedAt": "2026-05-25" } } }`
- errors: `400 DELIVERY_INFO_INVALID`, `403 FORBIDDEN`, `404 ARTWORK_NOT_FOUND`, `409 INVALID_RESERVATION_STATUS`, `500 INTERNAL_SERVER_ERROR`.
- 추가 시안 계약:
  - `SHIP`: 운송장 입력 화면 → 택배사/운송장/발송일 입력 → 배송완료 예정일(D+7) 미리보기 → 확인 모달 → 배송 시작.
  - `PICKUP_READY`: 확인 모달 → 고객 픽업 가능 알림 발송 → 상세에 안내 발송 이력 표시.
  - `PICKUP_DONE`: 고객 직접 수령 확인 모달 → 되돌릴 수 없는 완료 처리 → 완료 화면.
  - 배송 상세에는 배송지 정보, 현재 단계 사진, 내부 메모, 변경 이력을 표시한다.

### 파트너 작품 일괄 공정 변경 — API명세 미등록

#### `PATCH /partner/artworks/bulk-status`

- req:
  ```json
  {
    "artworkIds": ["artwork-uuid-001", "artwork-uuid-002"],
    "fromStatus": "DRYING",
    "toStatus": "BISQUE_FIRING"
  }
  ```
- 조건: 1~50개, 동일 공방, 모든 작품의 현재 상태가 `fromStatus`, `toStatus`는 다음 단계. 일괄 되돌리기 금지.
- 처리: 모든 항목 사전 검증 후 단일 트랜잭션으로 Artwork 상태 갱신 + 작품별 ArtworkLog 생성. 하나라도 실패하면 전체 롤백.
- res `200`: `{ "data": { "updatedCount": 2, "status": "BISQUE_FIRING" } }`
- errors: `400 INVALID_STATUS_TRANSITION`, `400 TOO_MANY_ARTWORKS`, `403 FORBIDDEN`, `404 ARTWORK_NOT_FOUND`, `409 ARTWORK_STATUS_CHANGED`, `500 INTERNAL_SERVER_ERROR`.

### `PATCH /partner/artworks/{artworkId}/delivery-info` — 파트너 작품 수령 정보 수정

- 초기값: 예약 생성 시 저장된 `Reservation.deliveryMethod`와 기존 `Delivery` 정보.
- req 필드: `deliveryMethod`, `recipientName?`, `recipientPhone?`, `postalCode?`, `address?`, `addressDetail?`, `carrier?`, `trackingNumber?`.
- 조건:
  - 작품 소속 공방 소유권 검증.
  - `Reservation.status`가 `SHIPPED | DELIVERED | PICKUP_READY | PICKUP_DONE`이면 변경 금지.
  - `deliveryMethod = DELIVERY`이면 수령인/연락처/우편번호/주소 필수.
- `carrier`: `CJ_LOGISTICS | LOTTE | HANJIN | KOREA_POST | LOGEN | COUPANG_LOGISTICS`.
- `trackingNumber`: 문자열 저장. FE가 공백/하이픈 제거 후 전송하고 서버가 숫자/길이 검증.
- `PICKUP` 선택 시 배송 주소/택배 정보 입력 영역을 숨긴다. 기존 Delivery 정보는 보존하지만 배송 처리에는 사용하지 않는다.
- 처리: `Reservation.deliveryMethod` 갱신 + DELIVERY 선택 시 Delivery upsert.
- res `200`: `{ "data": { "deliveryMethod": "DELIVERY", "delivery": { "...": "..." } } }`
- errors: `400 DELIVERY_INFO_INVALID`, `403 FORBIDDEN`, `404 ARTWORK_NOT_FOUND`, `409 DELIVERY_METHOD_NOT_EDITABLE`, `500 INTERNAL_SERVER_ERROR`.
- 저장 성공 후 작품 상세로 복귀.

## Scope

- In:
  - 파트너 작품 목록, 상태 그룹/세부 필터, 그룹별 개수 표시, 커서 페이지네이션.
  - 파트너 작품 상세, 제작 타임라인, 현재 단계 사진, 예약/수령 정보, 상태별 CTA.
  - 작품 사진 presign, 업로드 confirm, 삭제.
  - 작품 상태 직전/직후 전이, 변경 로그, 알림 큐 등록.
  - 현재 단계 사진 presigned 업로드 및 업로드 완료/정리 흐름.
  - 작품 완료 후 배송 시작, 픽업 준비/완료 처리.
  - 파트너 작품 수령 방식 및 배송 정보 수정.
  - D12 승인 시 작품 다중 선택 일괄 공정 변경.
- Out:
  - Artwork 자동 생성 및 QR 발급: 예약 확정/수동 예약 등록 소관.
  - 체험 완료로 `VISITED` 전이: 파트너 예약 관리 소관.
  - QR 라벨 출력: `GET /partner/reservations/{reservationId}/qr-label`, 예약 관리 소관.
  - 고객용 작품 제작 단계 조회: `유저 예약 - 작품 상세 조회.md` 소관.
  - 배송 완료 7일 자동 전이 worker 구현과 알림 채널 구현은 별도 worker/notification 범위. 본 기능은 작업 등록까지만 계약한다.
  - 단계 정체에 따른 `estimatedCompletedAt` 자동 보정 및 파트너 수동 수정(MVP 이후 별도 plan).
  - 바코드 스캔용 별도 BE API. 스캔은 FE 입력 보조로 처리한다.

## Plan

1. **API명세 갱신:** 본 plan에서 해소된 계약을 API명세 DB에 등록/수정한다.
2. **Shared contract:** 확정된 목록/카운트/상세/상태변경/사진/배송 요청·응답 zod schema와 상태 그룹 매핑을 `packages/shared`에 추가한다.
3. **BE 조회:** artwork 모듈에 공방 작품 목록/그룹 카운트/파트너 상세 조회 유스케이스를 구현한다. 모든 경로에서 PartnerGuard와 공방 소유권을 검증한다.
4. **BE 상태 변경:** 상태 전이 규칙을 domain에 구현하고 Artwork 갱신 + ArtworkLog 생성 + 알림 작업 등록을 한 트랜잭션 경계로 처리한다.
5. **BE 사진:** presigned 발급, 로그/단계 연결, 사진 confirm API, 사진 삭제 API, PENDING GC 작업을 확정 계약대로 구현한다.
6. **BE 수령 처리:** 파트너 수령 방식/배송 정보 수정 API와 action별 `deliveryMethod`/Reservation.status 검증, Delivery 저장, Reservation 전이, 알림 및 자동완료 작업 등록을 구현한다.
7. **BE 일괄 변경:** `PATCH /partner/artworks/bulk-status`에 동일 공방·동일 단계·최대 50개·다음 단계 전이 검증과 원자적 상태 변경/로그 생성을 구현한다.
8. **FE 목록:** `/partner/artworks`에 현재 공방 기반 그룹 chip, 그룹 카운트, 세부 필터 바텀시트, 무한 스크롤, 카드/빈 상태를 구현한다.
9. **FE 일괄 편집:** 목록 선택 모드, 체크박스, 선택 개수 CTA, 공정 선택 바텀시트, 일괄 변경 결과 처리를 구현한다.
10. **FE 상세:** `/partner/artworks/[id]`에 전체 타임라인, 단계별 사진 업로드/삭제, 수령 방식 카드, 예약정보 바텀시트, 현재 상태별 CTA를 구현한다.
11. **FE 수령 정보:** 별도 수령 방식 선택 화면에 택배/직접수령 분기, 주소·택배사·운송장 입력, 변경 감지 저장 버튼을 구현한다.
12. **FE 배송/픽업 완료:** 운송장 입력·바코드 스캔·배송 시작 확인, 픽업 준비/완료 확인, 완료 화면을 구현한다.
13. **FE 업로드/연동:** 현재 단계 사진 선택→presigned 발급→S3 PUT→완료 처리 흐름과 상태/배송 mutation 후 상세·목록·카운트 invalidate를 연결한다.
14. **계약 드리프트 검증:** API route snapshot, shared schema, MSW, 실제 API 연동을 정본 계약과 대조한다.

## Out (단계별 완료물)

- API: 파트너 작품 목록/카운트/상세/상태 변경/사진 presign·confirm·삭제/배송·픽업 처리.
- BE 구현 완료(2026-06-08): shared 요청 계약, ArtworkModule, 소유권 검증, 상태/일괄 전이 로그, 사진 presign·confirm·삭제, 수령 정보 및 배송/픽업 처리, 상태 정책 테스트.
- BE DDD 리팩터링 완료(2026-06-08): endpoint별 application use-case, domain `ArtworkRepository` 포트와 상태 정책, infrastructure `PrismaArtworkRepository`, presentation controller/DTO 경계로 분리.
- 작품 사진 presign 응답 정리(2026-06-08): 공방/프로그램 이미지 등록과 동일하게 각 항목을 `식별자 + uploadUrl + imageUrl` 형태로 통일.
- Shared 계약 정리(2026-06-08): 목록/카운트/상세/상태 변경/사진/배송 응답 Zod schema와 공용 상태 그룹·상세 상태·available action 타입을 `packages/shared`로 분리하고 API repository/Swagger DTO에 바인딩.
- UI: 파트너 작품 관리 목록 및 상세 화면.
- 연동: 현재 공방, 목록 필터/페이지네이션, 상세 mutation, 이미지 직접 업로드, 배송/픽업 액션.

## Risks

- 기능명세가 `ArtworkStatus`와 `ReservationStatus`를 섞어 사용해 승인 없이 구현하면 필터와 CTA가 서로 다르게 동작한다.
- 정본 목록/상세 API는 화면 필수 필드가 부족해 현재 상태로는 FE 구현이 불가능하다.
- presigned 업로드 완료 전 상태 전이를 허용하면 타임라인 로그와 사진 연결이 유실될 수 있다.
- 이미지 후처리/알림/배송 자동완료 worker가 준비되지 않으면 API 성공 후 후속 상태가 정체될 수 있다.
- `Artwork.internalMemo`와 `Reservation.internalMemo`의 의미가 겹쳐 잘못된 메모를 수정할 위험이 있다.

## Validation

- Tests:
  - 목록: 공방 소유권, 상태 그룹/세부 상태 매핑, 최신 체험일 정렬, 커서 안정성, 빈 목록.
  - 상세: 소유권, 상태별 타임라인/CTA/예약·수령 정보, 현재 단계 사진과 로그 정렬.
  - 상태 변경: 직후/직전 허용, 건너뛰기 거부, 종료 상태 거부, 트랜잭션 롤백, 알림 작업 등록.
  - 사진: 형식/용량/개수 제한, CANCELED 거부, 현재 로그 연결, 업로드 완료, 24시간 PENDING GC.
  - 배송: deliveryMethod/action 조합, 필수 배송정보, PICKUP_READY→PICKUP_DONE, 중복 action, 소유권.
  - 배송: SHIPPED→DELIVERED 수동 완료, 자동 완료 작업 취소, 종료 처리 되돌리기 금지.
- Manual checks:
  - 그룹/필터 변경과 개수/목록 일치, 무한 스크롤 중복 없음.
  - 사진 업로드 성공/실패 후 타임라인 및 CTA 동작.
  - 제작 단계 변경 후 목록·상세·고객 노출 상태 갱신.
  - 배송/픽업 처리 후 올바른 Reservation 상태와 CTA 표시.
- Observability:
  - 작품 상태 변경/되돌리기, 사진 presign/완료/GC, 배송 action에 artworkId·reservationId·partnerId와 결과 로그.

## Decision Log

- 작품 관리 범위는 목록/필터/상세/제작 상태/사진/수령 처리로 묶고, 자동 생성·체험 완료·QR 출력·고객 조회는 기존 소관 plan으로 분리한다. — 2026-06-08
- 상태 그룹과 화면 필수 응답 필드는 정본 간 불일치가 있어 임의 계약을 만들지 않고 Open Decisions로 남긴다. — 2026-06-08
- API Contract는 2026-06-08 Notion API명세 DB 조회 결과를 스냅샷했다. — 2026-06-08
- Figma 6종을 확인해 목록 카드, 4개 상태 그룹, 상세 타임라인/예약정보/CTA, 수령 정보 편집 화면 계약을 반영했다. — 2026-06-08
- `GET /partner/artworks/count-by-step`을 그룹/단계 카운트 API로 확장한다. — 사용자 확정 2026-06-08
- 사진 업로드 완료는 S3 PUT 후 confirm API로 확정한다. — 사용자 확정 2026-06-08
- 사진은 현재 단계 `ArtworkLog` ID를 presign 요청에 전달하고 동일 로그에 여러 `ArtworkPhoto`를 연결한다. 서버는 작품 소속·현재 단계·단계별 최대 5장을 검증한다. — 사용자 확정 2026-06-08
- 사진 업로드 confirm API와 사진 삭제 API를 구현 대상에 포함한다. — 사용자 확정 2026-06-08
- 추가 운영 시안에서 배송 시작/픽업 준비·완료와 목록 일괄 공정 변경 흐름을 신규 범위로 반영했다. — 2026-06-08
- 예상 완성일 자동 보정은 MVP에서 제외하고 최초 계산값을 유지한다. — 사용자 확정 2026-06-08
- 일괄 공정 변경은 동일 공방·동일 현재 단계 최대 50개를 다음 단계로만 단일 트랜잭션 처리한다. — 사용자 확정 2026-06-08
- 배송사는 운영 가능한 고정 enum만 사용하고 바코드 스캔은 FE 입력 보조로 처리한다. — 사용자 확정 2026-06-08
- 파트너는 배송/픽업 처리 시작 전까지 작품의 수령 방식을 변경할 수 있으며, 파트너 전용 delivery-info API를 사용한다. — 사용자 확정 2026-06-08
- 작품 목록 상태 그룹은 서버가 Artwork/Reservation 상태와 deliveryMethod를 조합해 WAITING/IN_PROGRESS/RECEIVING/RECEIVED로 계산하며 취소 건은 제외한다. — 사용자 확정 2026-06-08
- 배송/픽업 action은 deliveryMethod와 Artwork/Reservation 상태 전이표로 검증하며, 파트너 수동 DELIVERED 처리를 허용한다. — 사용자 확정 2026-06-08

## Outcome

- Status: Open Decisions 전부 해소. API명세 DB 갱신 및 사람의 API Contract 최종 승인 후 구현 착수 가능.
- Follow-up: 사람 승인 후 본 plan의 API Contract를 갱신하고 `skill-issue` → plan commit/push/PR → `skill-impl <be|fe>` 순서로 진행한다.
