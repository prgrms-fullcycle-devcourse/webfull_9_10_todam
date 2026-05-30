# APISpec

## /partners/me

## 요구사항

- 승인된 파트너(공방 사장님)가 공방 운영을 자발적으로 종료하고 파트너 자격을 해지한다.
- 해지 신청 시 해당 파트너가 소유한 공방들에 진행 중인 예약(PENDING, CONFIRMED)이 존재하거나, 정산 및 가공 완료되지 않은 작품이 남아있는 경우 해지를 제한한다.
- 파트너 해지가 완료되면 파트너 상태가 `TERMINATED`로 변경되며, 파트너 센터 전용 기능 및 공방 관리 권한이 회수된다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 유저 식별자(`userId`)를 확인한다.
- `partners` 테이블에서 해당 사용자의 `user_id`를 기반으로 활성화된 파트너 정보가 존재하는지 확인한다.
- 파트너의 현재 상태가 승인 완료(`APPROVED`) 상태가 아니거나 이미 해지/정지된 경우 요청을 거부한다.
- **해지 불가 조건 검증**:
    - 해당 파트너가 보유한 모든 공방(`stores`)을 조회한다.
    - 각 공방에 연결된 예약 상태 중 `PENDING` 또는 `CONFIRMED` 상태인 활성 예약 건이 존재하는지 검증한다. 존재 시 해지 거부.
    - 완료되지 않은 진행 중인 도자기 작품이 남아있는지 검증한다. 존재 시 해지 거부.
- 검증을 전면 통과하면 `partners` 테이블에서 해당 파트너의 상태를 자율 해지 상태로 변경한다 (`status = 'TERMINATED'`).
- 유저의 파트너 권한 플래그를 비활성화한다 (`User.is_partner = false`).
- 데이터베이스에 저장된 파트너 관련 세션을 만료 처리하고 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:45:00.123Z",
  "path": "/partners/me",
  "message": "파트너 자격 자율 해지가 성공적으로 완료되었습니다. 공방 운영 권한이 회수됩니다.",
  "data": null,
  "error": null
}
```


### `400 Bad Request (예약 또는 처리 중인 작품 존재)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T17:45:03.456Z",
  "path": "/partners/me",
  "message": "운영 중인 공방에 매칭된 활성 예약이나 미완료 작품이 존재하여 파트너 해지가 불가능합니다.",
  "data": null,
  "error": "ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T17:45:05.789Z",
  "path": "/partners/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `404 Not Found (파트너 이력이 없거나 이미 해지된 상태)`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T17:45:08.112Z",
  "path": "/partners/me",
  "message": "해지할 수 있는 파트너 자격 정보가 존재하지 않습니다.",
  "data": null,
  "error": "PARTNER_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T17:45:12.987Z",
  "path": "/partners/me",
  "message": "파트너 해지 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/auth/login

## 요구사항

- 내부 운영자가 별도 인증 파이프라인으로 어드민 시스템에 로그인한다.
- 일반 사용자 로그인과 독립된 `AdminGuard`를 사용한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "admin@todam.app",
  "password": "AdminPassword1!"
}
```


---


### 시스템 처리 

- 이메일 형식 유효성을 검증한다.
- `admins` 테이블에서 이메일로 어드민 계정을 조회한다.
- 비밀번호 해시 일치 여부를 확인한다.
- 어드민 전용 access token 및 refresh token을 발급한다.
- 로그인 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:30:00.000Z",
  "path": "/admin/auth/login",
  "message": "어드민 로그인이 완료되었습니다.",
  "data": {
    "admin": {
      "id": "admin-uuid-001",
      "email": "admin@todam.app",
      "name": "관리자"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T21:30:03.000Z",
  "path": "/admin/auth/login",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "data": null,
  "error": "INVALID_CREDENTIALS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:30:08.000Z",
  "path": "/admin/auth/login",
  "message": "어드민 로그인 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{slug}/programs/{programId}/reviews

## 요구사항

- 비인증 포함 모든 사용자가 특정 프로그램의 리뷰 목록을 조회할 수 있다.
- 최신순 정렬이 기본값이며 페이지네이션을 적용한다.

---


## Request


### Headers

- Accept: application/json

### Path Parameters

- `slug`: 공방 슬러그
- `programId`: 프로그램 UUID

### Query Parameters

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `sort`: 정렬 기준 (`latest` | `rating_high`, 기본값: `latest`)

---


### 시스템 처리 

- `slug`와 `programId`로 공방 및 프로그램을 조회한다.
- 해당 프로그램에 연결된 리뷰 목록을 조회하고 페이지네이션을 적용한다.
- 전체 리뷰 수 및 평균 별점을 함께 반환한다.

---


## Response


### `200 OK`


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


### `404 Not Found`


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


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:20:08.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001/reviews",
  "message": "리뷰 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}

## 요구사항

- 인증된 파트너가 본인 공방의 상세 정보를 조회한다.
- 운영시간, 사업자 서류, 이미지, 반려 사유 등 운영 관련 모든 정보를 포함하여 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 조회할 공방 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고, 해당 공방의 `partner_id`가 요청자와 일치하는지 확인한다.
- 공방 상세 정보, 운영시간, 이미지 목록, 사업자 서류, 반려 사유 등을 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:15:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "name": "토담 공방",
      "slug": "todam-studio",
      "description": "흙과 함께하는 도자기 체험 공방입니다.",
      "phone": "02-1234-5678",
      "address": "서울특별시 성동구 성수이로 12길 34",
      "latitude": 37.5446,
      "longitude": 127.0556,
      "convenienceInfo": { "parking": true, "pet": false, "wifi": true },
      "autoConfirm": false,
      "status": "PUBLISHED",
      "rejectedReason": null,
      "suspendedReason": null,
      "operatingHours": [
        {
          "dayOfWeek": "MON",
          "openTime": "10:00",
          "closeTime": "19:00",
          "breakStart": "13:00",
          "breakEnd": "14:00"
        }
      ],
      "images": [
        {
          "id": "img-uuid-001",
          "imageUrl": "https://cdn.todam.app/stores/todam-studio/01.jpg",
          "thumbnailUrl": "https://cdn.todam.app/stores/todam-studio/01_thumb.jpg",
          "isThumbnail": true,
          "sortOrder": 1
        }
      ],
      "businessDocument": {
        "ownerName": "김토담",
        "businessName": "토담 공방",
        "businessNumber": "123-45-67890",
        "businessAddress": "서울특별시 성동구 성수이로 12길 34",
        "ocrStatus": "VERIFIED"
      },
      "publishedAt": "2026-05-20T10:00:00.000Z",
      "createdAt": "2026-05-18T12:00:00.000Z"
    }
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T18:15:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:15:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "해당 공방에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:15:05.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방을 찾을 수 없습니다.",
  "data": null,
  "error": "STORE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:15:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방 상세 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/password/reset-request

## 요구사항

- 사용자가 계정의 비밀번호를 분실했을 때, 가입 시 사용했던 본인의 이메일을 통해 재설정을 위한 안전한 메일 발송을 요청한다.
- 선행조건 및 동작 연계:
    - 입력받은 이메일 값이 누락되지 않았는지 및 정규식 기준 이메일 형식 적합성(유효성)을 검증한다.
    - 가입된 활성 유저 여부를 확인한다. 가입이 정상적으로 확인되면 고유 1회성 재설정 보안 토큰을 생성하고 만료 제한시간 정책(15분)을 바인딩하여 메일 전송 인프라로 재설정 링크(`https://todam.app/reset-password?token={resetToken}`)를 자동 발송한다.
