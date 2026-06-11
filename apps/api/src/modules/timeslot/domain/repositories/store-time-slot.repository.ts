// StoreTimeSlot 영속 포트(추상 클래스 = DI 토큰).
// 구현은 infrastructure/persistence/prisma-store-time-slot.repository.ts.
// 멀티-write(트랜잭션)는 메서드 하나가 통째로 캡슐화한다.

import { StoreTimeSlot, TimeSlotStatus } from '../entities/store-time-slot.entity';
import { SlotCandidate } from '../services/time-slot-generation.service';

export interface FindSlotsQuery {
    range?: { start: Date; end: Date };
    status?: TimeSlotStatus;
}

export interface ApplyGeneratedGridInput {
    storeId: string;
    candidates: SlotCandidate[];
    /** 생성 범위의 절대 시각 윈도우([startDate 00:00 KST, endDate 24:00 KST)). prune 대상 한정. */
    window: { start: Date; end: Date };
    /** 현재 시각 — 미래 슬롯만 prune 대상. */
    now: Date;
}

export interface ApplyGeneratedGridResult {
    created: StoreTimeSlot[];
    alreadyExisting: number;
    removedCount: number;
    /** stale 이지만 활성 예약이 있어 삭제 대신 CLOSED 로 전환한 슬롯 수(신규 예약 차단·기존 예약 보존). */
    closedCount: number;
}

export abstract class StoreTimeSlotRepository {
    abstract findByStore(storeId: string, query: FindSlotsQuery): Promise<StoreTimeSlot[]>;
    abstract findById(id: string): Promise<StoreTimeSlot | null>;
    abstract findByIds(storeId: string, ids: string[]): Promise<StoreTimeSlot[]>;
    abstract updateStatus(id: string, status: TimeSlotStatus): Promise<StoreTimeSlot>;

    /**
     * 멱등 생성 + prune 을 한 트랜잭션으로 적용.
     * - prune: 윈도우 내 미래 OPEN 슬롯 중 새 격자 (startAt,endAt) 쌍에 없고 활성 예약 없는 것 삭제.
     * - create: 이미 존재하는 startAt 스킵, 신규만 생성.
     */
    abstract applyGeneratedGrid(input: ApplyGeneratedGridInput): Promise<ApplyGeneratedGridResult>;
}
