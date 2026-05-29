# StepperItemChild 미디어 업로드 (pre-signed)

## Goal

- 파트너 편집모드에서 `StepperItemChild` 썸네일 추가/삭제.
- 이미지 업로드는 S3 pre-signed PUT으로 프론트가 직접 처리.
- 컴포넌트는 presentational 유지. 업로드/상태는 호출부 hook이 담당.

## 현재 상태 (완료분)

- `apps/web/src/shared/ui/StepperItemChild.tsx` 편집모드 API 구현 완료.
  - props: `editable`, `maxImages`(기본 5), `onRemoveImage(index)`, `onAddMedia()`.
  - X 삭제버튼: `editable && onRemoveImage` → 썸네일 우상단 20px 다크원형(`bg-foreground-secondary`, CloseIcon white).
  - 카메라 추가버튼: `editable && onAddMedia && images<max` → 끝에 64px 점선(`border-dashed`, CameraIcon).
  - category 태그(`IMG` 배지)는 제외. view 모드 기존 유지.
- 백엔드 `S3Service` 존재: `createPresignedPutUrl(key, contentType)` → `{ uploadUrl, key, expiresIn }`, `createPresignedGetUrl(key)`, `deleteObject(key)`.

## 남은 작업 (나중에)

### 1. 백엔드 업로드 엔드포인트

- 현재 `GET /health/s3` 테스트용만 (`image/jpeg` 하드코딩).
- 실 엔드포인트 추가: `POST /uploads/presign` body `{ contentType }` → presigned PUT 반환.
- `key`는 서버 `buildObjectKey`로 생성 (클라 신뢰 X).
- 삭제는 서버 경유 `deleteObject(key)` 엔드포인트 (orphan 정리).

### 2. 프론트 hook + 래퍼

```ts
function usePresignedUpload() {
  return async (file: File): Promise<{ key: string }> => {
    const { uploadUrl, key } = await api.post("/uploads/presign", {
      contentType: file.type,
    });
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type }, // presign ContentType과 일치 필수
    });
    if (!res.ok) throw new Error("upload failed");
    return { key };
  };
}
```

호출부 wiring:

```tsx
const upload = usePresignedUpload();
const inputRef = useRef<HTMLInputElement>(null);

const handleAdd = () => inputRef.current?.click();
const handleFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const { key } = await upload(file);
  setImages((prev) => [...prev, { key, src: toDisplayUrl(key) }]);
};
const handleRemove = (i: number) => {
  // 선택: 서버에 deleteObject(key) 요청
  setImages((prev) => prev.filter((_, idx) => idx !== i));
};

<StepperItemChild
  editable
  images={images}
  onAddMedia={handleAdd}
  onRemoveImage={handleRemove}
/>
<input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
```

## 흐름

```
파일선택 → POST /uploads/presign (contentType) → S3로 직접 PUT(uploadUrl) → key 저장 → 표시용 URL로 src 렌더
```

## Risks / 주의

- presign `ContentType` ↔ PUT `Content-Type` 헤더 불일치 → S3 403.
- presigned URL 만료(기본 300s). DB/폼엔 URL 아닌 **`key`** 저장. 표시는 `createPresignedGetUrl` 또는 public CDN URL.
- `key` 생성은 서버에서. 삭제 시 S3 객체도 서버 경유 정리.

## Verify (예정)

- `pnpm --filter @todam/web typecheck`
- `pnpm --filter @todam/api typecheck`
- 수동: 파일 선택 → 업로드 → 썸네일 노출 → 삭제 → 재업로드.

## Status

- StepperItemChild 편집모드 UI: 구현 완료, typecheck 통과.
- 업로드 엔드포인트 / hook / wiring: **미착수**.

### 남은 작업 트리거

1. 백엔드 `POST /uploads/presign` (+ 삭제 엔드포인트) — 트리거: 미디어 업로드 실연동 착수 시(작품 관리 화면 작업).
2. 프론트 `usePresignedUpload` 훅 + 호출부 wiring — 트리거: **1번 엔드포인트 완성 후**(선행 의존).
