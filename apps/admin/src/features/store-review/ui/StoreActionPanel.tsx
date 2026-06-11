import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StoreStatus } from '@todam/shared';
import { Button, Modal, TextArea } from '@todam/ui';
import { useState } from 'react';

import { ApiError } from '@/shared/api';
import { Overlay } from '@/shared/ui/Overlay';

import { approveAdminStore, rejectAdminStore, restoreAdminStore, suspendAdminStore } from '../api';

export type StoreActionPanelProps = {
    storeId: string;
    status: StoreStatus;
};

type DialogKind = 'approve' | 'reject' | 'suspend' | 'restore' | null;

function resolveErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.statusCode === 409) return '이미 처리된 공방입니다. 새로고침 후 확인해주세요.';
        return error.message || '처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
    }
    return '처리에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export function StoreActionPanel({ storeId, status }: StoreActionPanelProps) {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<DialogKind>(null);
    const [reason, setReason] = useState('');

    const closeDialog = () => {
        setDialog(null);
        setReason('');
    };

    const mutation = useMutation({
        mutationFn: async (kind: Exclude<DialogKind, null>) => {
            switch (kind) {
                case 'approve':
                    return approveAdminStore(storeId);
                case 'reject':
                    return rejectAdminStore(storeId, { rejectedReason: reason.trim() });
                case 'suspend':
                    return suspendAdminStore(storeId, { suspendedReason: reason.trim() });
                case 'restore':
                    return restoreAdminStore(storeId);
            }
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['admin', 'store', storeId] }),
                queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] }),
            ]);
            closeDialog();
        },
    });

    const submit = () => {
        if (!dialog) return;
        if ((dialog === 'reject' || dialog === 'suspend') && !reason.trim()) return;
        mutation.mutate(dialog);
    };

    const openDialog = (kind: Exclude<DialogKind, null>) => {
        mutation.reset();
        setReason('');
        setDialog(kind);
    };

    const actions = (() => {
        switch (status) {
            case StoreStatus.PENDING:
                return (
                    <>
                        <Button size="sm" onClick={() => openDialog('approve')}>
                            승인
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="!border-danger !text-danger hover:!bg-danger-subtle"
                            onClick={() => openDialog('reject')}
                        >
                            반려
                        </Button>
                    </>
                );
            case StoreStatus.PUBLISHED:
                return (
                    <Button
                        size="sm"
                        variant="outline"
                        className="!border-danger !text-danger hover:!bg-danger-subtle"
                        onClick={() => openDialog('suspend')}
                    >
                        노출 중단
                    </Button>
                );
            case StoreStatus.SUSPENDED:
                return (
                    <Button size="sm" onClick={() => openDialog('restore')}>
                        노출 복구
                    </Button>
                );
            default:
                return (
                    <span className="text-sm text-foreground-tertiary">
                        처리 가능한 작업이 없습니다.
                    </span>
                );
        }
    })();

    const isReasonDialog = dialog === 'reject' || dialog === 'suspend';

    return (
        <>
            <div className="flex items-center gap-2">{actions}</div>

            {/* 사유 불필요한 단순 확인(승인/복구) */}
            {dialog === 'approve' && (
                <Overlay onClose={mutation.isPending ? () => {} : closeDialog}>
                    <Modal
                        title="공방을 승인할까요?"
                        description={
                            <span className="flex flex-col gap-2">
                                <span>승인하면 공방이 즉시 노출되고 예약을 받을 수 있습니다.</span>
                                {mutation.isError && (
                                    <span className="text-sm text-danger">
                                        {resolveErrorMessage(mutation.error)}
                                    </span>
                                )}
                            </span>
                        }
                        confirmLabel={mutation.isPending ? '처리 중…' : '승인'}
                        cancelLabel="취소"
                        onConfirm={submit}
                        onCancel={closeDialog}
                    />
                </Overlay>
            )}
            {dialog === 'restore' && (
                <Overlay onClose={mutation.isPending ? () => {} : closeDialog}>
                    <Modal
                        title="노출을 복구할까요?"
                        description={
                            <span className="flex flex-col gap-2">
                                <span>복구하면 공방이 다시 노출됩니다.</span>
                                {mutation.isError && (
                                    <span className="text-sm text-danger">
                                        {resolveErrorMessage(mutation.error)}
                                    </span>
                                )}
                            </span>
                        }
                        confirmLabel={mutation.isPending ? '처리 중…' : '복구'}
                        cancelLabel="취소"
                        onConfirm={submit}
                        onCancel={closeDialog}
                    />
                </Overlay>
            )}

            {/* 사유 필수(반려/노출중단) */}
            {isReasonDialog && (
                <Overlay onClose={mutation.isPending ? () => {} : closeDialog}>
                    <div className="flex w-full flex-col gap-4 rounded-3xl bg-surface p-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]">
                        <div className="flex flex-col gap-2 py-1">
                            <p className="text-xl font-semibold leading-6 text-foreground">
                                {dialog === 'reject' ? '공방을 반려할까요?' : '노출을 중단할까요?'}
                            </p>
                            <p className="text-sm text-foreground-secondary">
                                {dialog === 'reject'
                                    ? '반려 사유는 파트너에게 전달됩니다.'
                                    : '중단 사유를 입력해주세요.'}
                            </p>
                        </div>
                        <TextArea
                            label="사유"
                            placeholder={
                                dialog === 'reject'
                                    ? '예) 사업자등록증 이미지가 불명확합니다.'
                                    : '예) 허위 정보 게재로 인한 노출 중단 조치입니다.'
                            }
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={200}
                            showCount
                        />
                        {mutation.isError && (
                            <p className="text-sm text-danger">
                                {resolveErrorMessage(mutation.error)}
                            </p>
                        )}
                        <div className="flex gap-3">
                            <Button
                                size="lg"
                                className="flex-1 !bg-muted !text-foreground"
                                onClick={closeDialog}
                                disabled={mutation.isPending}
                            >
                                취소
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1 !bg-danger hover:!bg-danger"
                                onClick={submit}
                                disabled={!reason.trim() || mutation.isPending}
                            >
                                {mutation.isPending
                                    ? '처리 중…'
                                    : dialog === 'reject'
                                      ? '반려'
                                      : '노출 중단'}
                            </Button>
                        </div>
                    </div>
                </Overlay>
            )}
        </>
    );
}
