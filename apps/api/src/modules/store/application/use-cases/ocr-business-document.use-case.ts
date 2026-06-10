import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { S3Service, ObjectTooLargeError } from '../../../../common/s3/s3.service';
import { VisionService } from '../../../../common/vision/vision.service';
import { RedisService } from '../../../../redis/redis.service';
import {
    resolveOwnedBusinessDocumentKey,
    assertBusinessDocumentContentType,
} from '../../../../common/s3/business-document.util';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { parseBusinessDocument } from '../ocr/business-document-parser';
import type { BusinessDocumentOcrResult } from '@todam/shared';

// OCR 대상 최대 파일 크기(10MB). 초과 시 다운로드/Vision 호출 전에 차단해 메모리 고갈을 막는다.
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

// OCR 결과 캐시 TTL(초). 같은 이미지(documentKey+etag) 재호출 시 Vision을 다시 부르지 않아 비용·부하를 줄인다.
// 캐시 키에 ETag를 포함해 동일 key로 객체가 교체되면 캐시가 무효화된다(이전 결과 반환 방지).
const OCR_CACHE_TTL_SECONDS = 600;
const ocrCacheKey = (documentKey: string, etag: string): string =>
    `ocr:result:${documentKey}:${etag}`;

@Injectable()
export class OcrBusinessDocumentUseCase {
    private readonly logger = new Logger(OcrBusinessDocumentUseCase.name);

    constructor(
        private readonly s3: S3Service,
        private readonly vision: VisionService,
        private readonly redis: RedisService,
    ) {}

    async execute(userId: string, documentUrl: string): Promise<BusinessDocumentOcrResult> {
        // ── 1. documentUrl → key 변환 + prefix 화이트리스트 + 소유권(IDOR) 검증 ──
        const key = resolveOwnedBusinessDocumentKey(userId, documentUrl);

        // ── 2. S3 객체 메타데이터 조회 (존재·크기·타입·ETag 게이트) ──────────
        // 캐시보다 먼저 HeadObject를 수행해야 삭제·교체된 객체에 대한 이전 결과 반환을 막는다.
        const head = await this.s3.headObject(key);
        if (!head) {
            throw new BusinessException(
                'DOCUMENT_NOT_FOUND',
                '사업자등록증 파일을 찾을 수 없습니다. 먼저 업로드를 완료해 주세요.',
                HttpStatus.NOT_FOUND,
            );
        }

        // 타입 화이트리스트: Vision TEXT_DETECTION이 처리 가능한 이미지(JPEG/PNG)만 허용.
        // PDF·application/octet-stream·Content-Type 없음 등은 모두 415로 반려(저장 검증과 동일 규칙).
        assertBusinessDocumentContentType(head.contentType);

        // 대용량 차단: 전체 버퍼링 전에 크기를 검증해 메모리 고갈을 막는다.
        if (head.contentLength > MAX_DOCUMENT_BYTES) {
            throw new BusinessException(
                'DOCUMENT_TOO_LARGE',
                '파일이 너무 큽니다. 10MB 이하 이미지를 업로드해 주세요.',
                HttpStatus.PAYLOAD_TOO_LARGE,
            );
        }

        // ── 3. 결과 캐시 조회 (동일 이미지 재호출 dedup) ────────────────────
        // 캐시 키에 ETag 포함 → 객체가 교체되면 다른 키가 되어 이전 결과를 재사용하지 않는다.
        // ETag가 없으면(드묾) 캐시를 건너뛰고 매번 OCR. Redis 장애는 best-effort 무시.
        if (head.etag) {
            const cached = await this.readCache(key, head.etag);
            if (cached) {
                this.logger.log(`OCR 캐시 적중 (key=${key})`);
                return cached;
            }
        }

        // ── 4. S3 GetObject (IAM 권한) ───────────────────────────────────────
        // HeadObject 크기 검사 이후 객체가 교체되는 TOCTOU 방어 — 스트리밍 중 상한 초과 시 중단.
        let imageBuffer: Buffer;
        try {
            imageBuffer = await this.s3.getObjectBuffer(key, MAX_DOCUMENT_BYTES);
        } catch (error) {
            if (error instanceof ObjectTooLargeError) {
                throw new BusinessException(
                    'DOCUMENT_TOO_LARGE',
                    '파일이 너무 큽니다. 10MB 이하 이미지를 업로드해 주세요.',
                    HttpStatus.PAYLOAD_TOO_LARGE,
                );
            }
            throw error;
        }

        // ── 6. Google Cloud Vision TEXT_DETECTION ────────────────────────────
        let rawText: string;
        try {
            rawText = await this.vision.detectText(imageBuffer);
        } catch (error) {
            // 이미 의미 있는 HTTP 예외(503 자격증명 미설정 등)는 상태코드를 보존해 그대로 전달한다.
            if (error instanceof HttpException) throw error;
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Vision API 호출 실패 (key=${key}): ${message}`);
            throw new BusinessException(
                'OCR_FAILED',
                'OCR 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // ── 7. 텍스트 파싱 ───────────────────────────────────────────────────
        // rawText가 빈 문자열이면 파싱 결과는 모두 null (텍스트 추출 시도는 성공 — 200 반환).
        const parsed = parseBusinessDocument(rawText);

        // 관측용 로그 — PII(사업자번호 등 값)는 남기지 않고 추출 성공 필드 수만 기록한다.
        const extractedCount = [
            parsed.businessNumber,
            parsed.ownerName,
            parsed.businessName,
            parsed.businessAddress,
            parsed.startDate,
        ].filter((v) => v !== null).length;
        this.logger.log(`OCR 완료 (key=${key}): ${extractedCount}/5 필드 추출`);

        // ── 8. 응답 반환 ──────────────────────────────────────────────────────
        // 성공(200)=텍스트 추출 완료. 개별 필드 null은 파싱 실패(graceful degradation).
        // 처리 실패는 HTTP 에러(404/413/415/500/503)로 표현하므로 별도 상태 필드를 두지 않는다.
        // 파서 반환 타입이 응답 계약과 동일 구조라 그대로 사용(재매핑 불필요).
        const result: BusinessDocumentOcrResult = parsed;

        if (head.etag) {
            await this.writeCache(key, head.etag, result);
        }
        return result;
    }

    // ── 결과 캐시 (best-effort) ────────────────────────────────────────────
    // Redis 장애가 OCR 자체를 막지 않도록 get/set 모두 예외를 삼킨다.
    private async readCache(key: string, etag: string): Promise<BusinessDocumentOcrResult | null> {
        try {
            const raw = await this.redis.get(ocrCacheKey(key, etag));
            return raw ? (JSON.parse(raw) as BusinessDocumentOcrResult) : null;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`OCR 캐시 조회 실패(무시) (key=${key}): ${message}`);
            return null;
        }
    }

    private async writeCache(
        key: string,
        etag: string,
        result: BusinessDocumentOcrResult,
    ): Promise<void> {
        try {
            await this.redis.set(
                ocrCacheKey(key, etag),
                JSON.stringify(result),
                OCR_CACHE_TTL_SECONDS,
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`OCR 캐시 저장 실패(무시) (key=${key}): ${message}`);
        }
    }
}