- 보안 중요 요구사항 (가입 여부 은닉):
    - 외부 공격자가 이메일을 무작위 대입 스캔하여 특정 이메일의 본 서비스 회원 등록 여부를 조회(Enumeration 공격)해 가지 못하도록, 가입되지 않은 이메일인 경우에도 동일한 포맷의 200 OK 성공 응답과 일관된 성공 안내 메시지("입력하신 이메일 주소로 회원 정보가 있는 경우...")를 반환하여 외부에 내부 유무 정보를 엄격히 숨긴다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "user@example.com"
}
```


---


### 시스템 처리 

- 요청 바디 내 `email` 값의 누락 유무 및 정규식 기준 이메일 형식 적합성을 검증한다.
- `users` 테이블에서 해당 이메일을 가지고 가입된 활성 유저가 실존하는지 조회한다.
- **가입 유저가 실존하는 경우 (선행조건 충족 시)**:
    - 1회용 임시 보안 토큰(암호 난수 문자열) 및 토큰 만료 시간(현재 시각 + 15분)을 임시 저장소(Redis 또는 `password_resets` 테이블)에 저장한다.
    - AWS SES 등 이메일 전송 API를 호출하여 비밀번호 재설정 링크가 담긴 템플릿 메일을 사용자에게 발송한다.
- **가입 유저가 존재하지 않는 경우 (예외 사항 처리)**:
    - 이메일 발송 외부 API 호출은 생략하고 내부 프로세스는 차단하되, 응답은 200 OK 성공 템플릿을 동일하게 반환하여 가입 정보를 은닉한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:40:00.000Z",
  "path": "/auth/password/reset-request",
  "message": "입력하신 이메일 주소로 회원 정보가 있는 경우, 비밀번호 재설정 메일이 성공적으로 발송됩니다.",
  "data": null,
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:40:02.000Z",
  "path": "/auth/password/reset-request",
  "message": "올바르지 않은 이메일 형식입니다.",
  "data": null,
  "error": "INVALID_EMAIL_FORMAT"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T19:40:08.000Z",
  "path": "/auth/password/reset-request",
  "message": "메일 발송 외부 모듈 연동 오류 혹은 서버 시스템 에러가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /notifications/{notificationId}/read

## 요구사항


인증된 사용자가 특정 알림을 읽음 처리한다.


---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `notificationId`: 알림 UUID

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `notificationId`로 알림을 조회하고 소유자가 요청자인지 확인한다.
- `notifications.is_read = true`, `read_at = now()`로 갱신한다.
- 읽음 처리 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:20:00.000Z",
  "path": "/notifications/noti-uuid-001/read",
  "message": "알림이 읽음 처리되었습니다.",
  "data": null,
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T21:20:03.000Z",
  "path": "/notifications/noti-uuid-001/read",
  "message": "해당 알림에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:20:08.000Z",
  "path": "/notifications/noti-uuid-001/read",
  "message": "알림 읽음 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores

## 요구사항

- 인증된 사용자가 공방 정보, 사업자 서류, 영업 정보를 제출하여 공방을 등록한다.
- 해당 사용자의 첫 번째 공방 등록인 경우, 시스템이 파트너 엔티티를 자동 생성하고 `status = 'PENDING'`으로 설정한다.
- 이미 `APPROVED` 파트너인 경우에는 추가 공방 등록으로 처리되며, 파트너 엔티티는 생성·변경하지 않는다.
- 공방 등록 시 사업자등록번호 중복 및 형식 검증, slug 중복 검증을 수행한다.
- 등록 완료 시 공방 상태는 `DRAFT`로 생성되며, 파트너가 제출(`submit`) 요청을 별도로 해야 `PENDING`으로 전이된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Body


```json
{
  "name": "토담 공방",
  "slug": "todam-studio",
  "description": "흙과 함께하는 도자기 체험 공방입니다.",
  "phone": "02-1234-5678",
  "address": "서울특별시 성동구 성수이로 12길 34",
  "latitude": 37.5446,
  "longitude": 127.0556,
  "convenienceInfo": {
    "parking": true,
    "pet": false,
    "wifi": true
  },
  "autoConfirm": false,
  "operatingHours": [
    {
      "dayOfWeek": "MON",
      "openTime": "10:00",
      "closeTime": "19:00",
      "breakStart": "13:00",
      "breakEnd": "14:00"
    }
  ],
  "businessDocument": {
    "documentUrl": "https://s3.amazonaws.com/todam/docs/business-license.jpg",
    "ownerName": "김토담",
    "businessName": "토담 공방",
    "businessNumber": "123-45-67890",
    "businessAddress": "서울특별시 성동구 성수이로 12길 34"
  }
}
```


---


### 시스템 처리 

- 인증 토큰으로 요청 사용자를 식별한다.
- 요청 Body의 필수값(공방명, 주소, 전화번호, 사업자 서류 등)을 검증한다.
- slug 형식(영문 소문자·숫자·하이픈, 4~40자)을 검증하고, 미입력 시 nanoid로 자동 생성한다.
- slug 중복 여부를 `stores` 테이블에서 확인한다.
- 사업자등록번호 형식 및 체크섬을 검증한다.
- 동일 사업자등록번호의 `PUBLISHED` 상태 공방이 존재하는지 확인한다.
- 주소를 외부 지도 API(카카오맵)를 통해 위도·경도로 변환한다.
- 사업자등록증 이미지를 S3에 저장한다.
- `stores` row를 생성한다 (`status = 'DRAFT'`).
- 해당 사용자의 파트너 엔티티가 존재하지 않는 경우, `partners` row를 자동 생성한다 (`status = 'PENDING'`).
- `store_images`, `store_operating_hours`, `business_documents` 등 연관 데이터를 함께 저장한다.
- 등록 완료 응답을 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T18:00:00.000Z",
  "path": "/stores",
  "message": "공방이 성공적으로 등록되었습니다. 제출 후 검수를 진행해주세요.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "name": "토담 공방",
      "slug": "todam-studio",
      "status": "DRAFT",
      "createdAt": "2026-05-25T18:00:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T18:00:05.123Z",
  "path": "/stores",
  "message": "사업자등록번호 형식이 올바르지 않습니다.",
  "data": null,
  "error": "INVALID_BUSINESS_NUMBER"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T18:00:06.456Z",
  "path": "/stores",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:10:04.000Z",
  "path": "/partner/stores",
  "message": "파트너 권한이 필요합니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:10:08.000Z",
  "path": "/partner/stores",
  "message": "공방 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /reservations/{reservationId}/review

## 요구사항

- 리뷰 작성을 완료하기 전, 프론트엔드가 S3에 리뷰 이미지를 먼저 업로드해 둡니다. 이후 최종적으로 리뷰 작성 요청 시 본 API의 바디에 업로드 완료된 S3 Key 목록(`photos`)을 문자열 배열 형태로 담아 제출합니다.
- 이미지 개별 완료 처리를 별도 API로 호출할 필요 없이, 리뷰 데이터 저장 시 단일 트랜잭션으로 일괄 바인딩 저장됩니다.
- 리뷰는 `IN_PROGRESS` 단계 도달 시점으로부터 180일 이내에만 작성이 가능하며, 예약 건당 딱 1건만 등록할 수 있습니다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 예약 UUID

### Body


```json
{
  "rating": 5,
  "content": "정말 즐거운 체험이었습니다. 작품도 예쁘게 완성되었어요!",
  "photos": [
    "reviews/photos/uuid-review-001_review_photo.jpg"
  ]
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 확인하여 사용자를 식별한다.
- `reservationId`로 예약을 조회하고 해당 예약 레코드의 소유자가 요청자 본인인지 검증한다.
- 예약 상태가 `IN_PROGRESS` 이상 단계에 해당하는지 검증한다.
- 예약일 기준 180일 이내에 해당하는지 확인하고, 해당 예약에 기존 등록된 리뷰가 없는지 검증한다.
- `reviews` 테이블에 별점(`rating`), 내용(`content`)을 레코드로 생성한다.
- 전달받은 `photos` 내 S3 Key 문자열 배열을 순회하여 `review_photos` 테이블에 연계 레코드를 일괄 삽입한다.
- 비동기 후처리 큐(BullMQ 등)에 해당 이미지를 넘겨 리뷰 사진 최적화 및 썸네일을 비동기로 생성한다.
- 해당 공방 및 프로그램 테이블에 기록된 평균 별점 정보와 누적 리뷰 건수를 실시간 갱신한다.
- 작성 완료된 리뷰 레코드 정보를 패키징하여 성공 응답을 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-26T19:30:00.000Z",
  "path": "/reservations/res-uuid-001/review",
  "message": "리뷰가 성공적으로 등록되었습니다.",
  "data": {
    "review": {
      "id": "review-uuid-001",
      "reservationId": "res-uuid-001",
      "rating": 5,
      "content": "정말 즐거운 체험이었습니다. 작품도 예쁘게 완성되었어요!",
      "photos": [
        {
          "id": "photo-uuid-001",
          "imageUrl": "https://cdn.todam.app/reviews/photos/uuid-review-001_review_photo.jpg"
        }
      ],
      "createdAt": "2026-05-26T19:30:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:30:03.000Z",
  "path": "/reservations/res-uuid-001/review",
  "message": "리뷰 작성 기한(체험일로부터 180일 이내)이 이미 초과되어 작성할 수 없습니다.",
  "data": null,
  "error": "REVIEW_DEADLINE_EXCEEDED"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-26T19:30:05.000Z",
  "path": "/reservations/res-uuid-001/review",
  "message": "본인이 참여한 예약 정보에 대해서만 리뷰 작성이 허용됩니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T20:55:04.000Z",
  "path": "/reservations/res-uuid-001/review",
  "message": "이미 리뷰를 작성한 예약입니다.",
  "data": null,
  "error": "REVIEW_ALREADY_EXISTS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:55:08.000Z",
  "path": "/reservations/res-uuid-001/review",
  "message": "리뷰 등록 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /reservations/{reservationId}/cancel

## 요구사항

- 인증된 사용자가 본인 예약을 취소한다.
- 예약 상태가 `PENDING` 또는 `CONFIRMED`이어야 하며, 공방에서 설정한 취소 가능 시간 이내여야 한다.
- 취소 시 잔여 정원이 복원되고 연결된 Artwork가 `CANCELED` 처리된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 취소할 예약 UUID

### Body


```json
{
  "cancelReason": "개인 사정으로 인한 취소"
}
```


---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `reservationId`로 예약을 조회하고 소유 권한을 확인한다.
- 예약 상태(`PENDING` 또는 `CONFIRMED`)를 검증한다.
- 취소 가능 시간(체험일 기준 d-day 설정) 이내인지 확인한다.
- `reservations.status = 'CANCELED'`로 갱신하고, 취소 사유 및 취소자(`canceledBy`, `cancelReason`)를 기록한다.
- `program_time_slots.reserved_count`를 `participant_count`만큼 감소시킨다.
- 연결된 `artworks.status = 'CANCELED'`로 갱신한다.
- 파트너에게 취소 알림을 발송한다.
- 취소 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:50:00.000Z",
  "path": "/reservations/res-uuid-001/cancel",
  "message": "예약이 성공적으로 취소되었습니다.",
  "data": { 
    "reservation": {
      "id": "res-uuid-001",
      "status": "CANCELED",
      "canceledBy": "user-uuid-001",
      "cancelReason": "개인 사정으로 인한 취소",
      "canceledAt": "2026-05-25T19:50:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T19:50:03.000Z",
  "path": "/reservations/res-uuid-001/cancel",
  "message": "취소 가능 시간이 초과되었습니다.",
  "data": null,
  "error": "CANCELLATION_DEADLINE_EXCEEDED"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T19:50:04.000Z",
  "path": "/reservations/res-uuid-001/cancel",
  "message": "이미 취소된 예약입니다.",
  "data": null,
  "error": "ALREADY_CANCELED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:50:08.000Z",
  "path": "/reservations/res-uuid-001/cancel",
  "message": "예약 취소 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/stores/{storeId}/approve

## 요구사항

- 어드민이 `PENDING` 상태의 공방을 승인하여 `PUBLISHED`로 전이한다.
- 첫 번째 공방인 경우 파트너 상태도 동시에 `APPROVED`로 전이한다.
- 파트너에게 승인 알림을 발송한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {adminAccessToken}

### Path Parameters

- `storeId`: 승인할 공방 UUID

---


### 시스템 처리 

- 어드민 인증 토큰을 검증한다.
- `storeId`로 공방을 조회하고 `PENDING` 상태인지 확인한다.
- `stores.status = 'PUBLISHED'`, `published_at = now()`로 갱신한다.
- 해당 파트너의 첫 번째 공방인 경우 `partners.status = 'APPROVED'`, `approved_at = now()`로 동시 전이한다.
- 파트너에게 승인 알림을 발송한다.
- 승인 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:40:00.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/approve",
  "message": "공방 심사가 승인되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "PUBLISHED",
      "publishedAt": "2026-05-25T21:40:00.000Z"
    }
  },
  "error": null
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T21:40:03.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/approve",
  "message": "PENDING 상태의 공방만 승인할 수 있습니다.",
  "data": null,
  "error": "INVALID_STORE_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:40:08.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/approve",
  "message": "공방 심사 승인 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs

## 요구사항

- 인증된 파트너가 `PUBLISHED` 상태의 공방에 새 프로그램을 등록한다.
- 등록 직후 상태는 `DRAFT`이며, 파트너가 게시 완료 처리 시 `ACTIVE`로 전이된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 대상 공방 UUID

### Body


```json
{
  "title": "물레 체험 기초반",
  "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
  "materials": "앞치마 (공방 제공), 편한 복장",
  "caution": "체험 당일 취소는 불가합니다.",
  "price": 45000,
  "durationMinutes": 120,
  "capacity": 6,
  "leadTimeDays": 30,
  "deliveryOption": "CUSTOMER_SELECT"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고 소유 권한을 확인한다.
- 공방 상태가 `PUBLISHED`인지 검증한다.
- 필수 항목(제목, 가격, 소요시간, 정원, 리드타임)을 검증한다.
- `programs` row를 생성한다 (`status = 'DRAFT'`).
- 프로그램 스냅샷(`program_snapshots`) row를 함께 생성한다.
- 등록 완료 응답을 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:00:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs",
  "message": "프로그램이 성공적으로 등록되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "storeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "물레 체험 기초반",
      "status": "DRAFT",
      "createdAt": "2026-05-25T19:00:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T19:00:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs",
  "message": "소요시간은 30분 단위로 30분~480분 사이여야 합니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T19:00:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs",
  "message": "PUBLISHED 상태의 공방에서만 프로그램을 등록할 수 있습니다.",
  "data": null,
  "error": "STORE_NOT_PUBLISHED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:00:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs",
  "message": "프로그램 등록 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/stores

## 요구사항

- 인증된 서비스 관리자(Admin)가 새로운 파트너들이 가입하여 신규 등록을 제출한 공방의 심사 대기 목록을 조회한다.
- 심사 상태(`status`)를 지정하여 필터링할 수 있는 옵션을 제공한다 (기본값은 심사 대기 중인 `PENDING` 상태의 공방을 조회).
- **페이지네이션 설계 지침**: 관리자(Admin) 도구는 모바일 환경이 아닌 데스크톱 웹 환경에서 사용되며, 어드민 사용자는 전체 건수 파악 및 특정 페이지 단위(예: 3페이지, 10페이지)로 바로 건너뛰는 이동이 잦기 때문에, 커서 페이징 대신 **일반적인 번호별 오프셋(Offset) 기반 페이지네이션**으로 구현한다.
- 각 공방의 사업자등록서류 정보와 제출 서류 상태를 한꺼번에 로드하여 어드민이 빠르게 검토 및 승인/반려 의사결정을 내릴 수 있도록 돕는다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Query Parameters

- `status`: 공방 심사 상태 필터 (선택, `PENDING`, `PUBLISHED`, `REJECTED`, `SUSPENDED` 중 하나, 기본값: `PENDING`)
- `page`: 조회할 페이지 번호 (선택, 기본값: 1)
- `limit`: 한 페이지에 노출할 공방 개수 (선택, 기본값: 10, 최대: 100)

---


### 시스템 처리 


1. Access Token 유효성을 확인하고 관리자(Admin) capability 권한이 실존하는지 철저히 검증한다 (`403 Forbidden`).


2. `stores` 테이블에서 요청받은 `status` 값을 가진 공방 목록을 쿼리한다. (지정되지 않은 경우 디폴트로 `status = 'PENDING'`인 심사 대기 공방만 쿼리)


3. 어드민의 상세 심사에 필요한 사업자 정보 파악을 위해, `business_documents` 테이블 및 파트너 유저 상세 정보를 테이블 조인(Join)하여 일괄적으로 로드한다.


4. 요청받은 `page`와 `limit` 값을 기반으로 SQL Offset 및 Limit 연산을 수행한다 (`Offset = (page - 1) * limit`).


5. 생성 일시(`createdAt`) 오름차순(오래된 심사 대기 건부터 처리하기 위해)으로 정렬하여 지정된 오프셋 구간의 공방 리스트를 가져온다.


6. 조건에 맞는 전체 행 개수(`totalCount`)를 집계하여 `totalPages` 등 페이징 메타데이터를 함께 계산한다.


7. 공방 목록 및 페이징 정보를 최종 응답한다.


---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T11:20:00.000Z",
  "path": "/admin/stores",
  "message": "공방 심사 목록 조회가 성공적으로 완료되었습니다.",
  "data": {
    "stores": [
      {
        "storeId": "store-uuid-001",
        "name": "성수 토담 도예공방",
        "phone": "02-1234-5678",
        "address": "서울특별시 성동구 성수이로 12길 34",
        "status": "PENDING",
        "createdAt": "2026-05-26T09:00:00.000Z",
        "partner": {
          "partnerId": "partner-uuid-101",
          "nickname": "김파트너",
          "email": "partner@example.com",
        },
        "businessDocument": {
          "documentId": "doc-uuid-001",
          "businessName": "토담 도예",
          "businessNumber": "123-45-67890",
          "ownerName": "김파트너",
          "documentUrl": "https://cdn.todam.app/documents/business-license_01.jpg",
          "ocrStatus": "VERIFIED"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "limit": 10,
      "totalCount": 1,
      "totalPages": 1
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-27T11:20:02.000Z",
  "path": "/admin/stores",
  "message": "지원하지 않는 심사 상태 값이거나, 페이징 파라미터 범위(page는 1 이상, limit은 1 이상 100 이하)가 올바르지 않습니다.",
  "data": null,
  "error": "INVALID_FILTER_PARAMETERS"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-27T11:20:03.000Z",
  "path": "/admin/stores",
  "message": "관리자 로그인이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `40`**`3 Forbidden`** 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-27T11:20:04.000Z",
  "path": "/admin/stores",
  "message": "이 API는 서비스 운영 관리자 계정으로만 조회가 가능합니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-27T11:20:08.000Z",
  "path": "/admin/stores",
  "message": "공방 심사 데이터베이스 목록 쿼리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{slug}

## 요구사항

- 사용자가 특정 공방의 상세 페이지를 확인하기 위해 공방의 고유 슬러그(`slug`)를 기반으로 상세 정보를 조회한다.
- 검수가 완료되어 공개된 공방(`status = 'PUBLISHED'`)만 일반 사용자에게 노출되며, 비공개 또는 정지된 공방은 조회가 불가능하다.
- 공방의 기본 정보(이름, 설명, 주소, 연락처) 및 편의정보(주차 여부, 반려동물 동반 여부 등)를 함께 반환한다.

---


## Request


### Headers

- Accept: application/json

### Query Parameters

- 없음 (주소창의 경로 변수 {slug}를 사용)

---


### 시스템 처리 

- 요청 경로(Path Variable)로 전달된 공방의 고유 식별 명칭(`slug`) 데이터의 유효성을 검증한다.
- `stores` 테이블에서 해당 `slug` 값을 가진 공방 레코드를 조회한다.
- 조회된 공방의 노출 상태(`status`)가 활성 공개 상태(`PUBLISHED`)인지 검증한다.
- 만약 상태가 `DRAFT`, `PENDING`, `SUSPENDED` 등 공개 상태가 아닌 경우, 일반 고객의 접근을 제한하고 404 Not Found 에러를 반환한다.
- 검증을 통과하면 공방 상세 데이터 패키지(공방 ID, 이름, 설명, 주소, 연락처, 편의정보 등)를 구성하여 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:55:00.123Z",
  "path": "/stores/todam-jeonju",
  "message": "공방 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "slug": "todam-jeonju",
      "name": "토담 전주 한옥마을점",
      "description": "한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.",
      "phone": "063-123-4567",
      "address": "전북 전주시 완산구 교동 한옥마을길 12",
      "status": "PUBLISHED",
      "convenienceInfo": {
        "parking": true,
        "pet": false,
        "wifi": true
      },
      "autoConfirm": false,
      "publishedAt": "2026-05-25T10:00:00.000Z"
    }
  },
  "error": null
}
```


### `404 Not Found (존재하지 않거나 비공개/정지 상태인 공방)`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T17:55:03.456Z",
  "path": "/stores/todam-jeonju",
  "message": "존재하지 않거나 운영자에 의해 비공개 처리된 공방입니다.",
  "data": null,
  "error": "STORE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T17:55:08.999Z",
  "path": "/stores/todam-jeonju",
  "message": "공방 상세 정보 조회 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me/notification-settings

## 요구사항

- 로그인한 사용자가 본인의 알림 채널 및 도메인별 알림 수신 동의 상태를 확인하기 위해 설정 정보를 조회한다.
- 요청 헤더의 Access Token을 기반으로 사용자를 식별하며, `notification_settings` 테이블에 기록된 활성화 여부(인앱, 이메일, 카카오톡, 예약, 작품, 배송, 마케팅 등)를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증한다.
- 토큰 내 Payload에서 사용자 고유 ID(`userId`)를 추출한다.
- `notification_settings` 테이블에서 해당 `user_id`와 일치하는 알림 설정 로우(Row)를 조회한다.
- 만약 회원가입 후 최초 조회 등의 사유로 해당 유저의 알림 설정 레코드가 존재하지 않는 경우, 전체 알림 허용(`true`) 상태의 기본 레코드를 생성하고 조회한다.
- 채널별 활성화 필드(`in_app_enabled`, `email_enabled`, `kakao_enabled`) 및 도메인별 필드(`reservation_enabled`, `artwork_enabled`, `shipping_enabled`, `marketing_enabled`) 상태 데이터를 패키징하여 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T16:45:00.123Z",
  "path": "/users/me/notification-settings",
  "message": "알림 설정 정보가 성공적으로 조회되었습니다.",
  "data": {
    "notificationSettings": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "inAppEnabled": true,
      "emailEnabled": true,
      "kakaoEnabled": true,
      "reservationEnabled": true,
      "artworkEnabled": true,
      "shippingEnabled": true,
      "marketingEnabled": false,
      "updatedAt": "2026-05-25T16:00:00.000Z"
    }
  },
  "error": null
}
```


### `401 Unauthorized (로그인 세션 만료 및 토큰 누락)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T16:45:03.456Z",
  "path": "/users/me/notification-settings",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T16:45:08.999Z",
  "path": "/users/me/notification-settings",
  "message": "알림 설정 조회 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/logout

## 요구사항

- 로그인된 사용자가 로그아웃을 요청하여 인증 세션을 종료한다.
- 서버 데이터베이스에 저장된 해당 유저의 Refresh Token을 삭제하여 무효화한다.
- 사용자의 브라우저 쿠키 영역에 존재하는 Refresh Token 쿠키를 완전히 제거한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Cookies


```javascript
refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```


### Body


```json
//비어있음
```


---


### 시스템 처리 

- 요청 헤더의 `Authorization` 필드에서 Access Token을 추출하여 유효성을 검증한다.
- 토큰 Payload에서 `userId`를 확인한다.
- 데이터베이스(`refresh_tokens` 테이블)에서 해당 사용자의 세션 정보 및 최신 Refresh Token 레코드를 찾아 안전하게 삭제(무효화)한다.
- 브라우저 쿠키 저장소에서 기존 토큰이 소멸되도록 응답 헤더의a쿠키 설정에서 `refreshToken` 값을 빈 값으로 두고 만료 시간(`Max-Age=0`)을 만료 처리한다.
- 로그아웃 완료 응답을 반환한다 (클라이언트는 브라우저 메모리에 들고 있던 Access Token을 파기한다).

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:55:00.123Z",
  "path": "/auth/logout",
  "message": "로그아웃이 성공적으로 완료되었습니다.",
  "data": null,
  "error": null
}
```


### `401 Unauthorized (이미 인증이 만료되었거나 토큰이 없는 상태)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T17:55:02.456Z",
  "path": "/auth/logout",
  "message": "로그인 정보가 없거나 이미 만료된 세션입니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:55:05.987Z",
  "path": "/auth/logout",
  "message": "로그아웃 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/refresh

## 요구사항

- Access Token이 만료되었을 때, 사용자가 보유한 Refresh Token을 기반으로 새로운 Access Token을 안전하게 재발급한다.
- 브라우저의 HttpOnly Secure Cookie 영역에 담긴 Refresh Token을 추출하여 유효성 및 만료 여부를 검증한다.
- 보안 강화를 위해 Refresh Token Rotation (RTR) 정책을 적용한다. **토큰 재발급 시 기존 Refresh Token을 즉시 폐기**하고, 새로운 만료 기한을 가진 Refresh Token을 쿠키에 재주입한다.

---


## Request


### Headers

- Accept: application/json

### Cookies


```javascript
refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYjUwYTczZi03ODVmLTQ5Y2UtODg3Yi01ZjBiYmY2N2ExZTMiLCJleHAiOjE3ODA4MzIwMDB9...
```


### Body


```json
//비어있음 (쿠키를 통해 전달)
```


---


### 시스템 처리 

- 요청 헤더의 Cookie에서 `HttpOnly Secure` 규격의 `refreshToken` 값을 추출한다.
- 추출된 Refresh Token이 없거나 유효하지 않은 경우 재발급을 중단하고 401 에러를 반환한다.
- 토큰의 Payload에서 `userId`를 추출하고, `refresh_tokens` 테이블에 저장된 해당 사용자의 최신 토큰 해시값(`token_hash`)과 일치하는지 비교 검증한다.
- 해당 사용자가 데이터베이스에 존재하지 않거나 탈퇴 회원인 경우 요청을 거부한다.
- **Refresh Token Rotation (RTR) 처리**:
    - 기존에 사용된 데이터베이스의 Refresh Token 기록을 제거하거나 무효화한다.
    - 보안 서명이 적용된 새로운 Refresh Token(만료 14일)을 생성하여 `refresh_tokens` 테이블에 새롭게 업데이트한다.
- 새롭게 생성된 Refresh Token을 `HttpOnly`, `Secure`, `SameSite=Lax` 속성의 쿠키로 설정하여 응답 헤더에 주입한다.
- 새로운 Access Token(만료 1시간, Payload에 `userId` 및 `isPartner` 포함)을 발급한다.
- 생성된 신규 Access Token을 응답 Body에 담아 최종 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:50:00.112Z",
  "path": "/auth/refresh",
  "message": "토큰이 성공적으로 재발급되었습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYjUwYTczZi03ODVmLTQ5Y2UtODg3Yi01ZjBiYmY2N2ExZTMiLCJpc1BhcnRuZXIiOmZhbHNlLCJpYXQiOjE3Nzk5NzEwMDBfQ..."
  },
  "error": null
}
```


### `401 Unauthorized (토큰 만료 혹은 유효하지 않은 구조)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T17:50:03.456Z",
  "path": "/auth/refresh",
  "message": "유효하지 않거나 만료된 Refresh Token입니다. 다시 로그인해주세요.",
  "data": null,
  "error": "INVALID_REFRESH_TOKEN"
}
```


### `401 Unauthorized (사용자 정보 매칭 실패)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T17:50:05.987Z",
  "path": "/auth/refresh",
  "message": "해당 토큰과 일치하는 사용자 정보를 찾을 수 없습니다.",
  "data": null,
  "error": "USER_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:50:10.223Z",
  "path": "/auth/refresh",
  "message": "토큰 재발급 처리 중 서버 시스템 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/reservations

## 요구사항

- 인증된 파트너가 현장·전화 예약 등을 대신 입력하는 수동 예약을 등록한다.
- `PENDING` 단계 없이 `CONFIRMED` 또는 `IN_PROGRESS` 상태로 직접 생성된다.
- `program_time_slots` 슬롯 상태(`CLOSED`) 검증 및 정원 초과 검증은 생략한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID

### Body


