import { Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createApiEnv } from '@todam/config';
import { keyFromImageUrl } from './s3-object.util';

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
