import { Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createApiEnv } from '@todam/config';

@Injectable()
export class S3Service {
    private readonly env = createApiEnv();
    private readonly client = new S3Client({ region: this.env.S3_REGION });

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

    async deleteObject(key: string) {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.env.S3_BUCKET_NAME,
                Key: key,
            }),
        );
    }
}
