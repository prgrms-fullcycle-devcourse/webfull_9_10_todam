'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
    DeliveryCarrier,
    DELIVERY_CARRIER_LABEL,
    ReservationDeliveryMethod,
    updateArtworkDeliveryInfoRequestSchema,
    type DeliveryCarrierValue,
    type GetPartnerArtworkDetailResult,
    type UpdateArtworkDeliveryInfoRequest,
} from '@todam/shared';
import { BottomBar, Button, DownIcon, RadioInput, SectionTitle, TextInput } from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useSheet, useToast } from '@/shared/model';
import { AddressSearchInput } from '@/shared/ui';

import { usePartnerArtworkDetail, useUpdateArtworkDeliveryInfo } from '../queries';
import { CarrierSelectSheet } from './CarrierSelectSheet';

export type PartnerDeliveryInfoClientProps = {
    artworkId: string;
};

type Artwork = GetPartnerArtworkDetailResult['artwork'];

// 폼 상태 (모든 필드 string 으로 유지, 저장 시 정규화).
type FormValues = {
    deliveryMethod: ReservationDeliveryMethod;
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
    carrier: DeliveryCarrierValue | null;
    trackingNumber: string;
};

type FieldErrors = Partial<Record<keyof UpdateArtworkDeliveryInfoRequest, string>>;

// delivery.carrier(string|null) 가 contract enum 값인지 검증.
function toCarrierValue(value: string | null): DeliveryCarrierValue | null {
    if (value && (Object.values(DeliveryCarrier) as string[]).includes(value)) {
        return value as DeliveryCarrierValue;
    }
    return null;
}

// 상세 응답 → 초기 폼 값. 저장된 배송지 우선 + 없으면 예약자 정보 자동 입력.
function buildInitialValues(artwork: Artwork): FormValues {
    const d = artwork.delivery;
    return {
        deliveryMethod: artwork.deliveryMethod as ReservationDeliveryMethod,
        recipientName: d?.recipientName ?? artwork.reservation.reserverName ?? '',
        recipientPhone: d?.recipientPhone ?? artwork.reservation.reserverPhone ?? '',
        postalCode: d?.postalCode ?? '',
        address: d?.address ?? '',
        addressDetail: d?.addressDetail ?? '',
        carrier: toCarrierValue(d?.carrier ?? null),
        trackingNumber: d?.trackingNumber ?? '',
    };
}

// dirty 비교용 정규화 시그니처.
function signature(v: FormValues): string {
    return JSON.stringify({
        deliveryMethod: v.deliveryMethod,
        recipientName: v.recipientName.trim(),
        recipientPhone: v.recipientPhone.trim(),
        postalCode: v.postalCode.trim(),
        address: v.address.trim(),
        addressDetail: v.addressDetail.trim(),
        carrier: v.carrier ?? '',
        trackingNumber: v.trackingNumber.trim(),
    });
}

// 폼 값 → API 페이로드. PICKUP 은 deliveryMethod 만, DELIVERY 는 입력값 포함(빈값 제거).
function buildPayload(v: FormValues): UpdateArtworkDeliveryInfoRequest {
    if (v.deliveryMethod === ReservationDeliveryMethod.PICKUP) {
        return { deliveryMethod: ReservationDeliveryMethod.PICKUP };
    }
    return {
        deliveryMethod: ReservationDeliveryMethod.DELIVERY,
        recipientName: v.recipientName.trim(),
        recipientPhone: v.recipientPhone.trim(),
        postalCode: v.postalCode.trim(),
        address: v.address.trim(),
        ...(v.addressDetail.trim() ? { addressDetail: v.addressDetail.trim() } : {}),
        ...(v.carrier ? { carrier: v.carrier } : {}),
        ...(v.trackingNumber.trim() ? { trackingNumber: v.trackingNumber.trim() } : {}),
    };
}

