'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
    deliveryEditRequestSchema,
    ReservationDeliveryMethod,
    ReservationStatus,
    type DeliveryEditRequest,
    type ReservationDetail,
} from '@todam/shared';

import { useReservationDetail } from '../../detail';
import { useUpdateReservationDelivery } from '../queries';
import { ApiError } from '../../../../shared/api';
import { useToast } from '../../../../shared/model';

import { DeliveryForm, type DeliveryFormErrors } from './DeliveryForm';
import { SaveButtonSection } from './SaveButtonSection';

// 배송 정보 수정 페이지의 클라이언트 본체 — 데이터 페치·가드·라우팅만 담당.
// 폼 본체는 reservation 도착 후 DeliveryEditForm 으로 mount 위임 (effect 내 setState 회피).
const LOCKED_STATUSES = new Set<ReservationStatus>([
    ReservationStatus.SHIPPED,
    ReservationStatus.DELIVERED,
]);

export type DeliveryEditClientProps = {
    reservationId: string;
};

export function DeliveryEditClient({ reservationId }: DeliveryEditClientProps) {
    const router = useRouter();
    const { data, error, isLoading, isError } = useReservationDetail(reservationId);
    const reservation = data?.reservation;

    // 401 → /login 리다이렉트.
    useEffect(() => {
        if (isError && error instanceof ApiError && error.statusCode === 401) {
            router.replace('/login');
        }
    }, [isError, error, router]);

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오는 중입니다.
                </p>
            </main>
        );
    }

    if (isError && error instanceof ApiError) {
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '예약을 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '해당 예약에 대한 접근 권한이 없습니다.'
                  : '예약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
            </main>
        );
    }

    if (!reservation) {
        return (
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    예약 정보를 불러오지 못했습니다.
                </p>
            </main>
        );
    }

    // 가드 화면 — 본 라우트 진입은 가능하지만 contract상 수정 불가한 케이스.
    if (reservation.deliveryMethod === ReservationDeliveryMethod.PICKUP) {
        return (
            <main className="flex flex-1 flex-col items-center justify-start gap-4 overflow-y-auto px-4 pb-16 pt-10">
                <p className="text-center text-sm text-foreground-tertiary">
                    픽업 예약은 배송 정보가 필요하지 않아요.
                </p>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm font-semibold text-foreground-tertiary underline"
                >
                    예약 상세로 돌아가기
                </button>
            </main>
        );
    }

    if (LOCKED_STATUSES.has(reservation.status)) {
        return (
            <main className="flex flex-1 flex-col items-center justify-start gap-4 overflow-y-auto px-4 pb-16 pt-10">
                <p className="text-center text-sm text-foreground-tertiary">
                    이미 발송된 작품의 배송 정보는 수정할 수 없어요.
                </p>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-sm font-semibold text-foreground-tertiary underline"
                >
                    예약 상세로 돌아가기
                </button>
            </main>
        );
    }

    return <DeliveryEditForm reservationId={reservationId} reservation={reservation} />;
}

// 폼 본체. reservation 이 확보된 후에만 마운트 → initial 값을 useState 초기값으로 sync 주입.
// (effect 내 setState 회피 — react-hooks/set-state-in-effect 룰 정합)
type DeliveryEditFormProps = {
    reservationId: string;
    reservation: ReservationDetail;
};

function buildInitialFormState(reservation: ReservationDetail): DeliveryEditRequest {
    return {
        // 저장된 배송지 우선 + 없으면 예약자 정보 자동 입력 (Figma Description #2/#3).
        recipientName: reservation.delivery?.recipientName ?? reservation.reserverName ?? '',
        recipientPhone: reservation.delivery?.recipientPhone ?? reservation.reserverPhone ?? '',
        // postalCode/addressDetail 은 reservation-detail contract 의 delivery 5필드(D6)에 미포함.
        // BE 측이 응답에 노출하기 전까지는 prefill 불가 — 사용자가 저장 시 다시 채워야 함.
        postalCode: '',
        address: reservation.delivery?.address ?? '',
        addressDetail: '',
    };
}

