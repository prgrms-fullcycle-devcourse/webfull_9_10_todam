'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ProgramStatus, formatPrice } from '@todam/shared';
import { Button, BottomBar, Modal } from '@todam/ui';

import { usePartnerPrograms, type PartnerProgramListItemView } from '@/features/program/list';
import { ClassOrderCardItem, useReorderPrograms } from '@/features/program/order';
import { useCurrentStoreId } from '@/shared/lib/useCurrentStoreId';
import { useLeaveGuard } from '@/shared/lib/useLeaveGuard';
import { useModal, useToast } from '@/shared/model';

// 배열 내 두 인덱스 항목 swap (불변) 범위 밖이면 원본 유지
function swap<T>(list: T[], a: number, b: number): T[] {
    if (a < 0 || b < 0 || a >= list.length || b >= list.length) return list;
    const next = [...list];
    const tmp = next[a]!;
    next[a] = next[b]!;
    next[b] = tmp;
    return next;
}

// 두 program 배열의 id 순서가 동일한지
function sameOrder(a: PartnerProgramListItemView[], b: PartnerProgramListItemView[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((p, i) => p.id === b[i]?.id);
}

// 해당 화면은 예외로 center 타이틀 → 전역 헤더 시스템(좌측정렬 sub 등)에 center 타입 추가 대신
// 로컬 헤더로 구현 (routeConfig 미등록 → 전역 Header 는 visible:false 로 숨김).
export default function PartnerClassOrderPage() {
    const router = useRouter();
    const storeId = useCurrentStoreId();
    const { push } = useToast();
    const { open, close } = useModal();

    const { data } = usePartnerPrograms(storeId);
    const reorder = useReorderPrograms(storeId);

    // sortOrder API asc 선정렬해 반환 → filter 가 순서 보존
    const initial = useMemo(
        () => (data?.programs ?? []).filter((p) => p.status !== ProgramStatus.DRAFT),
        [data],
    );

    // 로컬 편집 순서 초기 로드 시 initial 로 시드(키로 동기화)
    const [order, setOrder] = useState<PartnerProgramListItemView[]>([]);
    const [seededKey, setSeededKey] = useState<string>('');
    const initialKey = initial.map((p) => p.id).join(',');
    if (initialKey && initialKey !== seededKey) {
        setOrder(initial);
        setSeededKey(initialKey);
    }

    // dirty = 현재 편집 순서가 초기 로드 순서와 다른지.
    const dirty = order.length > 0 && !sameOrder(order, initial);

    const goList = () => router.push('/partner/classes');

    // dirty 이탈 가드: 취소/브라우저 뒤로가기 시 변경 손실 확인 모달
    const openLeaveConfirm = () => {
        open(
            <Modal
                title="변경사항을 저장하지 않고 나갈까요?"
                description="지금 나가면 변경한 순서가 저장되지 않아요."
                cancelLabel="계속 편집"
                confirmLabel="나가기"
                onCancel={close}
                onConfirm={() => {
                    close();
                    goList();
                }}
            />,
        );
    };

    // 취소 버튼: 변경 있으면 확인 모달, 없으면 바로 리스트
    const handleCancel = () => {
        if (dirty) openLeaveConfirm();
        else goList();
    };

    // 브라우저/제스처 뒤로가기·새로고침 가드
    useLeaveGuard(dirty, openLeaveConfirm);

    const handleSave = () => {
        if (!dirty || reorder.isPending) return;
        // Contract 바인딩: PATCH .../programs/order, body { programs: [{ id, sortOrder }] }.
        const body = {
            programs: order.map((p, i) => ({ id: p.id, sortOrder: i + 1 })),
        } as const;
        reorder.mutate(body, {
            onSuccess: () => {
                push({ message: '클래스 노출 순서가 변경되었어요' });
                goList();
            },
        });
    };

    if (!storeId) return null;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* 로컬 center 헤더 (이 화면 전용 — 전역 헤더 시스템 미사용) */}
            <header className="shrink-0 bg-transparent pt-safe">
                <div className="flex h-15 items-center justify-center px-4">
                    <span className="truncate text-lg font-medium leading-6 text-foreground">
                        클래스 순서 변경 중
                    </span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <section className="flex flex-col gap-3 py-2">
                    {order.map((program, index) => (
                        <ClassOrderCardItem
                            key={program.id}
                            programName={program.title}
                            price={formatPrice(program.price)}
                            disableUp={index === 0}
                            disableDown={index === order.length - 1}
                            onMoveUp={() => setOrder((prev) => swap(prev, index, index - 1))}
                            onMoveDown={() => setOrder((prev) => swap(prev, index, index + 1))}
                        />
                    ))}
                </section>
            </main>

            <BottomBar>
                <div className="flex w-full gap-2">
                    <Button variant="outline" size="lg" className="flex-1" onClick={handleCancel}>
                        취소
                    </Button>
                    <Button
                        variant="filled"
                        size="lg"
                        className="flex-1"
                        disabled={!dirty || reorder.isPending}
                        onClick={handleSave}
                    >
                        저장
                    </Button>
                </div>
            </BottomBar>
        </div>
    );
}
