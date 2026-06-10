export type ProgramImageStatus = 'PENDING' | 'UPLOADED' | 'FAILED';

export interface ProgramImage {
    id: string;
    imageUrl: string;
    status: ProgramImageStatus;
}

export interface CreatePendingProgramImageInput {
    programId: string;
    imageUrl: string;
    isThumbnail: boolean;
}

/**
 * 클래스 이미지 CRUD 포트. store 의 StoreImageRepository 와 동일한 결을 따른다.
 * 대표 이미지(isThumbnail) 단일 불변식은 createPending 구현(트랜잭션)에서 보장한다.
 */
export abstract class ProgramImageRepository {
    abstract findByProgramAndId(programId: string, imageId: string): Promise<ProgramImage | null>;
    abstract createPending(input: CreatePendingProgramImageInput): Promise<{ id: string }>;
    abstract markUploaded(imageId: string): Promise<{ id: string; status: ProgramImageStatus }>;
    abstract delete(imageId: string): Promise<void>;
}
