// presigned URL 로 S3 직접 PUT 업로드 (공방·클래스·사업자서류 등 전 도메인 공용).
// clientApiFetch 와 별개: 절대 S3 URL 로 직접 PUT 하므로 envelope/baseURL 처리 없음.
// contentType 미지정 시 file.type 사용.
export async function uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    contentType: string = file.type,
): Promise<void> {
    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
    });
    if (!res.ok) {
        throw new Error(`S3 업로드 실패 (${res.status})`);
    }
}
