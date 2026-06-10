import { Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createApiEnv } from '@todam/config';
import { keyFromImageUrl } from './s3-object.util';

// 스트리밍 중 최대 크기 초과로 다운로드를 중단했을 때 던지는 에러.
// 호출부에서 식별해 적절한 HTTP 상태(413 등)로 매핑한다.
export class ObjectTooLargeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ObjectTooLargeError';
    }
}

@Injectable()
export class S3Service {
    private readonly env = createApiEnv();
    private readonly client = new S3Client({
        region: this.env.S3_REGION,
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
    });

    async createPresignedPutUrl(key: string, contentType: string, expiresIn = 300) {
        const command = new PutObjectCommand({
            Bucket: this.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
        return { uploadUrl, key, expiresIn };
    }

    async createPresignedGetUrl(key: string, expiresIn = 300) {
        const command = new GetObjectCommand({
            Bucket: this.env.S3_BUCKET_NAME,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn });
    }

    async objectExists(key: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.env.S3_BUCKET_NAME,
                    Key: key,
                }),
            );
            return true;
        } catch (error) {
            const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
                ?.httpStatusCode;
            if (status === 404 || status === 403) {
                return false;
            }
            throw error;
        }
    }

    /**
     * S3 객체 메타데이터(크기·Content-Type)를 조회한다. 객체가 없으면 null.
     * 다운로드 전 크기/타입 게이트(OCR PDF 차단·대용량 차단)에 사용한다.
     */
    async headObject(key: string): Promise<{
        contentLength: number;
        contentType: string | undefined;
        etag: string | undefined;
    } | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.env.S3_BUCKET_NAME,
                    Key: key,
                }),
            );
            return {
                contentLength: response.ContentLength ?? 0,
                contentType: response.ContentType,
                etag: response.ETag,
            };
        } catch (error) {
            const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
                ?.httpStatusCode;
            if (status === 404 || status === 403) {
                return null;
            }
            throw error;
        }
    }

    /**
     * S3 객체를 읽어 Buffer로 반환한다.
     * OCR 등 서버 사이드 처리에서 사용. presigned URL 없이 IAM 권한으로 직접 읽는다.
     *
     * @param maxBytes 지정 시 수신 누적이 이를 초과하면 스트림을 중단하고 reject.
     *   HeadObject 크기 검사 이후 객체가 교체되는 TOCTOU를 방어한다(메모리 고갈 방지).
     */
    async getObjectBuffer(key: string, maxBytes?: number): Promise<Buffer> {
        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.env.S3_BUCKET_NAME,
                Key: key,
            }),
        );

        const stream = response.Body as Readable;
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            let received = 0;
            stream.on('data', (chunk: Buffer) => {
                received += chunk.length;
                if (maxBytes !== undefined && received > maxBytes) {
                    stream.destroy();
                    reject(
                        new ObjectTooLargeError(
                            `S3 객체가 허용 크기(${maxBytes} bytes)를 초과했습니다.`,
                        ),
                    );
                    return;
                }
                chunks.push(chunk);
            });
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    async deleteObject(key: string) {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.env.S3_BUCKET_NAME,
                Key: key,
            }),
        );
    }

    // 이미지 URL 배열의 S3 객체(원본·썸네일 등)를 best-effort 삭제한다.
    // 개별 삭제 실패는 무시(객체 부재 등) — 호출부의 DB row 정리를 막지 않기 위함.
    async deleteImageObjects(imageUrls: (string | null | undefined)[]): Promise<void> {
        const keys = imageUrls
            .filter((url): url is string => Boolean(url))
            .map((url) => keyFromImageUrl(url));

        await Promise.all(
            keys.map(async (key) => {
                try {
                    await this.deleteObject(key);
                } catch {
                    // S3 삭제 실패는 무시(객체 부재 등). row 정리를 우선한다.
                }
            }),
        );
    }
}
