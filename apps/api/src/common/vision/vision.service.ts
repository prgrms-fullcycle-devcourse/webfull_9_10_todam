import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { createApiEnv } from '@todam/config';

@Injectable()
export class VisionService {
    private client: ImageAnnotatorClient | null = null;

    private getClient(): ImageAnnotatorClient {
        if (this.client) return this.client;

        const env = createApiEnv();
        if (!env.GOOGLE_VISION_CLIENT_EMAIL || !env.GOOGLE_VISION_PRIVATE_KEY) {
            throw new ServiceUnavailableException(
                'Google Vision 자격증명이 설정되지 않았습니다. GOOGLE_VISION_CLIENT_EMAIL / GOOGLE_VISION_PRIVATE_KEY 환경변수를 확인하세요.',
            );
        }

        this.client = new ImageAnnotatorClient({
            credentials: {
                client_email: env.GOOGLE_VISION_CLIENT_EMAIL,
                // 환경변수 줄바꿈 이스케이프 처리 (\n 리터럴 → 실제 줄바꿈)
                private_key: env.GOOGLE_VISION_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
        });
        return this.client;
    }

    /**
     * 이미지 버퍼에서 전체 텍스트를 추출한다 (TEXT_DETECTION).
     * PDF는 Vision REST API의 async batch 방식이 필요하므로 이 메서드에서는 지원하지 않는다.
     * PDF 파일이 전달되면 명확한 에러를 던진다.
     *
     * @param imageBuffer 이미지 바이트 (JPEG / PNG / HEIC 등)
     * @param mimeType 파일 MIME 타입 (PDF 감지용)
     * @returns 추출된 전체 텍스트 문자열
     */
    async detectText(imageBuffer: Buffer, mimeType?: string): Promise<string> {
        if (mimeType === 'application/pdf') {
            throw new Error(
                'PDF 파일은 이미지 OCR을 지원하지 않습니다. 이미지(JPEG/PNG) 파일을 사용해 주세요.',
            );
        }

        const client = this.getClient();

        const [result] = await client.textDetection({
            image: { content: imageBuffer },
        });

        const detections = result.textAnnotations;
        if (!detections || detections.length === 0) {
            return '';
        }

        // index 0이 전체 텍스트 블록
        const first = detections[0];
        return first?.description ?? '';
    }
}
