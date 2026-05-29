export interface PresignedUrlResponse {
    uploadUrl: string;
    key: string;
    expiresIn: number;
}