```json
{
  "programId": "prog-uuid-001",
  "scheduledAt": "2026-06-05T14:00:00.000Z",
  "reserverName": "박현장",
  "reserverPhone": "010-9876-5432",
  "participantCount": 1,
  "initialStatus": "CONFIRMED",
  "internalMemo": "현장 방문 예약"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- 공방 소유 권한 및 프로그램 상태(`ACTIVE`)를 검증한다.
- 정원 차감(`reserved_count` 증가)을 통계 목적으로 처리한다.
- `reservations` row를 생성한다 (`source = 'PARTNER_MANUAL'`, 상태는 `initialStatus`).
- `artworks` row를 자동 생성하고 QR 토큰을 발급한다.
- 등록 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T20:00:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "수동 예약이 성공적으로 등록되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-002",
      "reserverName": "박현장",
      "status": "CONFIRMED",
      "source": "PARTNER_MANUAL",
      "artworkId": "artwork-uuid-002",
      "createdAt": "2026-05-25T20:00:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T20:00:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "필수 입력값이 누락되었습니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:00:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "수동 예약 등록 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/stores/{storeId}/suspend

## 요구사항

- 어드민이 개별 공방의 콘텐츠·품질 문제를 사유로 해당 공방만 노출 중단한다.
- 파트너 상태에는 영향을 주지 않으며, 기존 진행 중 예약은 유지되고 신규 예약만 차단된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {adminAccessToken}

### Path Parameters

- `storeId`: 노출 중단할 공방 UUID

### Body


```json
{
  "suspendedReason": "허위 정보 게재로 인한 노출 중단 조치입니다."
}
```


---


### 시스템 처리 

- 어드민 인증 토큰을 검증한다.
- `storeId`로 공방을 조회하고 `PUBLISHED` 상태인지 확인한다.
- `stores.status = 'SUSPENDED'`, `suspended_reason`을 저장한다.
- `Partner.status`는 변경하지 않는다.
- 파트너에게 노출 중단 사유 알림을 발송한다.
- 중단 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:50:00.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/suspend",
  "message": "공방 노출이 중단되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "SUSPENDED",
      "suspendedReason": "허위 정보 게재로 인한 노출 중단 조치입니다."
    }
  },
  "error": null
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T21:50:03.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/suspend",
  "message": "PUBLISHED 상태의 공방만 노출 중단할 수 있습니다.",
  "data": null,
  "error": "INVALID_STORE_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:50:08.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/suspend",
  "message": "공방 노출 중단 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}/status

## 요구사항

- 인증된 파트너가 프로그램을 활성화(`ACTIVE`) 또는 비활성화(`INACTIVE`)한다.
- `DRAFT` → `ACTIVE` 전이(게시 완료)도 이 엔드포인트로 처리한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

### Body


```json
{
  "status": "ACTIVE"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- 공방 소유 권한 및 프로그램 소속 여부를 확인한다.
- 요청된 상태 전이가 유효한지 검증한다 (`DRAFT`→`ACTIVE`, `ACTIVE`→`INACTIVE`, `INACTIVE`→`ACTIVE`).
- `programs.status`를 갱신하고 `updated_at`을 기록한다.
- 상태 변경 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:10:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001/status",
  "message": "프로그램 상태가 성공적으로 변경되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "status": "ACTIVE",
      "updatedAt": "2026-05-25T19:10:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T19:10:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001/status",
  "message": "유효하지 않은 상태 전이입니다.",
  "data": null,
  "error": "INVALID_STATUS_TRANSITION"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:10:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001/status",
  "message": "프로그램 상태 변경 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{storeId}/favorite

## 요구사항

- 일반 고객이 공방 목록이나 상세 화면에서 하트 버튼을 눌러 특정 공방을 찜(좋아요) 등록하거나 해제한다.
- 토글(Toggle) 방식으로 동작하여, 기존에 찜한 이력이 없으면 생성하고, 이미 존재하면 제거(Delete) 처리하여 단일 API로 깔끔하게 처리한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### **Path Parameters**

- `storeId`: 찜 등록/해제할 공방 UUID

---


### 시스템 처리 

- Access Token 유효성을 확인하고 사용자 신원을 검증한다.
- `stores` 테이블에 대상 공방이 실존하는지 확인한다.
- `favorite_stores` 테이블에서 요청 유저 ID와 `storeId` 한 쌍으로 구성된 데이터가 이미 존재하는지 조회한다.
- **데이터가 존재하지 않는 경우**:
    - 새로 찜 레코드를 생성하고 성공 응답을 반환한다 (`isFavorite: true`).
- **데이터가 이미 존재하는 경우**:
    - 기존 찜 레코드를 데이터베이스에서 파기하고 성공 응답을 반환한다 (`isFavorite: false`).

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T02:35:00.000Z",
  "path": "/stores/store-uuid-001/favorite",
  "message": "공방 찜 상태가 성공적으로 변경되었습니다.",
  "data": {
    "storeId": "store-uuid-001",
    "isFavorite": true
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-27T02:35:02.000Z",
  "path": "/stores/store-uuid-001/favorite",
  "message": "찜하기 기능을 이용하려면 로그인이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `404 Not Found`


### `409 Conflict`


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T17:50:08.999Z",
  "path": "/stores",
  "message": "공방 찜 등록 중 서버에 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{slug}/programs/{programId}

## 요구사항


비인증 포함 모든 사용자가 특정 프로그램의 상세 정보를 조회할 수 있다.


---


## Request


### Headers

- Accept: application/json

### Path Parameters

- `slug`: 공방 슬러그
- `programId`: 프로그램 UUID

---


### 시스템 처리 

- `slug`로 `PUBLISHED` 상태의 공방을 조회한다.
- `programId`로 `ACTIVE` 상태의 프로그램을 조회한다.
- 프로그램 상세(이미지, 준비물, 유의사항, 수령 옵션 등)를 포함하여 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:50:00.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001",
  "message": "프로그램 상세 정보가 성공적으로 조회되었습니다.",
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
      "capacity": 6,
      "leadTimeDays": 30,
      "deliveryOption": "CUSTOMER_SELECT",
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


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:50:03.000Z",
  "path": "/stores/todam-studio/programs/prog-uuid-001",
  "message": "프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```


### `500 Internal Server Error`


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

## /auth/oauth/google

## 요구사항

- 구글 인증 로그인창을 통해 클라이언트가 획득한 인가 코드를 이용하여 서비스 자체 토큰을 발급받는다.
- 구글에서 제공하는 사용자 고유 식별자(sub), 이메일, 구글 측 이메일 인증 여부(email_verified), 이름을 확인한다.
- 구글 계정 자체의 이메일 인증이 완료되지 않은(`email_verified = false`) 계정인 경우 서비스 가입 및 로그인을 거부한다.
- 가입된 회원이면 로그인을 처리하고, 최초 소셜 로그인 접근인 경우 자동으로 신규 User를 생성(회원가입)한다.
- 구글 이메일과 동일한 이메일로 이미 가입된 기존 유저 계정이 존재할 경우, 기존 계정에 구글 소셜 연동 정보를 자동으로 연결한다.
- 로그인 성공 시 Access Token은 응답 Body로 반환하고, Refresh Token은 HttpOnly Secure Cookie로 생성하여 주입한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "code": "google_authorization_code_received_from_client"
}
```


---


### 시스템 처리 

- 요청 Body의 구글 인가 코드(`code`)가 올바르게 전송되었는지 검증한다.
- 전달받은 인가 코드로 구글 OAuth 2.0 토큰 엔드포인트를 호출하여 구글 `access_token` 및 `id_token`을 획득한다.
- 구글 사용자 정보 API를 호출하거나 토큰을 디코딩하여 유저 고유 식별자(`sub`), 이메일(`email`), 이메일 인증 여부(`email_verified`), 이름(`name`) 데이터를 추출한다.
- 구글 측 이메일 인증 여부 필드인 `email_verified` 값이 `false`인 경우 로그인을 전면 거부하고 403 에러를 반환한다.
- `oauth_accounts` 테이블에서 `provider = 'google'` 및 추출한 구글 고유 식별자(`provider_id = sub`) 조합으로 연동 데이터가 이미 존재하는지 파악한다.
- **이미 연동 데이터가 매칭되는 경우**: 연동된 `user_id`를 획득하여 즉시 서비스 자체 토큰 발급 단계(8번)로 전이한다.
- **연동 데이터가 존재하지 않는 경우**: 구글 이메일을 기준으로 `users` 테이블에서 중복 계정을 조회한다.
    - **동일 이메일의 이메일 회원가입 유저가 이미 있는 경우**: 해당 유저의 고유 ID와 구글 식별 정보를 `oauth_accounts` 테이블에 추가 바인딩(계정 연동)한다.
    - **기존 가입 정보가 전혀 없는 경우**: `users` 테이블에 신규 유저 로우를 생성(`status = 'ACTIVE'`, `emailVerified = true`, `is_partner = false`)한 뒤, `oauth_accounts`에 구글 연동 이력을 함께 생성한다.
- 토담 서비스 전용 인증 토큰 패키지를 생성한다.
    - **Access Token**: 유효기간 1시간, Payload 주머니에 `userId` 및 `isPartner` 권한 플래그 주입
    - **Refresh Token**: 유효기간 14일, 암호화용 단방향 해시값을 `refresh_tokens` 테이블에 upsert 형태로 적재
- 생성한 Refresh Token을 `HttpOnly Secure Cookie` 규격으로 클라이언트 브라우저에 밀어 넣고, Access Token과 유저 프로필 스냅샷 정보를 담아 최종 성공 응답을 전달한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:45:00.312Z",
  "path": "/auth/oauth/google",
  "message": "구글 소셜 로그인에 성공했습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjM2Q0ZTVmNi1hYmNkLTEyMzQtNTY3OC1lZjAxMjM0NTY3ODkiLCJpc1BhcnRuZXIiOmZhbHNlLCJpYXQiOjE3Nzk5Njg2MDBfQ...",
    "user": {
      "userId": "c3d4e5f6-abcd-1234-5678-ef0123456789",
      "email": "user@example.com",
      "nickname": "구글토담이",
      "isPartner": false
    }
  },
  "error": null
}
```


### `400 Bad Request (인가 코드 누락 및 유효성 실패)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:45:03.981Z",
  "path": "/auth/oauth/google",
  "message": "구글 인가 코드가 누락되었거나 변조되었습니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `403 Forbidden (구글 측 이메일 미인증 상태 계정)`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-24T17:45:06.115Z",
  "path": "/auth/oauth/google",
  "message": "구글 서비스 내에서 이메일 인증을 받지 않은 구글 계정은 접근이 불가능합니다.",
  "data": null,
  "error": "GOOGLE_EMAIL_UNVERIFIED"
}
```


### `500 Internal Server Error (구글 API 통신 장애)`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:45:10.554Z",
  "path": "/auth/oauth/google",
  "message": "구글 인증 시스템과의 통신 연동 과정에서 예외 장애가 발생했습니다.",
  "data": null,
  "error": "EXTERNAL_AUTH_SERVER_ERROR"
}
```

---

## /partner/reservations/{reservationId}/confirm

## 요구사항

- 인증된 파트너가 `PENDING` 상태의 예약을 `CONFIRMED`로 확정한다.
- 확정 시 `artworks` row가 자동 생성되고 QR 토큰이 발급된다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 확정할 예약 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `reservationId`로 예약을 조회하고 해당 공방의 소유 파트너인지 확인한다.
- 예약 상태가 `PENDING`인지 검증한다.
- `reservations.status = 'CONFIRMED'`로 갱신한다.
- `artworks` row를 생성하고 (`status = 'RESERVED'`) QR 토큰을 발급한다.
- 고객에게 예약 확정 알림을 발송한다.
- 확정 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:05:00.000Z",
  "path": "/partner/reservations/res-uuid-001/confirm",
  "message": "예약이 성공적으로 확정되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "status": "CONFIRMED",
      "artworkId": "artwork-uuid-001",
      "updatedAt": "2026-05-25T20:05:00.000Z"
    }
  },
  "error": null
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T20:05:03.000Z",
  "path": "/partner/reservations/res-uuid-001/confirm",
  "message": "PENDING 상태의 예약만 확정할 수 있습니다.",
  "data": null,
  "error": "INVALID_RESERVATION_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:05:08.000Z",
  "path": "/partner/reservations/res-uuid-001/confirm",
  "message": "예약 확정 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me/favorite-stores

## 요구사항

- 로그인한 일반 고객이 자신이 마이페이지 등에서 찜(즐겨찾기)해 둔 공방 목록을 한눈에 조회한다.
- 모바일 무한스크롤 UI를 고려하여, 커서(Cursor) 기반 페이지네이션을 적용한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### **Query Parameters**

- `cursor`: 페이지네이션용 다음 데이터 조회 시작점 (선택)
- `limit`: 한 번에 조회할 최대 공방 수 (기본값: 10)

---


### 시스템 처리 

- Access Token 유효성을 확인하여 사용자 신원을 검증한다.
- `favorite_stores` 테이블에서 유저 ID를 조건으로 걸고 찜한 공방 레코드 목록을 Join하여 조회한다.
- `stores` 테이블에서 공방 상태가 `PUBLISHED` 상태인 노출 활성 공방 정보(대표 이미지, 공방명, 카테고리 등)를 매칭하여 정렬 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T02:38:00.000Z",
  "path": "/users/me/favorite-stores",
  "message": "찜한 공방 목록 조회가 완료되었습니다.",
  "data": {
    "favoriteStores": [
      {
        "favoriteId": "fav-uuid-101",
        "storeId": "store-uuid-001",
        "name": "토담 공방 성수점",
        "imageUrl": "https://cdn.todam.app/stores/todam-studio/01_thumb.jpg",
        "address": "서울특별시 성동구 성수이로 12길",
        "createdAt": "2026-05-26T12:00:00.000Z"
      }
    ],
    "nextCursor": "fav-uuid-101"
  },
  "error": null
}
```


### `400 Bad Request` 


### `401 Unauthorized`


### `404 Not Found`


### `409 Conflict`


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:10:08.000Z",
  "path": "/partner/stores",
  "message": "공방 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/partners/{PartnerId}/suspend

## 요구사항

- 어드민이 정책 위반을 사유로 파트너 전체 운영을 제한한다.
- `APPROVED` 상태의 파트너만 정지할 수 있으며, 연결된 모든 공방이 `SUSPENDED`, 모든 프로그램이 `INACTIVE`로 cascade 전이된다.
- `PENDING` 상태 예약이 자동 취소되고 고객에게 취소 알림이 발송된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {adminAccessToken}

### Path Parameters

- `partnerId`: 정지할 파트너 UUID

### Body


```json
{
  "suspendedReason": "서비스 운영 정책 위반으로 인한 강제 정지 조치입니다."
}
```


---


### 시스템 처리 

- 어드민 인증 토큰을 검증한다.
- `partnerId`로 파트너를 조회하고 `APPROVED` 상태인지 확인한다.
- `suspendedReason` 필수 여부를 검증한다.
- 해당 파트너의 `PENDING` 예약을 자동 취소 처리하고 고객에게 취소 알림을 발송한다.
- `partners.status = 'SUSPENDED'`로 갱신한다.
- 연결된 모든 `stores.status = 'SUSPENDED'`로 cascade 전이한다.
- 연결된 모든 `programs.status = 'INACTIVE'`로 cascade 전이한다.
- 파트너에게 정지 사유 이메일 알림을 발송한다.
- 정지 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T22:00:00.000Z",
  "path": "/admin/partners/d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a/suspend",
  "message": "파트너가 강제 정지되었습니다.",
  "data": {
    "partner": {
      "id": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "status": "SUSPENDED",
      "suspendedAt": "2026-05-25T22:00:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T22:00:03.000Z",
  "path": "/admin/partners/d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a/suspend",
  "message": "정지 사유를 입력해주세요.",
  "data": null,
  "error": "SUSPENSION_REASON_REQUIRED"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T22:00:04.000Z",
  "path": "/admin/partners/d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a/suspend",
  "message": "이미 해지된 파트너입니다.",
  "data": null,
  "error": "PARTNER_ALREADY_TERMINATED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T22:00:08.000Z",
  "path": "/admin/partners/d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a/suspend",
  "message": "파트너 강제 정지 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/reservations

## 요구사항

- 인증된 파트너가 본인 공방의 전체 예약 목록을 조회한다.
- 날짜, 상태, 클래스별 필터링 및 커서 기반 무한 스크롤을 지원한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID

### Query Parameters

- `date`: 날짜 필터 (선택, 예: `2026-06-01`)
- `status`: 예약 상태 필터 (선택)
- `programId`: 프로그램 필터 (선택)
- `cursor`: 이전 응답의 `nextCursor` 값 (선택, 첫 요청 시 생략)
- `limit`: 한 번에 가져올 항목 수 (기본값: 20)

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- 공방 소유 권한을 확인한다.
- 필터 조건을 적용하고 `cursor` 이후 데이터를 `limit + 1`개 조회하여 다음 페이지 존재 여부를 확인한다.
- 예약 목록을 체험일시순으로 정렬하고 `nextCursor`를 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:55:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "예약 목록이 성공적으로 조회되었습니다.",
  "data": {
    "reservations": [
      {
        "id": "res-uuid-001",
        "programTitle": "물레 체험 기초반",
        "scheduledAt": "2026-06-01T10:00:00.000Z",
        "reserverName": "김토담",
        "participantCount": 2,
        "status": "CONFIRMED",
        "source": "CUSTOMER",
        "createdAt": "2026-05-25T19:35:00.000Z"
      }
    ],
    "nextCursor": "res-uuid-002",
    "hasMore": true
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T19:55:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "해당 공방에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:55:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reservations",
  "message": "예약 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/oauth/kakao

## 요구사항

- 카카오 인증 로그인 창을 통해 발급받은 인가 코드를 이용하여 서비스 토큰을 발급받는다.
- 카카오에서 제공하는 사용자 식별자, 이메일, 닉네임을 확인한다.
- 이미 가입된 회원이면 로그인을 처리하고, 최초 접근인 경우 자동으로 신규 User를 생성(회원가입)한다.
- 카카오 이메일과 동일한 이메일로 가입된 이메일 기반 기존 회원이 존재할 경우, 해당 계정에 카카오 식별자를 자동으로 연결(연동)한다.
- 로그인 성공 시 Access Token은 응답 Body로, Refresh Token은 HttpOnly Secure Cookie로 설정한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "code": "kakao_authorization_code_received_from_client"
}
```


---


### 시스템 처리 

- 요청 Body의 카카오 인가 코드(`code`)가 포함되었는지 검증한다.
- 전달받은 코드로 카카오 토큰 발급 API를 호출하여 카카오 `access_token`을 획득한다.
- 획득한 토큰으로 카카오 사용자 정보 API를 호출하여 유저의 고유 식별자(`provider_id`), 이메일(`email`), 닉네임(`nickname`)을 확인한다.
- `oauth_accounts` 테이블에서 `provider = 'kakao'` 및 추출한 `provider_id` 조합으로 이미 연동된 계정이 있는지 조회한다.
- **이미 연동된 계정이 있는 경우**: 매칭된 `user_id`를 기반으로 즉시 서비스 JWT 토큰 발급 단계(7번)로 이동한다.
- **연동된 계정이 없는 경우**: 카카오에서 제공한 이메일을 기준으로 `users` 테이블을 조회한다.
    - **동일 이메일의 기존 회원이 있는 경우**: 해당 유저 ID와 카카오 고유 식별자를 `oauth_accounts` 테이블에 새로 추가(계정 연동)한다.
    - **기존 회원이 없는 경우**: `users` 테이블에 신규 유저 row를 생성(`status = 'ACTIVE'`, `emailVerified = true`)하고, `oauth_accounts`에 카카오 연동 정보를 생성한다.
- 자체 서비스용 인증 토큰을 발급한다.
    - **Access Token**: 만료 1시간, Payload에 `userId` 및 `isPartner` 권한 포함
    - **Refresh Token**: 만료 14일, `refresh_tokens` 테이블에 해시값 저장 및 최신화