function DeliveryEditForm({ reservationId, reservation }: DeliveryEditFormProps) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const updateMutation = useUpdateReservationDelivery(reservationId);

    const [values, setValues] = useState<DeliveryEditRequest>(() =>
        buildInitialFormState(reservation),
    );
    const [errors, setErrors] = useState<DeliveryFormErrors>({});
    const [submitted, setSubmitted] = useState(false);

    // 폼 유효성. submitted 이전엔 button disabled 판별에만 사용(에러 미표시).
    const formIssues = useMemo(() => {
        const parsed = deliveryEditRequestSchema.safeParse({
            ...values,
            // optional 필드: 빈 문자열은 undefined 로 정규화.
            addressDetail: values.addressDetail?.trim() ? values.addressDetail : undefined,
        });
        if (parsed.success) return null;
        const out: DeliveryFormErrors = {};
        for (const issue of parsed.error.issues) {
            const k = issue.path[0] as keyof DeliveryEditRequest | undefined;
            if (k && !out[k]) out[k] = issue.message;
        }
        return out;
    }, [values]);

    const isFormValid = formIssues === null;

    const handleChange = <K extends keyof DeliveryEditRequest>(
        field: K,
        value: DeliveryEditRequest[K],
    ) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (submitted) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleAddressResolved = ({
        postalCode,
        address,
    }: {
        postalCode: string;
        address: string;
    }) => {
        setValues((prev) => ({ ...prev, postalCode, address }));
        if (submitted) {
            setErrors((prev) => ({ ...prev, postalCode: undefined, address: undefined }));
        }
    };

    const handleSave = () => {
        setSubmitted(true);
        if (formIssues) {
            setErrors(formIssues);
            return;
        }
        setErrors({});

        const payload: DeliveryEditRequest = {
            recipientName: values.recipientName,
            recipientPhone: values.recipientPhone,
            postalCode: values.postalCode,
            address: values.address,
            ...(values.addressDetail?.trim() ? { addressDetail: values.addressDetail } : {}),
        };

        updateMutation.mutate(payload, {
            onSuccess: () => {
                pushToast({ message: '배송 정보가 저장되었어요.' });
                router.push(`/my/reservations/${reservationId}`);
            },
            onError: (mutationError) => {
                if (!(mutationError instanceof ApiError)) {
                    pushToast({ message: '잠시 후 다시 시도해 주세요.' });
                    return;
                }
                switch (mutationError.statusCode) {
                    case 401:
                        router.replace('/login');
                        return;
                    case 403:
                        pushToast({ message: '본인 예약의 배송 정보만 수정할 수 있어요.' });
                        return;
                    case 404:
                        pushToast({ message: '예약을 찾을 수 없어요.' });
                        return;
                    case 409:
                        pushToast({
                            message:
                                mutationError.message ||
                                '이미 발송된 작품의 배송 정보는 수정할 수 없어요.',
                        });
                        return;
                    case 400:
                        pushToast({
                            message:
                                mutationError.message ||
                                '필수 배송 정보(수령인·연락처·주소)를 입력해 주세요.',
                        });
                        return;
                    default:
                        pushToast({ message: '잠시 후 다시 시도해 주세요.' });
                }
            },
        });
    };

    return (
        <main className="flex flex-1 flex-col overflow-y-auto px-4 pb-0">
            <div className="flex flex-col gap-2 py-2">
                <DeliveryForm
                    values={values}
                    errors={errors}
                    onChange={handleChange}
                    onAddressResolved={handleAddressResolved}
                    disabled={updateMutation.isPending}
                />
            </div>
            <SaveButtonSection
                disabled={!isFormValid}
                loading={updateMutation.isPending}
                onClick={handleSave}
            />
        </main>
    );
}