export function PartnerDeliveryInfoClient({ artworkId }: PartnerDeliveryInfoClientProps) {
    // 전역 헤더: 뒤로가기 + 타이틀(우측 noti 숨김). Figma sub 헤더.
    useHeaderOverride({ type: 'sub', title: '작품 수령 방식 선택', hideRightAction: true });

    const { data, error, isLoading, isError } = usePartnerArtworkDetail(artworkId);
    const artwork = data?.artwork;

    if (isLoading) {
        return (
            <div className="px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    작품 정보를 불러오는 중입니다.
                </p>
            </div>
        );
    }

    if (isError && error instanceof ApiError) {
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '작품을 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '이 작품에 접근할 권한이 없습니다.'
                  : '작품 정보를 불러오지 못했습니다.';
        return (
            <div className="px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
            </div>
        );
    }

    if (!artwork) {
        return (
            <div className="px-4 pb-16">
                <p className="py-10 text-center text-sm text-foreground-tertiary">
                    작품 정보를 불러오지 못했습니다.
                </p>
            </div>
        );
    }

    return <PartnerDeliveryInfoForm artworkId={artworkId} artwork={artwork} />;
}

// 폼 본체. 데이터 확보 후 mount → 초기값을 useState 초기값으로 주입(effect setState 회피).
function PartnerDeliveryInfoForm({ artworkId, artwork }: { artworkId: string; artwork: Artwork }) {
    const router = useRouter();
    const { push } = useToast();
    const { open, close } = useSheet();
    const updateMutation = useUpdateArtworkDeliveryInfo(artworkId);

    const initial = useMemo(() => buildInitialValues(artwork), [artwork]);
    const [values, setValues] = useState<FormValues>(initial);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitted, setSubmitted] = useState(false);

    const isDelivery = values.deliveryMethod === ReservationDeliveryMethod.DELIVERY;
    const hasAddress = Boolean(values.address);

    // 유효성: contract schema 로 검증.
    const formIssues = useMemo<FieldErrors | null>(() => {
        const parsed = updateArtworkDeliveryInfoRequestSchema.safeParse(buildPayload(values));
        if (parsed.success) return null;
        const out: FieldErrors = {};
        for (const issue of parsed.error.issues) {
            const k = issue.path[0] as keyof UpdateArtworkDeliveryInfoRequest | undefined;
            if (k && !out[k]) out[k] = ERROR_MESSAGE[k] ?? issue.message;
        }
        return out;
    }, [values]);

    const isValid = formIssues === null;
    const isDirty = signature(values) !== signature(initial);

    const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (submitted) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSelectMethod = (method: ReservationDeliveryMethod) => {
        setValues((prev) => ({ ...prev, deliveryMethod: method }));
        if (submitted) setErrors({});
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

    const handleOpenCarrierSheet = () => {
        open(
            <CarrierSelectSheet
                selected={values.carrier}
                onSelect={(carrier) => setField('carrier', carrier)}
                onClose={close}
            />,
        );
    };

    const handleSave = () => {
        setSubmitted(true);
        if (formIssues) {
            setErrors(formIssues);
            return;
        }
        setErrors({});

        updateMutation.mutate(buildPayload(values), {
            onSuccess: () => {
                push({ message: '작품 수령 정보가 저장되었어요.' });
                router.push(`/partner/artworks/${artworkId}`);
            },
            onError: (mutationError) => {
                if (!(mutationError instanceof ApiError)) {
                    push({ message: '잠시 후 다시 시도해 주세요.' });
                    return;
                }
                switch (mutationError.statusCode) {
                    case 401:
                        return;
                    case 403:
                        push({ message: '본인 공방의 작품만 수정할 수 있어요.' });
                        return;
                    case 404:
                        push({ message: '작품을 찾을 수 없어요.' });
                        return;
                    case 409:
                        push({
                            message:
                                mutationError.message ||
                                '이미 발송된 작품의 수령 정보는 수정할 수 없어요.',
                        });
                        return;
                    case 400:
                        push({
                            message: mutationError.message || '입력 정보를 다시 확인해 주세요.',
                        });
                        return;
                    default:
                        push({ message: '잠시 후 다시 시도해 주세요.' });
                }
            },
        });
    };

    const disabled = updateMutation.isPending;

    return (
        // 스크롤은 AppShell 단일 main 이 소유. BottomBar 는 sticky bottom-0 으로 하단 고정(#396).
        <>
            <div className="flex flex-col px-4 pb-4">
                {/* 작품 수령 정보 */}
                <section className="flex flex-col gap-4 py-2">
                    <SectionTitle size="md" title="작품 수령 정보" />

                    {/* 수령 방식 */}
                    <div className="flex w-full flex-col gap-2">
                        <span className="px-1 text-sm font-semibold text-foreground-tertiary">
                            작품 수령 방식
                        </span>
                        <div className="flex w-full gap-2.5">
                            <RadioInput
                                title="택배"
                                selected={isDelivery}
                                disabled={disabled}
                                onSelect={() =>
                                    handleSelectMethod(ReservationDeliveryMethod.DELIVERY)
                                }
                            />
                            <RadioInput
                                title="직접 수령"
                                selected={!isDelivery}
                                disabled={disabled}
                                onSelect={() =>
                                    handleSelectMethod(ReservationDeliveryMethod.PICKUP)
                                }
                            />
                        </div>
                    </div>

                    {isDelivery && (
                        <>
                            <TextInput
                                id="delivery-recipient-name"
                                label="이름"
                                value={values.recipientName}
                                onChange={(e) => setField('recipientName', e.target.value)}
                                placeholder="이름을 입력해 주세요"
                                helperText={errors.recipientName}
                                error={Boolean(errors.recipientName)}
                                disabled={disabled}
                            />
                            <TextInput
                                id="delivery-recipient-phone"
                                label="연락처"
                                inputMode="numeric"
                                value={values.recipientPhone}
                                onChange={(e) => setField('recipientPhone', e.target.value)}
                                placeholder="010-0000-0000"
                                helperText={errors.recipientPhone}
                                error={Boolean(errors.recipientPhone)}
                                disabled={disabled}
                            />

                            {/* 주소 + (조건부)상세주소 */}
                            <div className="flex w-full flex-col gap-1">
                                <AddressSearchInput
                                    label="주소"
                                    value={values.address}
                                    helperText={errors.address ?? errors.postalCode}
                                    error={Boolean(errors.address ?? errors.postalCode)}
                                    disabled={disabled}
                                    onResolved={handleAddressResolved}
                                />
                                {hasAddress && (
                                    <TextInput
                                        id="delivery-address-detail"
                                        value={values.addressDetail}
                                        onChange={(e) => setField('addressDetail', e.target.value)}
                                        placeholder="상세 주소를 입력해 주세요"
                                        helperText={errors.addressDetail}
                                        error={Boolean(errors.addressDetail)}
                                        disabled={disabled}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* 배송 정보 (택배 선택 시) */}
                {isDelivery && (
                    <section className="flex flex-col gap-4 py-2">
                        <SectionTitle size="md" title="배송 정보" />

                        {/* 택배사 */}
                        <div className="flex w-full flex-col gap-2">
                            <label className="px-1 text-sm font-semibold text-foreground-tertiary">
                                택배사
                            </label>
                            <button
                                type="button"
                                onClick={handleOpenCarrierSheet}
                                disabled={disabled}
                                className={[
                                    'flex h-12 w-full items-center justify-between rounded-xl border border-border-subtle bg-surface px-4 text-left text-base transition-colors duration-200 ease-in-out focus:border-primary focus:outline-none',
                                    values.carrier ? 'text-foreground' : 'text-foreground-tertiary',
                                ].join(' ')}
                            >
                                {values.carrier
                                    ? DELIVERY_CARRIER_LABEL[values.carrier]
                                    : '택배사를 선택해 주세요'}
                                <DownIcon size={16} className="shrink-0 text-foreground" />
                            </button>
                        </div>

                        {/* 운송장 번호 (선택) */}
                        <TextInput
                            id="delivery-tracking-number"
                            label="운송장 번호"
                            optional
                            inputMode="numeric"
                            maxLength={100}
                            value={values.trackingNumber}
                            onChange={(e) =>
                                setField('trackingNumber', e.target.value.replace(/\D/g, ''))
                            }
                            placeholder="숫자만 입력해 주세요"
                            helperText={errors.trackingNumber}
                            error={Boolean(errors.trackingNumber)}
                            disabled={disabled}
                        />
                    </section>
                )}
            </div>

            <BottomBar>
                <Button
                    type="button"
                    variant="filled"
                    size="lg"
                    className="w-full"
                    disabled={!isDirty || !isValid || disabled}
                    onClick={handleSave}
                >
                    {disabled ? '저장 중…' : '저장'}
                </Button>
            </BottomBar>
        </>
    );
}

// 필드별 한글 에러 메시지.
const ERROR_MESSAGE: Partial<Record<keyof UpdateArtworkDeliveryInfoRequest, string>> = {
    recipientName: '이름을 입력해 주세요.',
    recipientPhone: '연락처를 입력해 주세요.',
    postalCode: '주소를 검색해 주세요.',
    address: '주소를 검색해 주세요.',
    trackingNumber: '운송장 번호는 숫자 5~100자리로 입력해 주세요.',
};