- Refresh Token을 `HttpOnly Secure Cookie`로 설정하고, Access Token과 유저 기본 프로필 정보를 포함하여 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:40:00.124Z",
  "path": "/auth/oauth/kakao",
  "message": "카카오 소셜 로그인에 성공했습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMWIyYzNkNC1lNWY2LTdhOGItOWMwZC0xZTJmM2E0YjVjNmQiLCJpc1BhcnRuZXIiOmZhbHNlLCJpYXQiOjE3Nzk5Njg2MDBfQ...",
    "user": {
      "userId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "email": "user@example.com",
      "nickname": "카카오토담",
      "isPartner": false
    }
  },
  "error": null
}
```


### `400 Bad Request (인가 코드 누락 및 유효성 실패)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:40:03.456Z",
  "path": "/auth/oauth/kakao",
  "message": "유효하지 않은 인가 코드이거나 카카오 인증에 실패했습니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `500 Internal Server Error (카카오 API 통신 장애 등)`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:40:08.987Z",
  "path": "/auth/oauth/kakao",
  "message": "카카오 인증 처리 중 외부 인증 서버 오류가 발생했습니다.",
  "data": null,
  "error": "EXTERNAL_AUTH_SERVER_ERROR"
}
```

---

## /reservations/{reservationId}

## 요구사항

- 인증된 사용자가 본인 예약의 상세 정보를 조회한다.
- `displayState`가 포함된 전체 예약 정보를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 예약 UUID

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `reservationId`로 예약을 조회하고 소유자가 요청자와 일치하는지 확인한다.
- `Reservation.status`와 `Artwork.status`를 조합하여 `displayState`를 계산한다.
- 예약 상세(공방명, 프로그램명, 체험일, 참가자 정보, 수령 방법 등)를 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:45:00.000Z",
  "path": "/reservations/res-uuid-001",
  "message": "예약 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "storeId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "storeName": "토담 공방",
      "programId": "prog-uuid-001",
      "programTitle": "물레 체험 기초반",
      "scheduledAt": "2026-06-01T10:00:00.000Z",
      "reserverName": "김토담",
      "reserverPhone": "010-1234-5678",
      "participantCount": 2,
      "deliveryMethod": "DELIVERY",
      "shippingAddress": "서울특별시 마포구 월드컵북로 12, 101호",
      "requestMemo": "왼손잡이라 주의 부탁드립니다.", // 메모 필드 없어도 됨, 배송 정보 필요
      "status": "IN_PROGRESS",
      "displayState": {
        "label": "제작 중",
        "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
        "subLabel": "건조"
      },
      "artworkId": "artwork-uuid-001",
      "createdAt": "2026-05-25T19:35:00.000Z"
    }
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T19:45:03.000Z",
  "path": "/reservations/res-uuid-001",
  "message": "해당 예약에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:45:08.000Z",
  "path": "/reservations/res-uuid-001",
  "message": "예약 상세 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:45:08.000Z",
  "path": "/reservations/res-uuid-001",
  "message": "예약 상세 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/submit

## 요구사항

- 인증된 파트너가 `DRAFT` 또는 `REJECTED` 상태의 공방을 어드민 검수 대기(`PENDING`) 상태로 제출한다.
- 제출 전 필수 정보(공방명, 주소, 대표 이미지, 사업자등록번호, 사업자등록증 이미지)가 모두 입력되어 있어야 한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 제출할 공방 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고 소유 권한을 확인한다.
- 공방 상태가 `DRAFT` 또는 `REJECTED`인지 검증한다.
- 필수 항목(이름, 주소, 대표 이미지 1장 이상, 사업자 서류)이 모두 갖춰졌는지 검증한다.
- `stores.status = 'PENDING'`으로 전이한다.
- 어드민 검수 대기 알림을 발송한다.
- 제출 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:25:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
  "message": "공방 검수 신청이 완료되었습니다. 검수 결과를 기다려 주세요.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "PENDING",
      "updatedAt": "2026-05-25T18:25:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T18:25:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
  "message": "필수 정보가 누락되어 제출할 수 없습니다. 대표 이미지를 등록해주세요.",
  "data": null,
  "error": "MISSING_REQUIRED_FIELDS"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:25:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
  "message": "해당 공방에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T18:25:05.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
  "message": "DRAFT 또는 REJECTED 상태의 공방만 제출할 수 있습니다.",
  "data": null,
  "error": "INVALID_STORE_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:25:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/submit",
  "message": "공방 제출 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/artworks/count-by-step

## 요구사항

- 파트너 홈 화면의 요약 대시보드(건조, 초벌, 유약, 재벌 수량 카운트 UI) 구성에 필요한 데이터 지원을 위해, 로그인한 파트너 공방의 실시간 제작단계별 작품 개수 카운트를 단일 집계로 가져온다.
- 데이터 정합성을 위해 취소된 작품(`CANCELED`) 및 최종 완성되어 고객에게 수령이 완결된 작품은 집계 목록에서 자동 제외하고, 현재 공방에서 실제 활성 작업 진행 중인 작품들만 카운팅한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### **Query Parameters**

- `storeId`: 특정 공방 소속 작품만 필터링 조회할 경우의 공방 UUID (선택, 다수의 공방을 소유한 파트너 지원용)

---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 파트너 capability 권한을 확인한다.
- 파트너 계정과 연동된 소유 공방 정보를 대조한다. (만약 `storeId` 파라미터가 명시적으로 존재한다면, 파트너 소유의 공방이 맞는지 소유 권한을 철저히 검증한다.)
- `artworks` 테이블에서 해당 공방 ID를 참조하며, 작품 상태가 `CANCELED`가 아닌 활성 레코드들을 색인한다.
- 작품 제작 단계 필드(예: `DRYING` (건조), `BISQUE_FIRING` (초벌), `GLAZING` (유약), `GLAZE_FIRING` (재벌))별로 SQL Group By 집계를 통해 실시간 작품 수 카운트를 계산한다.
- 단계별 누적 작품 수 리스트를 정갈한 Key-Value 데이터 구조로 가공하여 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T20:10:00.000Z",
  "path": "/partner/artworks/count-by-step",
  "message": "제작단계별 작품 수 조회가 완료되었습니다.",
  "data": {
    "drying": 12,
    "bisqueFiring": 8,
    "glazing": 4,
    "glazeFiring": 2
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-26T20:10:02.000Z",
  "path": "/partner/artworks/count-by-step",
  "message": "만료되거나 유효하지 않은 파트너 Access Token 자격 증명입니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-26T20:10:04.000Z",
  "path": "/partner/artworks/count-by-step",
  "message": "요청하신 공방 정보에 대한 데이터 조회 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T20:10:08.000Z",
  "path": "/partner/artworks/count-by-step",
  "message": "제작단계별 작품 수 실시간 집계 쿼리 연산 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/login

## 요구사항

- 사용자가 이메일과 비밀번호를 입력하여 서비스 계정에 로그인한다.
- 로그인 요청 시 이메일 형식, 가입 여부, 이메일 인증 완료 여부, 비밀번호 일치 여부를 순차적으로 검증한다.
- 로그인이 성공하면 시스템은 인증 토큰(Access Token 및 Refresh Token)을 발급한다.
- 서비스 보안 강화를 위해 Access Token은 응답 Body로 반환하고, Refresh Token은 HttpOnly Secure Cookie로 설정한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "user@example.com",
  "password": "Password1234!"
}
```


---


### 시스템 처리 

1. 요청 Body의 필수값(이메일, 비밀번호)이 누락되었는지 검증한다.
2. 이메일 데이터의 형식 유효성을 검증한다.
3. 입력된 이메일로 가입된 사용자(`users`)가 존재하는지 조회한다.
4. 해당 사용자의 이메일 인증 완료 여부(`emailVerified = true`)를 확인한다. 인증이 미완료된 경우 로그인을 제한한다.
5. 입력된 비밀번호를 해시화하여 DB에 저장된 비밀번호(`password`)와 일치하는지 검증한다.
6. 비밀번호가 일치하면 사용자의 파트너 자격 보유 여부(`is_partner`)를 함께 조회하여 인증 토큰을 발급한다.
    - **Access Token**: 만료 시간 1시간, Payload에 `userId` 및 `isPartner` 값 포함
    - **Refresh Token**: 만료 시간 14일, `refresh_tokens` 테이블에 해당 유저의 토큰 해시값을 저장 및 갱신
7. 발급된 Refresh Token을 `HttpOnly Secure Cookie` 형태로 브라우저 쿠키 저장소에 등록한다.
8. Access Token 및 유저의 기본 프로필 정보를 담아 로그인 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:35:00.242Z",
  "path": "/auth/login",
  "message": "로그인에 성공했습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYjUwYTczZi03ODVmLTQ5Y2UtODg3Yi01ZjBiYmY2N2ExZTMiLCJpc1BhcnRuZXIiOmZhbHNlLCJpYXQiOjE3Nzk5Njg2MDBfQ...",
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "토담이",
      "isPartner": false
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:35:03.112Z",
  "path": "/auth/login",
  "message": "유효하지 않은 이메일 형식입니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T17:35:05.817Z",
  "path": "/auth/login",
  "message": "이메일 또는 비밀번호가 일치하지 않습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `403 Forbidden (이메일 인증 미완료)`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-24T17:35:08.456Z",
  "path": "/auth/login",
  "message": "이메일 인증이 완료되지 않은 계정입니다.",
  "data": null,
  "error": "EMAIL_UNVERIFIED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:35:12.987Z",
  "path": "/auth/login",
  "message": "로그인 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/reservations/{reservationId}/qr-label

## 요구사항

- 인증된 파트너가 `CONFIRMED` 상태의 예약에 대한 QR 라벨을 조회하고 PDF로 다운로드한다.
- QR 라벨에는 예약번호·클래스명·체험일시·인원·예약자명이 포함된다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 예약 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `reservationId`로 예약을 조회하고 공방 소유 권한을 확인한다.
- 예약 상태가 `CONFIRMED` 이상인지 검증한다.
- 연결된 `artworks`의 QR 토큰을 조회한다.
- 예약 정보와 QR 코드 이미지를 포함한 라벨 PDF를 생성한다.
- PDF 파일을 응답으로 반환한다.

---


## Response


### `200 OK`


```json
Content-Type: application/pdf
Content-Disposition: attachment; filename="qr-label-res-uuid-001.pdf"

//(PDF 바이너리)
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T20:50:03.000Z",
  "path": "/partner/reservations/res-uuid-001/qr-label",
  "message": "CONFIRMED 이상 상태의 예약만 QR 라벨을 출력할 수 있습니다.",
  "data": null,
  "error": "INVALID_RESERVATION_STATUS"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T20:50:04.000Z",
  "path": "/partner/reservations/res-uuid-001/qr-label",
  "message": "QR 토큰을 찾을 수 없습니다.",
  "data": null,
  "error": "QR_TOKEN_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:50:08.000Z",
  "path": "/partner/reservations/res-uuid-001/qr-label",
  "message": "QR 라벨 생성 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me

## 요구사항

- 인증된 일반 사용자가 서비스 회원 탈퇴를 수행하여 모든 개인정보를 익명화 처리한다.
- 탈퇴 진행 시 본인 확인을 위해 이메일 계정 유저는 비밀번호를 재입력받고, 소셜 계정 유저는 소셜 재인증 토큰을 검증한다.
- 진행 중인 예약(PENDING, CONFIRMED) 및 아직 완료/배송되지 않은 작품이 존재하는 경우 탈퇴를 제한한다.
- 탈퇴가 완료되면 즉시 데이터베이스의 Refresh Token 세션을 무효화하고 쿠키를 만료 처리한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Body


```json
//이메일 가입 유저의 경우
{
  "password": "Password1234!"
}
```


```json
//소셜 가입 유저의 경우
{
  "oAuthAccessToken": "social_access_token_for_unlink_verification"
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 유저 식별자(`userId`)를 확인한다.
- **탈퇴 불가 조건 검증**을 수행한다:
    - `reservations` 테이블에서 해당 유저의 예약 중 상태가 `PENDING` 또는 `CONFIRMED`인 건이 있는지 조회한다. 존재 시 탈퇴 거부.
    - `artworks` 테이블에서 해당 유저와 연동된 작품 중 최종 완료/종료 단계(`COMPLETED`, `CANCELED` 등)가 아닌 진행 중인 작품이 있는지 조회한다. 존재 시 탈퇴 거부.
- **본인 재확인 검증**을 수행한다:
    - 이메일 유저: 입력된 `password`를 해시화하여 DB에 저장된 비밀번호와 일치하는지 검증한다.
    - 소셜 유저: 제공된 소셜 토큰을 통해 외부 인증 기관(카카오/구글)에 회원 유효성을 검증한다.
- 검증 성공 시 `users` 테이블의 해당 유저 상태를 업데이트한다: `status = 'WITHDRAWN'`, `withdrawn_at = now()`.
- `oauth_accounts` 테이블에서 해당 유저의 소셜 연동 정보를 전면 삭제한다.
- `refresh_tokens` 테이블에서 해당 사용자의 모든 리프레시 토큰 레코드를 삭제한다.
- 응답 헤더의 쿠키 설정에서 `refreshToken` 값을 비우고 만료 시간(`Max-Age=0`)을 주어 쿠키를 만료시킨다.
- 회원 탈퇴 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T16:40:00.115Z",
  "path": "/users/me",
  "message": "회원 탈퇴가 정상적으로 처리되었습니다.",
  "data": null,
  "error": null
}
```


### `400 Bad Request (비밀번호 불일치 및 인증 실패)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T16:40:03.224Z",
  "path": "/users/me",
  "message": "본인 확인을 위한 인증 정보가 일치하지 않습니다.",
  "data": null,
  "error": "PASSWORD_MISMATCH"
}
```


### `400 Bad Request (진행 중인 예약 또는 작품 존재)`


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T16:40:05.456Z",
  "path": "/users/me",
  "message": "진행 중인 클래스 예약 또는 제작 중인 도자기 작품이 남아있어 탈퇴가 불가능합니다.",
  "data": null,
  "error": "ACTIVE_RESERVATIONS_OR_ARTWORKS_EXIST"
}
```


### `401 Unauthorized (인증 만료)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T16:40:08.123Z",
  "path": "/users/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T16:40:12.842Z",
  "path": "/users/me",
  "message": "회원 탈퇴 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/stores/{storeId}/restore

## 요구사항

- 어드민이 `SUSPENDED` 상태의 공방을 `PUBLISHED`로 복원하여 노출을 재개한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {adminAccessToken}

### **Path Parameters**

- `storeId`: 노출 재개할 공방 UUID

---


### 시스템 처리 

- 어드민 인증 토큰을 검증한다.
- `storeId`로 공방을 조회하고 `SUSPENDED` 상태인지 확인한다.
- `stores.status = 'PUBLISHED'`, `suspended_reason = null`로 갱신한다.
- 파트너에게 노출 재개 알림을 발송한다.
- 재개 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:55:00.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/restore",
  "message": "공방 노출이 재개되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "PUBLISHED",
      "updatedAt": "2026-05-25T21:55:00.000Z"
    }
  },
  "error": null
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T21:55:03.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/restore",
  "message": "SUSPENDED 상태의 공방만 노출 재개할 수 있습니다.",
  "data": null,
  "error": "INVALID_STORE_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:55:08.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/restore",
  "message": "공방 노출 재개 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/search

## 요구사항



• 비로그인 사용자를 포함한 모든 사용자가 검색창에 키워드 검색을 제출하거나 지역, 카테고리 필터를 적용해 최적화된 클래스/공방 통합 검색 결과를 획득한다.


---


## Request


### Headers

- Accept: application/json

### **Query Parameter**s

- `keyword`: 검색창에 입력 제출된 텍스트 검색어 (선택, 예: `도자기`)
- `region`: 서울특별시 자치구 등의 지역 필터 조건 (선택, 예: `성동구`)
- `category`: 물레, 핸드빌딩 등 프로그램 분류 카테고리 필터 (선택, 예: `물레`)
- `limit`: 한 번에 노출할 검색 항목 수 (기본값: 10, **Cursor 기반 페이징 연동 가능**)

---


### 시스템 처리 

- 전달받은 다차원 검색 필터 조건 파라미터들의 조합을 분석한다.
- 데이터베이스 `programs` 테이블과 `stores` 테이블을 Left Join으로 바인딩한다.
- 공방 노출 상태가 `PUBLISHED`이고, 프로그램 상태가 `ACTIVE`인 활성화 데이터 중, 조건에 교집합 형태로 부합하는 레코드를 쿼리한다.
- 검색 결과 평점, 리뷰 개수, 프로그램 가격 및 대표 이미지, 공방 상세 주소를 규격화하여 리스트 형태로 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:38:00.000Z",
  "path": "/stores/search",
  "message": "통합 검색 결과 조회가 완료되었습니다.",
  "data": {
    "results": [
      {
        "type": "PROGRAM",
        "id": "prog-uuid-001",
        "title": "물레 체험 기초반",
        "storeName": "토담 공방",
        "imageUrl": "https://cdn.todam.app/programs/prog-uuid-001/thumb.jpg",
        "price": 50000,
        "rating": 4.8,
        "reviewCount": 42,
        "region": "서울특별시 성동구"
      }
    ]
  },
  "error": null
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T19:38:08.000Z",
  "path": "/stores/search",
  "message": "다차원 공방/프로그램 통합 검색 쿼리 수행 중 예외가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/documents

## 요구사항

- 인증된 파트너가 사업자등록증 이미지를 업로드하면, OCR을 통해 사업자명·사업자등록번호·대표자명·사업장 주소를 자동 추출한다.
- 추출 결과를 파트너가 검토·수정할 수 있도록 반환한다.
- 국세청 사업자 진위 확인 API를 호출하여 사업자번호의 실제 유효성을 검증한다.

---


## Request


### Headers

- Content-Type: multipart/form-data
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 대상 공방 UUID

### Body


```json
documentImage: (파일, JPG/PNG/PDF, 최대 5MB)
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고 소유 권한을 확인한다.
- 업로드된 이미지를 S3에 저장한다.
- Google Vision OCR API를 호출하여 사업자 정보를 추출한다.
- 국세청 사업자 진위 확인 API를 호출하여 사업자번호를 검증한다.
- `business_documents` row를 생성하고 OCR 추출 결과 및 검증 상태를 저장한다.
- 추출된 정보를 파트너가 확인·수정할 수 있도록 응답에 포함한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T18:30:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/documents",
  "message": "사업자등록증 OCR 추출이 완료되었습니다. 내용을 확인해주세요.",
  "data": {
    "document": {
      "id": "doc-uuid-001",
      "documentUrl": "https://s3.amazonaws.com/todam/docs/business-license.jpg",
      "ocrStatus": "VERIFIED",
      "extractedData": {
        "ownerName": "김토담",
        "businessName": "토담 공방",
        "businessNumber": "123-45-67890",
        "businessAddress": "서울특별시 성동구 성수이로 12길 34"
      },
      "verifiedAt": "2026-05-25T18:30:05.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T18:30:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/documents",
  "message": "사업자 진위 확인에 실패했습니다. 사업자등록번호를 다시 확인해주세요.",
  "data": null,
  "error": "BUSINESS_VERIFICATION_FAILED"
}
```


### `422 Unprocessable Entity`


```json
{
  "statusCode": 422,
  "timestamp": "2026-05-25T18:30:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/documents",
  "message": "사업자등록증에서 정보를 추출하지 못했습니다. 이미지를 다시 업로드해주세요.",
  "data": null,
  "error": "OCR_EXTRACTION_FAILED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:30:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/documents",
  "message": "사업자 서류 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/search/autocomplete

## 요구사항


---


## Request


### Headers

- Accept: application/json

### **Query Parameters**

- `keyword`: 실시간 입력 도중인 검색어 키워드 (필수, 예: `물레`)

---


### 시스템 처리 

- 필수 쿼리 스트링 파라미터 `keyword`가 전달되었는지, 공백은 아닌지 유효성을 체크한다.
- `stores` 테이블에서 `PUBLISHED` 상태인 공방명 중 키워드가 부분 매칭되는 레코드를 조회하여 최대 5건 패키징한다.
- `programs` 테이블에서 `ACTIVE` 상태인 프로그램명 중 키워드가 부분 매칭되는 레코드를 조회하여 최대 5건 패키징한다.
- 공방 및 프로그램 검색 리스트를 일관된 Suggestion 규격(`type`, `id`, `text`)으로 통합 포맷팅하여 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:35:00.000Z",
  "path": "/stores/search/autocomplete",
  "message": "자동완성 목록 조회가 완료되었습니다.",
  "data": {
    "suggestions": [
      {
        "type": "STORE",
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "text": "토담 공방"
      },
      {
        "type": "PROGRAM",
        "id": "prog-uuid-001",
        "text": "물레 체험 기초반"
      }
    ]
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:35:02.000Z",
  "path": "/stores/search/autocomplete",
  "message": "실시간 자동완성을 위한 필수 파라미터(keyword)가 비어 있습니다.",
  "data": null,
  "error": "KEYWORD_REQUIRED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T19:35:08.000Z",
  "path": "/stores/search/autocomplete",
  "message": "실시간 검색어 자동제안 색인 쿼리 수행에 실패했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me/notification-settings

## 요구사항

- 로그인한 사용자가 본인의 알림 채널(인앱, 이메일, 카카오톡) 및 도메인별 알림(예약, 작품, 배송, 마케팅) 수신 동의 설정을 변경한다.
- 수정 요청 시 일부 필드만 선택적으로 변경하는 부분 업데이트(Partial Update)를 지원한다.
- 알림 설정 변경이 완료되면 최신 알림 수신 동의 상태 정보를 반환한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Body


```json
{
  "inAppEnabled": true,
  "emailEnabled": false,
  "kakaoEnabled": true,
  "reservationEnabled": true,
  "artworkEnabled": true,
  "shippingEnabled": true,
  "marketingEnabled": true
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 유저 식별자(`userId`)를 확인한다.
- 요청 Body에 포함된 각 알림 설정 필드들의 데이터 타입이 올바른 Boolean(true/false) 형태인지 검증한다.
- `notification_settings` 테이블에서 해당 `user_id`와 일치하는 알림 설정 레코드가 존재하는지 확인한다. (만약 레코드가 없다면 신규 row를 기본값으로 생성한 후 단계를 진행한다)
- Body에 포함되어 전달된 필드값들만 매칭하여 `notification_settings` 테이블의 값을 부분 수정(Update)하고, `updated_at` 시각을 `now()`로 갱신한다.
- 최종적으로 수정이 완료된 유저의 최신 알림 설정 데이터 패키지를 성공 응답으로 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T16:50:00.342Z",
  "path": "/users/me/notification-settings",
  "message": "알림 설정이 성공적으로 수정되었습니다.",
  "data": {
    "notificationSettings": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d4e5",
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "inAppEnabled": true,
      "emailEnabled": false,
      "kakaoEnabled": true,
      "reservationEnabled": true,
      "artworkEnabled": true,
      "shippingEnabled": true,
      "marketingEnabled": true,
      "updatedAt": "2026-05-25T16:50:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request (올바르지 않은 데이터 형식)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T16:50:02.115Z",
  "path": "/users/me/notification-settings",
  "message": "알림 설정 값은 Boolean 형태(true 또는 false)여야 합니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T16:50:04.981Z",
  "path": "/users/me/notification-settings",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T16:50:10.554Z",
  "path": "/users/me/notification-settings",
  "message": "알림 설정 수정 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /admin/stores/{storeId}/reject

## 요구사항

- 어드민이 `PENDING` 상태의 공방을 반려하여 `REJECTED`로 전이한다.
- 반려 사유를 필수로 입력해야 하며, 파트너에게 반려 사유를 전달한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {adminAccessToken}

### Path Parameters

- `storeId`: 반려할 공방 UUID

### Body


```json
{
  "rejectedReason": "사업자등록증 이미지가 불명확합니다. 선명한 이미지로 재업로드해주세요."
}
```


---


### 시스템 처리 

- 어드민 인증 토큰을 검증한다.
- `storeId`로 공방을 조회하고 `PENDING` 상태인지 확인한다.
- `rejectedReason` 필수 여부를 검증한다.
- `stores.status = 'REJECTED'`, `rejected_reason`을 저장한다.
- 첫 번째 공방인 경우 `partners.status = 'PENDING'`을 유지한다.
- 파트너에게 반려 사유를 포함한 알림을 발송한다.
- 반려 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:45:00.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reject",
  "message": "공방 심사가 반려되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "REJECTED",
      "rejectedReason": "사업자등록증 이미지가 불명확합니다. 선명한 이미지로 재업로드해주세요."
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T21:45:03.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reject",
  "message": "반려 사유를 입력해주세요.",
  "data": null,
  "error": "REJECTION_REASON_REQUIRED"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T21:45:04.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reject",
  "message": "이미 처리된 공방입니다.",
  "data": null,
  "error": "ALREADY_PROCESSED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:45:08.000Z",
  "path": "/admin/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/reject",
  "message": "공방 심사 반려 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /review/images/presigned

## 요구사항


---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Cookies

- 

### Body


---


### 시스템 처리 


---


## Response


### `200 OK`


### `400 Bad Request` 


### `401 Unauthorized`


### `404 Not Found`


### `409 Conflict`


### `500 Internal Server Error`

---

## /reviews/{reviewId}

## 요구사항

- 리뷰를 직접 작성한 본인 계정으로만 수정 요청이 가능하며, `IN_PROGRESS` 상태 도달 시점으로부터 30일 이내에만 수정할 수 있습니다.
- 수정 완료 요청 시 최종 확정된 사진의 S3 Key 문자열 목록 전체(`photos`)를 전송받아 기존 기록을 일괄 파기(Cascade)하고 새로운 데이터로 통째로 갱신 등록합니다.

---


## Request


### Headers

- Content-Type: multipart/form-data
- Accept: application/json
- Authorization: Bearer {accessToken}

### **Path Parameters**

- `reviewId`: 수정할 리뷰 UUID

### Body


```json
{
  "rating": 4,
  "content": "좋은 경험이었습니다. 다음에 또 오고 싶어요.",
  "photos": [
    "reviews/photos/uuid-review-002_review_photo_edited.jpg"
  ]
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 확인하여 수정자를 식별한다.
- `reviewId`로 기존 리뷰를 조회하고 작성자와 요청자가 일치하는지 소유 권한을 검증한다.
- 리뷰 수정 허용 기한(작성 후 30일 이내)이 경과하지 않았는지 체크한다.
- `reviews` 테이블의 `rating`, `content` 데이터를 업데이트한다.
- `photos` 배열이 바디에 포함되어 있으면, 기존 `review_photos` 레코드들을 일괄 제거하고 신규 S3 Key 목록을 바탕으로 레코드를 재생성한다.
- 비동기 큐를 통해 신규 업로드된 리뷰 이미지 압축 및 썸네일을 백그라운드 재생성한다.
- 해당 공방 및 프로그램의 평균 별점을 실시간 재계산하여 업데이트한다.
- 수정 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:32:00.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰가 성공적으로 수정되었습니다.",
  "data": {
    "review": {
      "id": "review-uuid-001",
      "rating": 4,
      "content": "좋은 경험이었습니다. 다음에 또 오고 싶어요.",
      "photos": [
        "https://cdn.todam.app/reviews/photos/uuid-review-002_review_photo_edited.jpg"
      ],
      "updatedAt": "2026-05-26T19:32:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:32:02.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰 수정이 가능한 기한(작성일로부터 30일 이내)이 경과하여 수정을 완료할 수 없습니다.",
  "data": null,
  "error": "REVIEW_EDIT_DEADLINE_EXCEEDED"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-26T19:32:04.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "자신이 직접 등록한 리뷰에 대해서만 수정이 가능합니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:05:08.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰 수정 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me

## 요구사항

- 로그인한 사용자가 본인의 닉네임을 변경하기 위해 프로필 정보를 수정한다.
- 수정 요청 시 입력된 닉네임의 글자 수 규격 및 형식 유효성을 검증한다.
- 데이터베이스 전체에서 닉네임 중복 여부를 확인하여 기존 사용자와 겹치지 않도록 처리한다.
- 프로필 수정이 완료되면 변경 완료된 신규 유저 프로필 정보를 반환한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Body


```json
{
  "nickname": "새로운토담이"
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증한다.
- 토큰 내 Payload에서 사용자 고유 ID(`userId`)를 추출한다.
- 요청 Body에서 필수 수정 대상인 닉네임(`nickname`) 값이 올바르게 입력되었는지 검증한다.
- 닉네임 정책(공백 제외 2자~10자 이내, 특수문자 사용 불가 등) 유효성을 검증한다.
- `users` 테이블에서 변경하고자 하는 닉네임이 이미 다른 사용자에 의해 사용 중인지 중복 조회를 수행한다.
- 동일한 닉네임이 이미 존재할 경우 프로필 수정을 중단하고 409 Conflict 에러를 반환한다.
- 중복 검증을 통과하면 `users` 테이블의 해당 유저 로우에서 `nickname` 필드를 새로운 값으로 업데이트하고, `updated_at` 시각을 `now()`로 갱신한다.
- 수정이 완료된 최신 사용자 정보를 담아 프로필 수정 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T18:10:00.342Z",
  "path": "/users/me",
  "message": "프로필 정보가 성공적으로 수정되었습니다.",
  "data": {
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "새로운토담이",
      "isPartner": false,
      "updatedAt": "2026-05-24T18:10:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request (닉네임 입력 규격 미달 및 공백 요청)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T18:10:02.115Z",
  "path": "/users/me",
  "message": "닉네임은 특수문자를 제외한 2자 이상 10자 이내여야 합니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `401 Unauthorized (로그인 인증 유효성 만료)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T18:10:04.981Z",
  "path": "/users/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `409 Conflict (닉네임 중복 발생)`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-24T18:10:06.772Z",
  "path": "/users/me",
  "message": "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.",
  "data": null,
  "error": "NICKNAME_ALREADY_EXISTS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T18:10:10.554Z",
  "path": "/users/me",
  "message": "프로필 정보 수정 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /notifications/read-all

## 요구사항


인증된 사용자가 본인의 모든 미읽음 알림을 일괄 읽음 처리한다.


---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- 해당 사용자의 `is_read = false`인 알림 전체를 `is_read = true`, `read_at = now()`로 일괄 갱신한다.
- 처리 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:25:00.000Z",
  "path": "/notifications/read-all",
  "message": "모든 알림이 읽음 처리되었습니다.",
  "data": null,
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T21:25:03.000Z",
  "path": "/notifications/read-all",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:25:08.000Z",
  "path": "/notifications/read-all",
  "message": "전체 알림 읽음 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/artworks/{artworkId}/photos

## 요구사항

- 프론트엔드와 백엔드의 API 호출 빈도 최소화 및 리소스 절약을 위해, 백엔드가 Presigned URL을 발급해 줌과 동시에 데이터베이스에 해당 사진 레코드를 `PENDING`(업로드 대기) 상태로 미리 생성합니다.
- 프론트엔드는 발급받은 URL로 S3에 이미지를 직접 `PUT` 업로드하기만 하면 업로드 흐름이 완결됩니다.
- 백엔드 서버는 스케줄러(예: BullMQ 또는 Cron)를 가동하여 24시간 이상 `PENDING` 상태로 방치된 미완료 레코드를 주기적으로 삭제(Garbage Collection) 처리합니다.
- `CANCELED` 상태의 작품에는 사진 업로드용 URL 발급이 불가합니다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### **Path Parameters**

- `artworkId`: 작품 UUID

### Body


```json
{
  "files": [
    {
      "filename": "pottery_drying.jpg",
      "fileSize": 1048576,
      "contentType": "image/jpeg",
    }
  ]
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 파트너 capability를 확인한다.
- `artworkId`로 작품을 조회하고 해당 공방의 소유 파트너가 맞는지 권한을 확인한다.
- 조회된 작품 상태가 `CANCELED`가 아닌지 검증한다.
- 요청된 파일 정보(한 번에 최대 5장, 용량 5MB 이하, 파일 형식 JPG/PNG/HEIC)가 올바른지 유효성을 검증한다.
- 고유 파일명(UUID 기반) 및 S3 Key(`artworks/{artworkId}/photos/{uuid}_{filename}`)를 생성한다.
- `artwork_photos` 테이블에 원본 이미지 CDN 주소, 상태값 `PENDING`으로 즉시 레코드를 삽입한다.
- S3 SDK를 호출하여 PutObject 방식의 Presigned URL(유효기간 10분)을 생성한다.
- 생성된 S3 Key, Presigned URL 및 DB에서 생성된 사진 고유 UUID(`photoId`) 목록을 성공 응답으로 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:25:00.000Z",
  "path": "/partner/artworks/artwork-uuid-001/photos/presigned",
  "message": "Presigned URL과 임시 레코드가 성공적으로 발급되었습니다. S3 업로드를 진행해 주세요.",
  "data": {
    "uploadUrls": [
      {
        "photoId": "artwork-photo-uuid-101",
        "filename": "pottery_drying.jpg",
        "s3Key": "artworks/artwork-uuid-001/photos/uuid-photo-001_pottery_drying.jpg",
        "presignedUrl": "https://todam-bucket.s3.ap-northeast-2.amazonaws.com/artworks/artwork-uuid-001/photos/uuid-photo-001_pottery_drying.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
        "contentType": "image/jpeg"
      }
    ]
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:25:02.000Z",
  "path": "/partner/artworks/artwork-uuid-001/photos/presigned",
  "message": "파일 형식은 JPG, PNG, HEIC만 지원하며, 개별 파일 용량은 5MB를 초과할 수 없습니다.",
  "data": null,
  "error": "INVALID_FILE_SPEC"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-26T19:25:04.000Z",
  "path": "/partner/artworks/artwork-uuid-001/photos/presigned",
  "message": "해당 작품에 대한 사진 수정 및 등록 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-26T19:25:05.000Z",
  "path": "/partner/artworks/artwork-uuid-001/photos/presigned",
  "message": "취소된 작품에는 사진을 업로드할 수 없습니다.",
  "data": null,
  "error": "ARTWORK_CANCELED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T19:25:08.000Z",
  "path": "/partner/artworks/artwork-uuid-001/photos/presigned",
  "message": "Presigned URL 발급 및 임시 레코드 생성 중 서버 내부에 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/artworks/{artworkId}/delivery

## 요구사항

- `Artwork.status = 'COMPLETED'` 도달 후 `deliveryMethod`에 따라 배송 또는 픽업 처리를 진행한다.
- 배송(`DELIVERY`): 파트너가 운송장 번호를 입력하면 예약이 `SHIPPED`로 전이된다.
- 픽업(`PICKUP`): 파트너가 픽업 준비 완료 또는 픽업 완료를 처리한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `artworkId`: 작품 UUID

### Body (배송)


```json
{
  "action": "SHIP",
  "trackingNumber": "1234567890123",
  "carrier": "CJ_LOGISTICS",
  "shippedAt": "2026-05-25"
}
```


### Body (픽업 준비 완료)


```json
{
  "action": "PICKUP_READY"
}
```


### Body (픽업 완료)


```json
{
  "action": "PICKUP_DONE"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `artworkId`로 작품을 조회하고 공방 소유 권한을 확인한다.
- `Artwork.status = 'COMPLETED'`인지 검증한다.
- `action`에 따라 분기 처리한다.
    - `SHIP`: `deliveries` 레코드에 운송장 번호·택배사·발송일(`shippedAt`)을 기록하고 연결된 `reservations.status = 'SHIPPED'`로 갱신. 고객에게 배송 시작 알림 발송. 발송일 기준 7일 후 자동 `DELIVERED` 전이 스케줄러 등록.
    - `PICKUP_READY`: `reservations.status = 'PICKUP_READY'`로 갱신. 고객에게 픽업 가능 알림 발송.
    - `PICKUP_DONE`: `reservations.status = 'PICKUP_DONE'`으로 갱신.
- 처리 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:45:00.000Z",
  "path": "/partner/artworks/artwork-uuid-001/delivery",
  "message": "배송 처리가 완료되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "status": "SHIPPED",
      "trackingNumber": "1234567890123",
      "carrier": "CJ_LOGISTICS",
      "shippedAt": "2026-05-25"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T20:45:03.000Z",
  "path": "/partner/artworks/artwork-uuid-001/delivery",
  "message": "작품이 완성 상태(COMPLETED)일 때만 배송 처리가 가능합니다.",
  "data": null,
  "error": "ARTWORK_NOT_COMPLETED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:45:08.000Z",
  "path": "/partner/artworks/artwork-uuid-001/delivery",
  "message": "배송 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /reservations/me

## 요구사항

- 인증된 사용자가 본인의 예약 목록을 조회한다.
- 예약 상태별 필터링 및 커서 기반 무한 스크롤을 지원한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Query Parameters

- `status`: 예약 상태 필터 (선택, 예: `IN_PROGRESS`)
- `cursor`: 이전 응답의 `nextCursor` 값 (선택, 첫 요청 시 생략)
- `limit`: 한 번에 가져올 항목 수 (기본값: 10)

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `cursor`가 있으면 해당 예약 이후의 데이터를, 없으면 최신 데이터부터 조회한다.
- `status` 필터를 적용하고, `limit + 1`개를 조회하여 다음 페이지 존재 여부를 확인한다.
- 각 예약에 대한 `displayState`를 계산하여 포함한다.
- 예약 목록을 최신순으로 정렬하고 `nextCursor`를 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:40:00.000Z",
  "path": "/reservations/me",
  "message": "예약 목록이 성공적으로 조회되었습니다.",
  "data": {
    "reservations": [
      {
        "id": "res-uuid-001",
        "storeName": "토담 공방",
        "programTitle": "물레 체험 기초반",
        "scheduledAt": "2026-06-01T10:00:00.000Z",
        "participantCount": 2,
        "status": "IN_PROGRESS",
        "displayState": {
          "label": "제작 중",
          "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
          "subLabel": "건조"
        },
        "createdAt": "2026-05-25T19:35:00.000Z"
      }
    ],
    "nextCursor": "res-uuid-002",
    "hasMore": true
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T19:40:03.000Z",
  "path": "/reservations/me",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:40:08.000Z",
  "path": "/reservations/me",
  "message": "예약 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/images

## 요구사항

- 인증된 파트너가 공방 상세 페이지에 노출할 이미지 업로드를 위해 Pre-signed URL을 발급받는다.
- 요청 시 백엔드는 `store_images` 테이블에 레코드를 미리 생성하되, 상태를 임시 상태로 둔다.
- 프론트엔드는 발급받은 `uploadUrl`을 이용하여 S3 버킷에 직접 파일을 업로드(`PUT`)한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 대상 공방 UUID

### Body


```json
{
  "fileName": "workshop_main.jpg",
  "fileType": "image/jpeg",
  "isThumbnail": true
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 권한 및 공방 소유권을 확인한다.
- S3 버킷 내 저장될 객체 키(Key)를 생성한다. (예: `stores/{storeId}/images/{uuid}.jpg`)
- AWS S3 SDK를 호출하여 해당 키에 대한 **Pre-signed PUT URL**을 생성한다. (유효시간 5분 설정)
- `store_images` 테이블에 row를 선 생성한다 (`image_url` 및 `is_thumbnail` 기록).
- 생성된 `uploadUrl`과 이미지 고유 `id`를 응답으로 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T18:35:00.000Z",
  "path": "/partner/stores/{storeId}/images",
  "message": "Pre-signed URL이 성공적으로 발급되었습니다. 5분 이내에 업로드를 완료해주세요.",
  "data": {
    "imageId": "img-uuid-001",
    "uploadUrl": "[https://todam-bucket.s3.ap-northeast-2.amazonaws.com/stores/a1b2.../images/uuid.jpg?AWSAccessKeyId=](https://todam-bucket.s3.ap-northeast-2.amazonaws.com/stores/a1b2.../images/uuid.jpg?AWSAccessKeyId=)...",
    "imageUrl": "[https://cdn.todam.app/stores/a1b2.../images/uuid.jpg](https://cdn.todam.app/stores/a1b2.../images/uuid.jpg)"
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T18:35:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images",
  "message": "파일 크기는 5MB를 초과할 수 없습니다.",
  "data": null,
  "error": "FILE_SIZE_EXCEEDED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:35:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images",
  "message": "이미지 업로드 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /programs/{programId}/available-slots

## 요구사항

- 인증된 사용자가 특정 프로그램의 예약 가능한 날짜 및 시간대 목록을 조회한다.
- 공방 운영시간, 휴게시간, 기존 예약 수, `program_time_slots.status = 'CLOSED'` 여부를 종합하여 예약 가능 여부를 계산한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `programId`: 프로그램 UUID

### Query Parameters

- `year`: 조회 연도 (예: 2026)
- `month`: 조회 월 (예: 6)

---


### 시스템 처리 

- 인증 토큰을 검증한다.
- `programId`로 `ACTIVE` 상태의 프로그램을 조회한다.
- 해당 공방의 운영시간, 휴게시간, 예약 시간 간격을 기반으로 해당 월의 시간 슬롯 목록을 생성한다.
- `program_time_slots`에서 각 슬롯의 `reserved_count`와 `capacity`를 비교하여 잔여 정원을 계산한다.
- `program_time_slots.status = 'CLOSED'` 슬롯을 필터링한다.
- 예약 가능 여부(`OPEN`/`CLOSED`)가 표시된 슬롯 목록을 반환한다.

---


## Response


### `200 OK`


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
        "capacity": 6,
        "reservedCount": 2,
        "remainingCount": 4,
        "status": "OPEN"
      },
      {
        "slotId": "slot-uuid-002",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "capacity": 6,
        "reservedCount": 6,
        "remainingCount": 0,
        "status": "CLOSED"
      }
    ]
  },
  "error": null
}
```


### `404 Not Found`


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


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:55:08.000Z",
  "path": "/programs/prog-uuid-001/available-slots",
  "message": "예약 가능 시간 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}/images

## 요구사항

- 인증된 파트너가 프로그램 상세 페이지에 노출할 이미지 업로드를 위해 Pre-signed URL을 발급받는다.
- 프론트엔드는 발급받은 URL로 S3에 직접 이미지를 업로드한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

### Body


```json
{
  "fileName": "program_01.png",
  "fileType": "image/png",
  "isThumbnail": true
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 권한 및 프로그램 소속 여부를 확인한다.
- S3 객체 키를 생성하고 Pre-signed PUT URL을 발급한다.
- `program_images` 테이블에 row를 선 생성한다 (`image_url` 및 `is_thumbnail` 기록).
- 발급된 URL과 이미지 정보를 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:15:00.000Z",
  "path": "/partner/stores/{storeId}/programs/{programId}/images",
  "message": "프로그램 이미지 업로드용 URL이 발급되었습니다.",
  "data": {
    "programImageId": "prog-img-uuid-001",
    "uploadUrl": "[https://todam-bucket.s3.ap-northeast-2.amazonaws.com/programs/.../uuid.png](https://todam-bucket.s3.ap-northeast-2.amazonaws.com/programs/.../uuid.png)?...",
    "imageUrl": "[https://cdn.todam.app/programs/.../uuid.png](https://cdn.todam.app/programs/.../uuid.png)"
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T19:15:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001/images",
  "message": "지원하지 않는 파일 형식입니다.",
  "data": null,
  "error": "INVALID_FILE_TYPE"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:15:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001/images",
  "message": "이미지 업로드 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/reservations/{reservationId}/complete

## 요구사항

- 인증된 파트너가 고객이 체험을 완료한 것을 처리한다.
- 예약이 `CONFIRMED` 상태이고 현재 시각이 체험 예정일시 이후여야 한다.
- 처리 후 예약이 `IN_PROGRESS`로 전이되고 Artwork가 `VISITED` 상태로 전이된다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 체험 완료 처리할 예약 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `reservationId`로 예약을 조회하고 공방 소유 권한을 확인한다.
- 예약 상태가 `CONFIRMED`이고 현재 시각이 체험 예정일시 이후인지 검증한다.
- `reservations.status = 'IN_PROGRESS'`로 갱신한다.
- 연결된 `artworks.status = 'VISITED'`로 전이하고 `artwork_logs`에 이력을 기록한다.
- 고객에게 "체험이 등록되었어요" 알림을 발송한다.
- 처리 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:15:00.000Z",
  "path": "/partner/reservations/res-uuid-001/complete",
  "message": "체험 완료가 처리되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "status": "IN_PROGRESS",
      "artworkStatus": "VISITED",
      "updatedAt": "2026-05-25T20:15:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T20:15:03.000Z",
  "path": "/partner/reservations/res-uuid-001/complete",
  "message": "체험 예정일 이후에만 완료 처리가 가능합니다.",
  "data": null,
  "error": "EXPERIENCE_NOT_STARTED"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T20:15:04.000Z",
  "path": "/partner/reservations/res-uuid-001/complete",
  "message": "CONFIRMED 상태의 예약만 완료 처리할 수 있습니다.",
  "data": null,
  "error": "INVALID_RESERVATION_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:15:08.000Z",
  "path": "/partner/reservations/res-uuid-001/complete",
  "message": "체험 완료 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores

## 요구사항

- 인증된 파트너가 본인이 운영 중인 공방 목록을 조회한다.
- 공방 상태(DRAFT, PENDING, PUBLISHED, REJECTED, SUSPENDED)에 관계없이 본인 소유 공방 전체를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리

- 인증 토큰으로 요청 사용자를 식별하고 파트너 capability를 검증한다.
- `stores` 테이블에서 해당 파트너 ID(`partner_id`)에 속한 공방 목록을 조회한다.
- 공방별 대표 이미지, 운영시간, 상태 정보를 포함하여 반환한다.

---


## Response


### `200 OK`


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


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T18:10:03.000Z",
  "path": "/partner/stores",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:10:04.000Z",
  "path": "/partner/stores",
  "message": "파트너 권한이 필요합니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:10:08.000Z",
  "path": "/partner/stores",
  "message": "공방 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{slug}/reviews

## 요구사항

- 비인증 포함 모든 사용자가 공방의 전체 리뷰 목록을 조회한다.
- 최신순 정렬이 기본값이며 페이지네이션을 적용한다.

---


## Request


### Headers

- Accept: application/json

### Path Parameters

- `slug`: 공방 슬러그

### Query Parameters

- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)
- `sort`: 정렬 기준 (`latest` | `rating_high`, 기본값: `latest`)

---


### 시스템 처리 

- `slug`로 `PUBLISHED` 상태의 공방을 조회한다.
- 해당 공방의 전체 리뷰 목록을 조회하고 페이지네이션을 적용한다.
- 전체 리뷰 수 및 평균 별점을 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:00:00.000Z",
  "path": "/stores/todam-studio/reviews",
  "message": "공방 리뷰 목록이 성공적으로 조회되었습니다.",
  "data": {
    "totalCount": 42,
    "averageRating": 4.8,
    "reviews": [
      {
        "id": "review-uuid-001",
        "nickname": "토담이",
        "rating": 5,
        "content": "정말 즐거운 체험이었습니다!",
        "photos": [
          {
            "thumbnailUrl": "https://cdn.todam.app/reviews/review-uuid-001/01_thumb.jpg"
          }
        ],
        "programTitle": "물레 체험 기초반",
        "createdAt": "2026-05-10T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "limit": 10
    }
  },
  "error": null
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T21:00:03.000Z",
  "path": "/stores/todam-studio/reviews",
  "message": "공방을 찾을 수 없습니다.",
  "data": null,
  "error": "STORE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:00:08.000Z",
  "path": "/stores/todam-studio/reviews",
  "message": "리뷰 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/artworks/{artworkId}

## 요구사항

- 인증된 파트너가 본인 공방 작품의 운영 상세 정보를 조회한다.
- 내부 상태값, 메모, 변경 이력 전체를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `artworkId`: 작품 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `artworkId`로 작품을 조회하고 해당 공방의 소유 파트너인지 확인한다.
- 내부 상태값, 고객 노출 `displayState`, 전체 단계 목록, 현재 단계 사진, 내부 메모, `artwork_logs` 전체를 반환한다.
- 예상 완성일 및 D+N 경과일을 계산하여 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:25:00.000Z",
  "path": "/partner/artworks/artwork-uuid-001",
  "message": "작품 상세 정보가 성공적으로 조회되었습니다.",
  "data": {
    "artwork": {
      "id": "artwork-uuid-001",
      "reservationId": "res-uuid-001",
      "reserverName": "김토담",
      "status": "DRYING",
      "displayState": {
        "label": "제작 중",
        "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
        "subLabel": "건조"
      },
      "internalMemo": "물레 성형 완료, 균열 없음",
      "estimatedCompletedAt": "2026-07-01T00:00:00.000Z",
      "elapsedDays": 5,
      "currentStagePhotos": [
        {
          "id": "photo-uuid-001",
          "thumbnailUrl": "https://cdn.todam.app/artworks/artwork-uuid-001/drying_thumb.jpg",
          "imageUrl": "https://cdn.todam.app/artworks/artwork-uuid-001/drying.jpg"
        }
      ],
      "logs": [
        {
          "id": "log-uuid-001",
          "fromStatus": "VISITED",
          "toStatus": "DRYING",
          "changedByNickname": "토담공방",
          "memo": "건조 시작",
          "createdAt": "2026-06-02T10:00:00.000Z"
        }
      ]
    }
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T20:25:03.000Z",
  "path": "/partner/artworks/artwork-uuid-001",
  "message": "해당 작품에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:25:08.000Z",
  "path": "/partner/artworks/artwork-uuid-001",
  "message": "작품 상세 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /stores/{slug}/programs

## 요구사항

- 비인증 포함 모든 사용자가 특정 공방의 활성화된 프로그램 목록을
- 공방 상태가 `PUBLISHED`인 공방의 프로그램만 노출된다.
- 프로그램 상태가 `ACTIVE`인 프로그램만 노출된다.
- 노출 정렬 순서(`sort_order`) 및 식별자(`id`)를 기준으로 오름차순 정렬하여 반환한다.
- 개별 도자기 공방이 보유하는 클래스(프로그램)의 수는 보통 수개에서 수십개 이내로 소규모이기 때문에, 불필요한 페이징 처리(커서/오프셋)를 배제하여 리소스를 아끼고 단일 배열 목록으로 전체 반환한다.

---


## Request


### Headers

- Accept: application/json

### Path Parameters

- `slug`: 공방 슬러그

---


### 시스템 처리 

- 입력받은 `slug`를 이용하여 `stores` 테이블에서 공방을 조회한다.
- 조회된 공방의 상태가 `PUBLISHED`가 아니거나 공방이 실존하지 않는 경우 `404 Not Found` 에러를 반환한다.
- 해당 공방(`storeId`)에 속한 프로그램들 중 `status = 'ACTIVE'` 상태인 전체 프로그램 목록을 쿼리한다.
- 결과를 `programs.sort_order` 및 `programs.id`를 기준으로 오름차순 정렬한다.
- 각 프로그램의 식별자(ID), 제목, 한 줄 설명, 가격, 소요 시간(분), 최대 정원, 완성작 수령 옵션, 대표 썸네일 URL을 포함하여 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T11:00:00.000Z",
  "path": "/stores/todam-studio/programs",
  "message": "프로그램 목록이 성공적으로 조회되었습니다.",
  "data": {
    "programs": [
      {
        "id": "prog-uuid-001",
        "title": "물레 체험 기초반",
        "description": "처음 도자기를 접하는 분들을 위한 물레 체험입니다.",
        "price": 45000,
        "durationMinutes": 120,
        "capacity": 6,
        "leadTimeDays": 30,
        "deliveryOption": "CUSTOMER_SELECT",
        "thumbnailUrl": "https://cdn.todam.app/programs/prog-uuid-001/thumb.jpg",
        "status": "ACTIVE",
        "sortOrder": 1
      }
    ]
  },
  "error": null
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:45:03.000Z",
  "path": "/stores/todam-studio/programs",
  "message": "공방을 찾을 수 없습니다.",
  "data": null,
  "error": "STORE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:45:08.000Z",
  "path": "/stores/todam-studio/programs",
  "message": "프로그램 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/artworks/{artworkId}/status

## 요구사항

- 인증된 파트너가 작품의 제작 단계를 변경한다.
- 전이는 순방향이 기본이며, 오등록 정정을 위해 직전 단계로 1단계 되돌리는 것도 허용된다.
- 상태 변경 시 `artwork_logs`에 이력이 기록되고 고객에게 알림이 발송된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `artworkId`: 작품 UUID

### Body


```json
{
  "status": "BISQUE_FIRING",
  "memo": "초벌 가마 투입 완료"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `artworkId`로 작품을 조회하고 공방 소유 권한을 확인한다.
- 작품 상태가 `COMPLETED` 또는 `CANCELED`가 아닌지 검증한다.
- 목표 상태가 현재 상태의 직후 또는 직전 단계인지 검증한다.
- `artworks.status`를 갱신하고 `updated_at`을 기록한다.
- `artwork_logs` row를 생성한다 (`from_status`, `to_status`, `changed_by`, `memo`, `created_at`).
- 고객 알림 큐에 등록한다 (내부 상태를 고객 노출 문구로 치환하여 발송).
- 변경 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:35:00.000Z",
  "path": "/partner/artworks/artwork-uuid-001/status",
  "message": "작품 상태가 성공적으로 변경되었습니다.",
  "data": {
    "artwork": {
      "id": "artwork-uuid-001",
      "status": "BISQUE_FIRING",
      "updatedAt": "2026-05-25T20:35:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T20:35:03.000Z",
  "path": "/partner/artworks/artwork-uuid-001/status",
  "message": "유효하지 않은 상태 전이입니다. 현재 단계의 직전 또는 직후 단계로만 변경할 수 있습니다.",
  "data": null,
  "error": "INVALID_STATUS_TRANSITION"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T20:35:04.000Z",
  "path": "/partner/artworks/artwork-uuid-001/status",
  "message": "이미 종료된 작품의 상태는 변경할 수 없습니다.",
  "data": null,
  "error": "ARTWORK_ALREADY_COMPLETED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:35:08.000Z",
  "path": "/partner/artworks/artwork-uuid-001/status",
  "message": "작품 상태 변경 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/email/verify-code

## 요구사항

- 사용자가 이메일로 수신한 6자리의 인증 코드를 입력하여 인증을 완료한다.
- 입력한 인증 코드가 일치하고 5분의 만료 시간 이내인 경우, 사용자의 이메일 인증 상태를 완료 처리한다.
- 인증이 성공적으로 완료되면 사용자 메일 인증 상태 업데이트 결과 정보를 반환한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "user@example.com",
  "code": "123456"
}
```


---


### 시스템 처리 

1. 요청 Body의 필수값(이메일, 인증코드)이 올바르게 입력되었는지 검증한다.
2. 이메일 데이터의 형식 유효성을 검증한다.
3. 저장소(Redis 또는 임시 인증 테이블)에 해당 이메일로 발급된 인증 코드가 존재하는지 조회한다.
4. 입력된 인증 코드가 시스템에 저장된 코드와 일치하는지 검증한다.
5. 인증 코드의 유효 시간(5분)이 경과하여 만료되었는지 확인한다.
6. 모든 검증이 성공하면 `users` 테이블에서 해당 사용자의 이메일 인증 여부를 완료 상태(`emailVerified = true`)로 변경한다.
7. 중복 인증 및 보안 취약점을 방지하기 위해 사용이 완료된 인증 코드를 저장소에서 완전히 파기한다.
8. 이메일 인증 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:30:00.105Z",
  "path": "/auth/email/verify-code",
  "message": "이메일 인증이 성공적으로 완료되었습니다.",
  "data": {
    "email": "user@example.com",
    "emailVerified": true
  },
  "error": null
}
```


### `400 Bad Request (필수값 누락 및 형식 에러)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:30:03.214Z",
  "path": "/auth/email/verify-code",
  "message": "인증 코드는 6자리 숫자여야 합니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `400 Bad Request (인증코드 불일치)`


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:30:05.456Z",
  "path": "/auth/email/verify-code",
  "message": "인증 코드가 일치하지 않습니다. 다시 확인해주세요.",
  "data": null,
  "error": "INVALID_VERIFICATION_CODE"
}
```


### `410 Gone (5분 만료 시간 초과)`


```json
{
  "statusCode": 410,
  "timestamp": "2026-05-24T17:30:08.887Z",
  "path": "/auth/email/verify-code",
  "message": "인증 시간이 만료되었습니다. 인증 코드를 다시 발송해주세요.",
  "data": null,
  "error": "VERIFICATION_CODE_EXPIRED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:30:12.334Z",
  "path": "/auth/email/verify-code",
  "message": "이메일 인증 확인 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}

## 요구사항

- 인증된 파트너가 본인 공방의 정보를 수정한다.
- `DRAFT` 또는 `PUBLISHED` 상태의 공방에 대해서만 수정이 가능하다.
- 수정 가능한 필드: 공방명, 소개, 전화번호, 편의 정보, 운영시간, 자동확정 여부 등.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 수정할 공방 UUID

### Body (변경할 필드만 포)


```json
{
  "description": "새롭게 단장한 토담 공방입니다.",
  "phone": "02-9876-5432",
  "autoConfirm": true,
  "convenienceInfo": {
    "parking": true,
    "pet": true,
    "wifi": true
  }
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고 소유 권한을 확인한다.
- 수정 가능한 상태(`DRAFT`, `PUBLISHED`)인지 검증한다.
- 전달된 필드만 업데이트하고 `updated_at`을 갱신한다.
- 수정 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:20:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방 정보가 성공적으로 수정되었습니다.",
  "data": {
    "store": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "토담 공방",
      "slug": "todam-studio",
      "status": "PUBLISHED",
      "updatedAt": "2026-05-25T18:20:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T18:20:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "수정할 수 없는 상태의 공방입니다.",
  "data": null,
  "error": "INVALID_STORE_STATUS"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T18:20:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:20:05.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "해당 공방에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:20:06.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방을 찾을 수 없습니다.",
  "data": null,
  "error": "STORE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:20:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "message": "공방 정보 수정 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}

## 요구사항

- 인증된 파트너가 등록한 프로그램을 수정한다.
- 제목, 상세 설명, 대표 이미지, 유의사항은 언제든지 수정 가능하다.
- 가격·정원·리드타임은 기존 예약이 1건 이상인 경우, 기존 예약에는 스냅샷이 유지되고 신규 예약에만 수정값이 적용되도록 스냅샷을 새로 생성한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID
- `programId`: 프로그램 UUID

### Body (변경할 필드만 포)


```json
{
  "title": "물레 체험 기초반 (개정)",
  "price": 48000,
  "caution": "체험 2시간 전까지 취소 가능합니다."
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- 공방 소유 권한 및 프로그램 소속 여부를 확인한다.
- 가격·정원·리드타임이 변경되고 기존 예약이 1건 이상 존재하면, 신규 `program_snapshots` row를 생성하고 `program_snapshots`에 새 레코드를 생성한다.
- 나머지 필드를 `programs` row에 반영하고 `updated_at`을 갱신한다.
- 수정 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T19:05:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001",
  "message": "프로그램이 성공적으로 수정되었습니다.",
  "data": {
    "program": {
      "id": "prog-uuid-001",
      "title": "물레 체험 기초반 (개정)",
      "price": 48000,
      "status": "ACTIVE",
      "updatedAt": "2026-05-25T19:05:00.000Z"
    }
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T19:05:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001",
  "message": "해당 프로그램에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T19:05:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001",
  "message": "프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "PROGRAM_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:05:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/programs/prog-uuid-001",
  "message": "프로그램 수정 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/email/send-code

## 요구사항

- 회원가입을 진행 중인 사용자의 이메일 소유 여부를 검증하기 위해 6자리의 인증 코드를 발송한다.
- 인증 코드는 5분간만 유효하며, 외부 메일 발송 API를 연동하여 전송한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "user@example.com"
}
```


---


### 시스템 처리 

1. 요청 Body의 필수값(이메일)이 누락되었는지 검증한다.
2. 이메일 데이터의 형식 유효성을 검증한다.
3. 시스템 내부에서 보안 서명이 포함된 6자리의 숫자 인증 코드를 생성한다.
4. 생성된 인증 코드와 만료 시간(현재 시각 + 5분)을 Redis 또는 임시 인증 테이블에 저장한다.
5. 외부 메일 발송 서비스(SendGrid 혹은 AWS SES)를 호출하여 사용자 이메일로 인증 메일을 발송한다.
6. 발송 요청 성공 시 인증 코드 발송 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T17:25:00.123Z",
  "path": "/auth/email/send-code",
  "message": "인증 코드가 이메일로 성공적으로 발송되었습니다.",
  "data": {
    "email": "user@example.com"
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T17:25:03.456Z",
  "path": "/auth/email/send-code",
  "message": "올바르지 않은 이메일 형식입니다.",
  "data": null,
  "error": "INVALID_EMAIL_FORMAT"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T17:25:08.987Z",
  "path": "/auth/email/send-code",
  "message": "메일 발송 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "EMAIL_SEND_FAILED"
}
```

---

## /stores?lat=&lng=&keyword=

## 요구사항

- 사용자가 현재 위치(위도/경도) 또는 특정 검색 키워드를 기반으로 활성화된 도자기 공방 목록을 탐색하고 조회한다.
- 검수가 통과되어 공개 활성화 상태인 공방(`status = 'PUBLISHED'`)만 탐색 결과에 노출된다.
- 위도(`lat`)와 경도(`lng`) 정보가 제공되는 경우, 해당 좌표 기준 반경 내에 존재하는 공방 목록을 거리순으로 정렬하여 반환한다.

---


## Request


### Headers

- Accept: application/json

### Query Parameters

- `lat`: 검색 중심 위도 (선택 사항, 예: 37.5665)
- `lng`: 검색 중심 경도 (선택 사항, 예: 126.9780)
- `keyword`: 공방 이름 또는 주소 키워드 검색어 (선택 사항, 예: "XX 도자기")

---


### 시스템 처리 

- 요청 파라미터로 전달된 위도(`lat`), 경도(`lng`), 검색어(`keyword`)의 유효성 및 데이터 형식을 검증한다.
- `stores` 테이블에서 상태가 공개 상태(`status = 'PUBLISHED'`)인 공방 레코드들을 필터링한다.
- `keyword` 값이 존재할 경우, 공방 이름(`name`) 또는 공방 주소(`address`) 필드에 해당 검색어가 포함(LIKE 검색)되어 있는지 확인하고 필터링한다.
- `lat` 및 `lng` 값이 주어졌을 경우, 기준 좌표와 공방 주소 좌표 간의 거리를 연산하여 가장 가까운 순서(거리순)로 데이터를 정렬한다.
- 조회된 공방 목록 정보(아이디, 파트너 아이디, 이름, 슬러그, 주소, 연락처, 편의정보, 자동확정 여부 등)를 배열 형태로 패키징하여 성공 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:50:00.123Z",
  "path": "/stores",
  "message": "공방 목록이 성공적으로 탐색되었습니다.",
  "data": {
    "stores": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
        "slug": "todam-jeonju",
        "name": "토담 전주 한옥마을점",
        "description": "한옥의 고즈넉함 속에서 즐기는 도자기 물레 체험 공방입니다.",
        "phone": "063-123-4567",
        "address": "전북 전주시 완산구 교동 한옥마을길 12",
        "status": "PUBLISHED",
        "convenienceInfo": {
          "parking": true,
          "pet": false,
          "wifi": true
        },
        "autoConfirm": false,
        "publishedAt": "2026-05-25T10:00:00.000Z",
        "createdAt": "2026-05-24T12:00:00.000Z"
      }
    ]
  },
  "error": null
}
```


### `400 Bad Request (쿼리 파라미터 형식 오류)` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T17:50:03.456Z",
  "path": "/stores",
  "message": "위도 및 경도 값은 올바른 숫자 형식이어야 합니다.",
  "data": null,
  "error": "INVALID_QUERY_PARAMETERS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T17:50:08.999Z",
  "path": "/stores",
  "message": "공방 목록 탐색 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /notifications

## 요구사항

- 인증된 사용자가 본인의 알림 목록을 조회한다.
- 최신순 정렬이 기본이며 읽음 여부로 필터링하고, 커서 기반 무한 스크롤을 지원한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Query Parameters

- `isRead`: 읽음 여부 필터 (선택, `true` | `false`)
- `cursor`: 이전 응답의 `nextCursor` 값 (선택, 첫 요청 시 생략)
- `limit`: 한 번에 가져올 항목 수 (기본값: 20)

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `cursor` 이후 데이터를 `limit + 1`개 조회하여 다음 페이지 존재 여부를 확인한다.
- 읽지 않은 알림 수를 함께 반환한다.
- `nextCursor`를 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:15:00.000Z",
  "path": "/notifications",
  "message": "알림 목록이 성공적으로 조회되었습니다.",
  "data": {
    "unreadCount": 3,
    "notifications": [
      {
        "id": "noti-uuid-001",
        "type": "ARTWORK_STATUS",
        "title": "작품 상태가 업데이트되었어요",
        "body": "작품이 단단해지도록 정성껏 말리고 있어요.",
        "isRead": false,
        "artworkId": "artwork-uuid-001",
        "reservationId": "res-uuid-001",
        "sentAt": "2026-05-25T10:00:00.000Z"
      }
    ],
    "nextCursor": "noti-uuid-002",
    "hasMore": true
  },
  "error": null
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T21:15:03.000Z",
  "path": "/notifications",
  "message": "인증이 필요합니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:15:08.000Z",
  "path": "/notifications",
  "message": "알림 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/signup

## 요구사항

- 사용자가 이메일과 비밀번호를 입력하여 서비스 계정을 생성한다.
- 회원가입 요청 시 이메일 중복 여부를 확인하고,비밀번호는 해싱하여 저장한다.
- 회원가입 시 최신 이용약관 및 개인정보처리방침 동의 여부를 함께 검증하고 이력을 저장한다.
- 회원가입이 완료되면 서비스 사용자 정보를 반환한다. (이후 이메일 인증코드 발송 단계로 전이된다.)

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "email": "user@example.com",
  "password": "Password1234!",
  "passwordConfirm": "Password1234!",
  "nickname": "토담이",
  "termsAgreed": true,
  "privacyAgreed": true
}
```


---


## **시스템 처리**

1. 요청 Body의 필수값(이메일, 비밀번호, 닉네임, 약관 동의 등)을 검증한다.
2. 이메일 형식 유효성을 검증한다.
3. 비밀번호와 비밀번호 확인값이 일치하는지 검증한다.
4. 비밀번호 정책(영문·숫자·특수문자 조합, 8~32자)을 검증한다.
5. 이메일 기준으로 기존 사용자가 있는지 조회한다.
6. 이미 가입된 이메일이면 회원가입을 중단한다.
7. 필수 이용약관 및 개인정보처리방침 동의 여부(`true`)를 확인한다.
8. 비밀번호를 해싱 처리한다.
9. 신규 사용자(`users`) row를 생성한다 (초기 상태 `status = 'ACTIVE'`, `is_partner = false`, `emailVerified = false`).
10. 약관 동의 이력(`user_consents`)을 생성하여 매칭한다.
11. 회원가입 완료 응답을 반환한다.

---


## Response


### `201 Created`


```typescript
{
  "statusCode": 201,
  "timestamp": "2026-05-24T16:55:00.000Z",
  "path": "/auth/signup",
  "message": "회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.",
  "data": {
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "토담이"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-24T16:55:05.123Z",
  "path": "/auth/signup",
  "message": "비밀번호는 영문, 숫자, 특수문자를 포함하여 8~32자여야 합니다.",
  "data": null,
  "error": "INVALID_REQUEST"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-24T16:55:10.456Z",
  "path": "/auth/signup",
  "message": "이미 가입된 이메일입니다.",
  "data": null,
  "error": "EMAIL_ALREADY_EXISTS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T16:55:15.789Z",
  "path": "/auth/signup",
  "message": "회원가입 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/reservations/{reservationId}/cancel

## 요구사항

- 인증된 파트너가 `PENDING` 또는 `CONFIRMED` 상태의 예약을 취소한다.
- 파트너 취소는 시간 제한이 없다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reservationId`: 취소할 예약 UUID

### Body


```json
{
  "cancelReason": "공방 사정으로 인한 취소"
}
```


---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `reservationId`로 예약을 조회하고 해당 공방의 소유 파트너인지 확인한다.
- 예약 상태가 `PENDING` 또는 `CONFIRMED`인지 검증한다.
- `reservations.status = 'CANCELED'`로 갱신하고, 취소 사유 및 취소자(`canceledBy`, `cancelReason`)를 기록한다.
- `program_time_slots.reserved_count`를 감소시킨다.
- 연결된 `artworks.status = 'CANCELED'`로 갱신한다.
- 고객에게 취소 알림을 발송한다.
- 취소 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:10:00.000Z",
  "path": "/partner/reservations/res-uuid-001/cancel",
  "message": "예약이 성공적으로 취소되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "status": "CANCELED",
      "canceledBy": "partner-user-uuid-001",
      "cancelReason": "공방 사정으로 인한 취소",
      "canceledAt": "2026-05-25T20:10:00.000Z"
    }
  },
  "error": null
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T20:10:03.000Z",
  "path": "/partner/reservations/res-uuid-001/cancel",
  "message": "취소할 수 없는 상태의 예약입니다.",
  "data": null,
  "error": "INVALID_RESERVATION_STATUS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:10:08.000Z",
  "path": "/partner/reservations/res-uuid-001/cancel",
  "message": "예약 취소 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}/time-slots

## 요구사항

- 인증된 파트너(공방 사장님)가 자신이 소유한 특정 프로그램에 등록된 타임슬롯들의 목록을 달력이나 리스트 형태로 확인하기 위해 조회한다.
- 특정 날짜 범위(`startDate` ~ `endDate`)에 있는 타임슬롯들만 조회할 수 있는 필터 기능을 제공한다.
- 슬롯의 상태(`OPEN`, `CLOSED`, `CANCELED`)별로 필터링하여 조회할 수 있는 옵션을 제공한다.
- 각 슬롯의 총 정원(`capacity`) 대비 현재 실제 예약된 인원 수(`reservedCount`)와 잔여 정원 정보를 함께 조회하여 반환한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID
- `programId`: 해당 공방의 프로그램 UUID

### Query Parameters

- `startDate`: 조회 필터 시작일 (선택, YYYY-MM-DD 형식, 예: `2026-06-01`)
- `endDate`: 조회 필터 종료일 (선택, YYYY-MM-DD 형식, 예: `2026-06-30`)
- `status`: 타임슬롯 게시 상태 필터 (선택, `OPEN`, `CLOSED`, `CANCELED` 중 하나)

---


### 시스템 처리 

1. Access Token의 만료 여부 및 파트너 capability 권한을 검증한다.
2. `storeId`로 공방을 조회하고 해당 파트너 계정이 이 공방의 실소유자가 맞는지 권한을 검증한다 (`403 Forbidden`).
3. `programId`로 프로그램을 조회하고, 해당 프로그램이 실제 공방 소속인지 유효성을 확인한다 (`404 Not Found`).
4. 전달받은 `startDate` 및 `endDate` 날짜 필터 인수가 유효한 날짜 포맷인지 체크한다.
5. `program_time_slots` 테이블에서 해당 `programId`를 조건으로 걸고, 지정된 날짜 기간 범위 내에 포함되는 레코드 목록을 쿼리한다.
6. `status` 쿼리 파라미터가 명시된 경우 해당 상태값 필터를 추가로 반영하여 레코드를 걸러낸다.
7. 시작 시간(`startAt`) 오름차순으로 타임슬롯 리스트를 정렬한 후, 각 슬롯별 예약 인원 및 잔여 정원 등을 연산해 가공하여 최종 목록을 응답한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T11:10:00.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "타임슬롯 목록 조회가 성공적으로 완료되었습니다.",
  "data": {
    "slots": [
      {
        "slotId": "slot-uuid-101",
        "startAt": "2026-06-01T10:00:00.000Z",
        "endAt": "2026-06-01T12:00:00.000Z",
        "capacity": 6,
        "reservedCount": 2,
        "remainingCount": 4,
        "status": "OPEN",
        "createdAt": "2026-05-27T11:05:00.000Z"
      },
      {
        "slotId": "slot-uuid-102",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "capacity": 6,
        "reservedCount": 6,
        "remainingCount": 0,
        "status": "CLOSED",
        "createdAt": "2026-05-27T11:05:00.000Z"
      }
    ]
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-27T11:10:02.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "날짜 필터 파라미터는 YYYY-MM-DD 규격에 맞아야 하며, 시작일은 종료일보다 이전이어야 합니다.",
  "data": null,
  "error": "INVALID_DATE_FORMAT"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-27T11:10:04.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "해당 공방의 타임슬롯 정보를 조회할 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-27T11:10:05.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "해당 공방 또는 요청하신 프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "RESOURCE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-27T11:10:08.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "타임슬롯 데이터 검색 쿼리 수행에 실패했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/images/{imageId}

## 요구사항


인증된 파트너가 공방에 등록된 특정 이미지를 삭제한다.


---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 대상 공방 UUID
- `imageId`: 삭제할 이미지 UUID

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- `storeId`로 공방을 조회하고 소유 권한을 확인한다.
- `imageId`로 이미지를 조회하고 해당 공방 소속인지 확인한다.
- S3에서 원본 이미지 및 썸네일을 삭제한다.
- `store_images` row를 삭제한다.
- 삭제 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T18:40:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images/img-uuid-001",
  "message": "이미지가 성공적으로 삭제되었습니다.",
  "data": null,
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T18:40:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images/img-uuid-001",
  "message": "해당 이미지에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T18:40:04.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images/img-uuid-001",
  "message": "이미지를 찾을 수 없습니다.",
  "data": null,
  "error": "IMAGE_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T18:40:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/images/img-uuid-001",
  "message": "이미지 삭제 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partners/me

## 요구사항

- 로그인한 사용자가 본인의 파트너(공방 사장님) 자격 신청 및 승인 상태를 확인하기 위해 파트너 정보를 조회한다.
- 요청 헤더의 Access Token을 기반으로 사용자를 식별하며, `partners` 테이블에 기록된 현재 심사 상태(`status`) 및 반려 사유, 정지 사유 등의 상세 데이터를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리 

1. 요청 헤더의 Access Token 유효성을 검증하고 유저 식별자(`userId`)를 확인한다.
2. `partners` 테이블에서 해당 사용자의 `user_id`와 일치하는 파트너 신청 로우(Row)가 존재하는지 조회한다.
3. 파트너 신청 이력이 전혀 존재하지 않는 일반 회원인 경우, 404 Not Found 에러를 반환한다.
4. 이력이 존재하는 경우 해당 파트너의 현재 심사 상태 값(`PENDING` | `APPROVED` | `REJECTED` | `SUSPENDED` | `TERMINATED`)을 확인한다.
5. 상태에 따른 부가 데이터(반려 시 `rejected_reason`, 정지 시 `suspended_reason`, 승인 시 `approved_at`)를 함께 패키징하여 상태 조회 응답을 반환한다.

---


## Response


### `200 OK (ex. 심사 반려 상태인 경우)`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:35:10.123Z",
  "path": "/partners/me",
  "message": "파트너 자격 상태 정보가 성공적으로 조회되었습니다.",
  "data": {
    "partner": {
      "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "status": "REJECTED",
      "rejectedReason": "제출하신 사업자등록증 파일의 글씨가 흐려 번호를 식별할 수 없습니다. 재제출 부탁드립니다.",
      "approvedAt": null,
      "suspendedReason": null,
      "createdAt": "2026-05-24T12:00:00.000Z"
    }
  },
  "error": null
}
```


### `200 OK (ex. 심사 승인 완료 상태인 경)`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T17:35:10.123Z",
  "path": "/partners/me",
  "message": "파트너 자격 상태 정보가 성공적으로 조회되었습니다.",
  "data": {
    "partner": {
      "partnerId": "d5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a",
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "status": "APPROVED",
      "rejectedReason": null,
      "approvedAt": "2026-05-25T10:00:00.000Z",
      "suspendedReason": null,
      "createdAt": "2026-05-24T12:00:00.000Z"
    }
  },
  "error": null
}
```


### `401 Unauthorized (인증 유효성 만료)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-25T17:35:12.456Z",
  "path": "/partners/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `404 Not Found (파트너 신청 이력이 없는 일반 회원)`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T17:35:14.987Z",
  "path": "/partners/me",
  "message": "파트너 신청 이력이 존재하지 않는 회원입니다.",
  "data": null,
  "error": "PARTNER_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T17:35:19.554Z",
  "path": "/partners/me",
  "message": "내 파트너 상태 조회 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}/time-slots/{timeSlotId}/status

## 요구사항

- 인증된 파트너(공방 사장님)가 특정 시간대 슬롯의 예약 상태를 예약 오픈(`OPEN`), 강제 조기 마감(`CLOSED`), 또는 타임슬롯 취소(`CANCELED`) 처리하여 유연하게 예약을 통제한다.
- **예약 마감 (****`CLOSED`****로 변경 시)**:
    - 이미 기존에 잡혀있던 예약 신청 건들은 그대로 유지되나, 신규 추가 예약 접수만 즉시 차단된다.
- **예약 취소 (****`CANCELED`****로 변경 시)**:
    - **안전 제약 조건**: 만약 해당 타임슬롯에 현재 확정(`CONFIRMED`) 또는 대기(`PENDING`) 상태인 **유효한 예약 건이 1건 이상 존재하는 경우**, 파트너가 임의로 타임슬롯을 강제 취소할 수 없도록 로직상으로 안전하게 차단한다 (`409 Conflict`).
    - 즉, 기존 예약자들의 예약을 먼저 취소 처리(취소/환불 등 조치)한 후에만 해당 타임슬롯 자체를 완전히 취소할 수 있도록 유도한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID
- `programId`: 해당 공방의 프로그램 UUID
- `timeSlotId`: 상태를 수정하고자 하는 타임슬롯 UUID

### Body


```json
{
  "status": "CLOSED"
}
```


---


### 시스템 처리 

1. Access Token의 유효성 검증과 파트너 capability 권한이 존재하는지 확인한다.
2. `storeId`로 공방을 조회하고 해당 파트너 계정이 이 공방의 실소유주가 맞는지 권한을 검증한다 (`403 Forbidden`).
3. `programId`로 프로그램을 조회하여 공방에 실제 매핑되어 있는지 유효성을 확인한다.
4. `timeSlotId`로 타임슬롯을 조회하고 해당 프로그램 소속 슬롯이 맞는지 검증한다 (`404 Not Found`).
5. 요청 바디의 `status` 값이 유효한 열거형 상수(`OPEN`, `CLOSED`, `CANCELED`) 중 하나인지 체크한다.
6. **상태를** **`CANCELED`****로 갱신하려는 경우**:
    - `reservations` 테이블에서 해당 `timeSlotId`를 외래키로 참조하고 있는 유효 예약(`status IN ('PENDING', 'CONFIRMED')`) 건이 존재하는지 카운트한다.
    - 1건 이상의 예약이 남아있는 경우, 예약이 남아있다는 명확한 경고 메시지와 함께 `409 Conflict` 예외 코드를 반환하고 프로세스를 즉각 중단한다.
7. 위 검증들을 모두 정상적으로 통과하면 `program_time_slots` 테이블의 `status` 값을 지정한 값으로 갱신 반영한다.
8. 상태 변경 성공 결과를 응답한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-27T11:15:00.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "타임슬롯 상태가 성공적으로 변경되었습니다.",
  "data": {
    "slotId": "slot-uuid-101",
    "status": "CLOSED",
    "updatedAt": "2026-05-27T11:15:00.000Z"
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-27T11:15:02.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "타임슬롯 상태는 'OPEN', 'CLOSED', 'CANCELED' 중 하나여야 합니다.",
  "data": null,
  "error": "INVALID_SLOT_STATUS"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-27T11:15:03.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "토큰 인증 자격 증명이 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-27T11:15:04.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "해당 공방의 타임슬롯 상태를 강제 변경할 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-27T11:15:05.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "해당 타임슬롯 정보가 존재하지 않거나 연관 정보가 잘못되었습니다.",
  "data": null,
  "error": "SLOT_NOT_FOUND"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-27T11:15:06.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "현재 예약 대기(PENDING) 또는 확정(CONFIRMED) 상태인 고객 예약 건이 존재하여 타임슬롯을 취소할 수 없습니다. 예약 취소를 선행해 주세요.",
  "data": null,
  "error": "ACTIVE_RESERVATIONS_EXIST"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-27T11:15:08.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots/slot-uuid-101/status",
  "message": "타임슬롯 상태 변경 도중 데이터베이스 예외 트랜잭션 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /reservations

## 요구사항

- 인증된 사용자가 특정 프로그램 시간대에 예약을 생성한다.
- 대상 클래스가 `ACTIVE`, 공방이 `PUBLISHED` 상태여야 하며, 잔여 정원이 1 이상이어야 한다.
- 예약자가 해당 공방의 파트너인 경우 자기거래로 판단하여 차단한다.
- `auto_confirm = true` 공방이면 예약 생성 즉시 `CONFIRMED`로 전이되고 Artwork가 자동 생성된다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Body


```json
{
  "programId": "prog-uuid-001",
  "slotId": "slot-uuid-001",
  "reserverName": "김토담",
  "reserverPhone": "010-1234-5678",
  "participantCount": 2,
  "deliveryMethod": "DELIVERY",
  "shippingAddress": "서울특별시 마포구 월드컵북로 12, 101호",
  "requestMemo": "왼손잡이라 주의 부탁드립니다."
}
```


---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `programId`와 `slotId`로 클래스 및 시간 슬롯의 상태를 검증한다.
- 잔여 정원(`capacity - reserved_count`)이 `participantCount` 이상인지 확인한다 (동시성 안전 처리).
- `program_time_slots.status = 'CLOSED'` 여부를 확인한다.
- 예약자가 해당 공방의 파트너인지 확인하여 자기거래를 차단한다.
- `reservations` row를 생성한다 (`status = 'PENDING'`, `source = 'CUSTOMER'`).
- 배송(`deliveryMethod = 'DELIVERY'`) 선택 시 `deliveries` row를 생성하고 `shippingAddress`를 저장한다.
- `program_time_slots.reserved_count`를 `participantCount`만큼 증가시킨다.
- `auto_confirm = true`인 공방이면 즉시 `CONFIRMED` 전이 후 `artworks` row를 자동 생성하고 QR 토큰을 발급한다.
- 고객에게 예약 접수 알림, 파트너에게 새 예약 알림을 발송한다.
- 예약 완료 응답을 반환한다.

---


## Response


### `201 Created`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-25T19:35:00.000Z",
  "path": "/reservations",
  "message": "예약이 성공적으로 접수되었습니다.",
  "data": {
    "reservation": {
      "id": "res-uuid-001",
      "programId": "prog-uuid-001",
      "slotId": "slot-uuid-001",
      "reserverName": "김토담",
      "participantCount": 2,
      "status": "PENDING",
      "displayState": {
        "label": "예약신청",
        "description": "작가님이 예약 내용을 확인하고 있어요.",
        "subLabel": null
      },
      "createdAt": "2026-05-25T19:35:00.000Z"
    }
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-25T19:35:03.000Z",
  "path": "/reservations",
  "message": "선택하신 시간대의 잔여 정원이 부족합니다.",
  "data": null,
  "error": "INSUFFICIENT_CAPACITY"
}
```


### `403 Forbidden`


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T19:35:04.000Z",
  "path": "/reservations",
  "message": "본인 공방에는 예약할 수 없습니다.",
  "data": null,
  "error": "SELF_RESERVATION_NOT_ALLOWED"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-25T19:35:05.000Z",
  "path": "/reservations",
  "message": "차단된 시간대입니다. 다른 시간을 선택해주세요.",
  "data": null,
  "error": "SLOT_BLOCKED"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T19:35:08.000Z",
  "path": "/reservations",
  "message": "예약 처리 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /users/me

## 요구사항

- 로그인한 사용자가 본인의 마이페이지 및 프로필 정보를 확인하기 위해 회원 정보를 조회한다.
- 요청 헤더의 Access Token을 기반으로 사용자를 식별하며, 해당 유저의 현재 상태(일반 유저/파트너 여부)와 가입 정보(이메일, 닉네임)를 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증한다.
- 토큰 내 Payload에서 사용자 고유 ID(`userId`)를 추출한다.
- `users` 테이블에서 해당 ID를 가진 사용자의 로우(Row)를 조회한다.
- 조회된 유저의 상태(`status`)가 `ACTIVE` 상태인지 검증한다 (탈퇴 회원은 조회 불가).
- 사용자의 식별 ID, 이메일, 닉네임, 파트너 여부(`is_partner`) 데이터를 패키징하여 응답을 반환한다

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-24T18:05:00.789Z",
  "path": "/users/me",
  "message": "프로필 정보가 성공적으로 조회되었습니다.",
  "data": {
    "user": {
      "userId": "eb50a73f-785f-49ce-887b-5f0bba67a1e3",
      "email": "user@example.com",
      "nickname": "토담이",
      "isPartner": false,
      "createdAt": "2026-05-24T16:55:00.000Z"
    }
  },
  "error": null
}
```


### `401 Unauthorized (로그인 세션 만료 및 토큰 누락)`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-24T18:05:03.123Z",
  "path": "/users/me",
  "message": "인증 정보가 유효하지 않거나 만료되었습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `404 Not Found (존재하지 않는 유저)`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-24T18:05:05.456Z",
  "path": "/users/me",
  "message": "존재하지 않거나 탈퇴 처리된 회원입니다.",
  "data": null,
  "error": "USER_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-24T18:05:10.999Z",
  "path": "/users/me",
  "message": "프로필 조회 처리 중 서버 내부 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/programs/{programId}/time-slots

## 요구사항

- 인증된 파트너(공방 사장님)가 특정 프로그램에 대해 예약 가능한 일자 및 시간대 슬롯(Time Slot)을 생성한다.
- 운영 편의성을 위해 단일 생성뿐만 아니라 여러 날짜와 여러 시간대를 배열 구조로 묶어 **벌크 일괄 생성(Bulk Creation)** 할 수 있도록 지원한다.
- 생성하고자 하는 시간 슬롯은 해당 공방의 정기 휴무일이나 차단 슬롯(`program_time_slots.status = 'CLOSED'`) 영역과 겹치지 않아야 한다.
- 이미 동일한 날짜 및 시작/종료 시간으로 해당 프로그램에 타임슬롯이 생성되어 있다면 충돌(`409 Conflict`) 오류를 반환한다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 파트너가 소유한 공방 UUID
- `programId`: 대상 클래스(프로그램) UUID

### Body


```json
{
  "slots": [
    {
      "startAt": "2026-06-01T10:00:00.000Z",
      "endAt": "2026-06-01T12:00:00.000Z",
      "capacity": 6
    },
    {
      "startAt": "2026-06-01T14:00:00.000Z",
      "endAt": "2026-06-01T16:00:00.000Z",
      "capacity": 6
    }
  ]
}
```


---


### 시스템 처리 

- 요청 헤더의 Access Token 유효성을 검증하고 파트너 capability 권한이 존재하는지 확인한다.
- `storeId`로 공방을 조회하고 해당 파트너 계정이 소유한 공방이 맞는지 소유권을 검증한다 (`403 Forbidden`).
- `programId`로 프로그램을 조회하고, 해당 프로그램이 실제 공방 소속인지 및 활성 상태(`ACTIVE` 또는 `DRAFT`)인지 검증한다.
- 요청 바디의 `slots` 배열을 파싱하여 각 슬롯의 유효성을 검사한다.
    - 시작 시간(`startAt`)은 현재 시각 이후여야 한다.
    - 시작 시간은 종료 시간(`endAt`)보다 빨라야 한다.
    - 슬롯 최대 정원(`capacity`)은 1명 이상이어야 한다
- `program_time_slots` 테이블을 쿼리하여 이미 동일한 시간대(`startAt` ~ `endAt`)에 생성된 슬롯이 있는지 중복 여부를 체크한다.
- 중복이나 겹침이 없다면 데이터베이스 트랜잭션을 적용하여 `program_time_slots` 테이블에 레코드들을 일괄 생성(`status = 'OPEN'`)한다.
- 생성된 타임슬롯 상세 정보 목록을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 201,
  "timestamp": "2026-05-27T11:05:00.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "타임슬롯이 성공적으로 일괄 생성되었습니다.",
  "data": {
    "createdSlots": [
      {
        "slotId": "slot-uuid-101",
        "startAt": "2026-06-01T10:00:00.000Z",
        "endAt": "2026-06-01T12:00:00.000Z",
        "capacity": 6,
        "reservedCount": 0,
        "status": "OPEN",
        "createdAt": "2026-05-27T11:05:00.000Z"
      },
      {
        "slotId": "slot-uuid-102",
        "startAt": "2026-06-01T14:00:00.000Z",
        "endAt": "2026-06-01T16:00:00.000Z",
        "capacity": 6,
        "reservedCount": 0,
        "status": "OPEN",
        "createdAt": "2026-05-27T11:05:00.000Z"
      }
    ]
  },
  "error": null
}
```


### `400 Bad Request` 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-27T11:05:02.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "슬롯 시작 시간은 종료 시간보다 이전이어야 하며, 과거 시각으로 생성할 수 없습니다.",
  "data": null,
  "error": "INVALID_SLOT_TIME"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-27T11:05:03.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "파트너 권한 인증에 실패했습니다.",
  "data": null,
  "error": "UNAUTHORIZED"
}
```


### `40`**`3 Forbidden`**


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-27T11:05:04.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "해당 공방의 타임슬롯을 생성할 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-27T11:05:05.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "요청하신 공방 또는 프로그램을 찾을 수 없습니다.",
  "data": null,
  "error": "RESOURCE_NOT_FOUND"
}
```


### `409 Conflict`


```json
{
  "statusCode": 409,
  "timestamp": "2026-05-27T11:05:06.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "요청하신 시간대 중 이미 존재하는 슬롯과 겹치거나 정기 휴일과 충돌하는 영역이 존재합니다.",
  "data": null,
  "error": "SLOT_ALREADY_EXISTS"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-27T11:05:08.000Z",
  "path": "/partner/stores/store-uuid-001/programs/prog-uuid-001/time-slots",
  "message": "타임슬롯 생성 처리 중 시스템 DB 에러가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /partner/stores/{storeId}/artworks

## 요구사항

- 인증된 파트너가 본인 공방에 속한 작품 목록을 조회한다.
- 제작 상태별 필터링 및 커서 기반 무한 스크롤을 지원한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `storeId`: 공방 UUID

### Query Parameters

- `status`: 작품 상태 필터 (선택)
- `cursor`: 이전 응답의 `nextCursor` 값 (선택, 첫 요청 시 생략)
- `limit`: 한 번에 가져올 항목 수 (기본값: 20)

---


### 시스템 처리 

- 인증 토큰으로 파트너 capability를 검증한다.
- 공방 소유 권한을 확인한다.
- 필터 조건을 적용하고 `cursor` 이후 데이터를 `limit + 1`개 조회하여 다음 페이지 존재 여부를 확인한다.
- 각 작품의 현재 상태, 예약자명, 예상 완성일을 포함하고 `nextCursor`를 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:30:00.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/artworks",
  "message": "작품 목록이 성공적으로 조회되었습니다.",
  "data": {
    "artworks": [
      {
        "id": "artwork-uuid-001",
        "reserverName": "김토담",
        "status": "DRYING",
        "estimatedCompletedAt": "2026-07-01T00:00:00.000Z",
        "thumbnailUrl": "https://cdn.todam.app/artworks/artwork-uuid-001/thumb.jpg",
        "updatedAt": "2026-06-02T10:00:00.000Z"
      }
    ],
    "nextCursor": "artwork-uuid-002",
    "hasMore": true
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T20:30:03.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/artworks",
  "message": "해당 공방에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:30:08.000Z",
  "path": "/partner/stores/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d/artworks",
  "message": "작품 목록 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /reviews/{reviewId}

## 요구사항

- 리뷰 작성자 본인만 삭제할 수 있다.
- 작성 기한 이후에도 삭제는 허용된다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `reviewId`: 삭제할 리뷰 UUID

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `reviewId`로 리뷰를 조회하고 소유자가 요청자인지 확인한다.
- `reviews` 및 연결된 `review_photos` row를 삭제한다.
- S3에서 리뷰 사진 원본·썸네일을 삭제한다.
- 공방·프로그램 평균 별점 및 리뷰 수를 재계산한다.
- 삭제 완료 응답을 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T21:10:00.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰가 성공적으로 삭제되었습니다.",
  "data": null,
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T21:10:03.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "해당 리뷰에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T21:10:04.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰를 찾을 수 없습니다.",
  "data": null,
  "error": "REVIEW_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T21:10:08.000Z",
  "path": "/reviews/review-uuid-001",
  "message": "리뷰 삭제 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /auth/password/reset

## 요구사항

- 사용자가 이메일 내 재설정 링크를 클릭하여 진입한 화면에서, 1회성 임시 보안 토큰을 이용하여 기존 계정의 비밀번호를 규격에 부합하는 새로운 안전한 비밀번호로 변경한다.
- **선행조건 및 동작 연계**:
    - 변경할 새 비밀번호는 복잡도 정책(영문 포함, 숫자 포함, 특수문자 포함, 8자 이상)을 반드시 만족해야 한다.
    - 보안 강화를 위해, **기존에 사용하던 기존 비밀번호와 동일한 비밀번호는 재사용할 수 없도록 철저히 차단**한다.
    - 비밀번호 변경이 성공적으로 완료되면, 계정 무단 점유 방지 및 즉각적인 보호를 위해 **대상 사용자의 기존 활성화된 모든 로그인 세션(Refresh Token)을 강제로 일괄 무효화(만료) 처리**하여 모든 기기에서 즉시 로그아웃되도록 강제한다.
    - **1회성 토큰 보장**: 비밀번호 재설정에 사용된 임시 보안 토큰은 사용 처리 즉시 데이터베이스(또는 임시 저장소)에서 완전히 삭제 및 파기하여 재사용을 절대 불가하게 만든다.

---


## Request


### Headers

- Content-Type: application/json
- Accept: application/json

### Body


```json
{
  "token": "secret-security-token-sent-via-email-001",
  "newPassword": "NewSecurePassword123!"
}
```


---


### 시스템 처리 

- 요청 바디 내 토큰(`token`) 및 새 비밀번호(`newPassword`)의 유효성을 검증한다.
- 임시 저장소에서 해당 토큰을 대조하여 존재 여부 및 유효 만료 시간(15분) 이내인지 검증한다.
- 토큰과 바인딩된 가입자 ID(`userId`)를 역추출하여 대상 유저 레코드를 확보한다.
- 새 비밀번호의 복잡도 규격(영문/숫자/특수문자 포함 8자 이상) 정규식을 검증한다.
- **기존 비밀번호 재사용 제한 검증**: `users` 테이블에 해시 저장된 기존 비밀번호(Bcrypt)와 새 비밀번호를 `bcrypt.compare()` 등의 함수로 상호 대조하여, **완벽히 동일한 경우 에러(400 Bad Request, PASSWORD_ALREADY_USED)를 반환**하고 차단한다.
- 신규 비밀번호를 단방향 암호화 해시 알고리즘(Bcrypt)으로 안전하게 가공하여 `users` 테이블의 비밀번호 필드를 갱신 저장한다.
- 비밀번호 갱신 성공 즉시, 해당 유저 ID와 연동되었던 기존 모든 Refresh Token 세션을 데이터베이스에서 일괄 삭제 처리하여 모든 기기에서 즉각 강제 로그아웃 조치한다.
- 사용한 임시 토큰을 무효화/삭제 처리한다.
- 성공 완료 응답을 반환한다. (프론트엔드에서는 완료 응답을 인지하여 로그인 화면으로 리다이렉트 처리하고 성공 토스트를 노출한다.)

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-26T19:42:00.000Z",
  "path": "/auth/password/reset",
  "message": "비밀번호가 성공적으로 재설정되었습니다. 새로운 비밀번호로 다시 로그인해주세요.",
  "data": null,
  "error": null
}
```


### `400 Bad Request` **`(비밀번호 형식 규격 에러)`** 


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:42:02.000Z",
  "path": "/auth/password/reset",
  "message": "비밀번호 규격 조건(영문, 숫자, 특수문자를 혼용하여 8자리 이상)을 만족하지 못했습니다.",
  "data": null,
  "error": "INVALID_PASSWORD_FORMAT"
}
```


### `4`**`00 Bad Request (기존 비밀번호와 동일)`**


```json
{
  "statusCode": 400,
  "timestamp": "2026-05-26T19:42:03.000Z",
  "path": "/auth/password/reset",
  "message": "기존에 사용하던 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다. 다른 비밀번호를 입력해 주세요.",
  "data": null,
  "error": "PASSWORD_ALREADY_USED"
}
```


### `401 Unauthorized`


```json
{
  "statusCode": 401,
  "timestamp": "2026-05-26T19:42:04.000Z",
  "path": "/auth/password/reset",
  "message": "유효하지 않거나 이미 시간 만료된 보안 토큰 정보입니다. 재설정 요청을 다시 시작해 주세요.",
  "data": null,
  "error": "INVALID_OR_EXPIRED_TOKEN"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-26T19:42:08.000Z",
  "path": "/auth/password/reset",
  "message": "새 비밀번호의 암호화 저장 과정 중 서버 데이터베이스 트랜잭션 예외가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## /artworks/{artworkId}

## 요구사항

- 인증된 사용자가 본인 예약과 연결된 작품의 제작 단계 및 사진을 조회한다.
- 내부 메모·변경자 등 운영 정보는 포함하지 않으며, `displayState` 노출 문구로 치환하여 반환한다.

---


## Request


### Headers

- Accept: application/json
- Authorization: Bearer {accessToken}

### Path Parameters

- `artworkId`: 작품 UUID

---


### 시스템 처리 

- 인증 토큰으로 사용자를 식별한다.
- `artworkId`로 작품을 조회하고 연결된 예약의 소유자가 요청자인지 확인한다.
- `artwork_logs`를 시각 순으로 조회하고, 각 로그에 연결된 `artwork_photos`를 묶어 반환한다.
- 내부 상태를 `displayState` 노출 문구로 치환한다.
- 완료된 단계·현재 단계·미완료 단계를 구분하여 반환한다.
- 예상 완성일을 함께 반환한다.

---


## Response


### `200 OK`


```json
{
  "statusCode": 200,
  "timestamp": "2026-05-25T20:20:00.000Z",
  "path": "/artworks/artwork-uuid-001",
  "message": "작품 제작 단계가 성공적으로 조회되었습니다.",
  "data": {
    "artwork": {
      "id": "artwork-uuid-001",
      "estimatedCompletedAt": "2026-07-01T00:00:00.000Z",
      "currentStage": {
        "status": "DRYING",
        "displayState": {
          "label": "제작 중",
          "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
          "subLabel": "건조"
        }
      },
      "timeline": [
        {
          "stage": "VISITED",
          "isCompleted": true,
          "displayState": {
            "label": "흙",
            "description": "체험이 완료되었어요.",
            "subLabel": null
          },
          "photos": [],
          "completedAt": "2026-06-01T12:30:00.000Z"
        },
        {
          "stage": "DRYING",
          "isCompleted": false,
          "isCurrent": true,
          "displayState": {
            "label": "제작 중",
            "description": "작품이 단단해지도록 정성껏 말리고 있어요.",
            "subLabel": "건조"
          },
          "photos": [
            {
              "thumbnailUrl": "https://cdn.todam.app/artworks/artwork-uuid-001/drying_thumb.jpg"
            }
          ]
        }
      ]
    }
  },
  "error": null
}
```


### `403 Forbidden` 


```json
{
  "statusCode": 403,
  "timestamp": "2026-05-25T20:20:03.000Z",
  "path": "/artworks/artwork-uuid-001",
  "message": "해당 작품에 대한 접근 권한이 없습니다.",
  "data": null,
  "error": "FORBIDDEN"
}
```


### `404 Not Found`


```json
{
  "statusCode": 404,
  "timestamp": "2026-05-25T20:20:04.000Z",
  "path": "/artworks/artwork-uuid-001",
  "message": "작품을 찾을 수 없습니다.",
  "data": null,
  "error": "ARTWORK_NOT_FOUND"
}
```


### `500 Internal Server Error`


```json
{
  "statusCode": 500,
  "timestamp": "2026-05-25T20:20:08.000Z",
  "path": "/artworks/artwork-uuid-001",
  "message": "작품 제작 단계 조회 중 서버 오류가 발생했습니다.",
  "data": null,
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

