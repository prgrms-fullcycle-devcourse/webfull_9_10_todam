'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import {
    PHONE_REGEX,
    ReservationDeliveryMethod,
    formatPhone,
    formatPrice,
    toKSTOffsetISO,
} from '@todam/shared';
import type { AvailableSlotItem } from '@todam/shared';
import {
    BottomBar,
    Button,
    DeliveryIcon,
    DescriptionBlock,
    PinIcon,
    SectionTitle,
    TextInput,
} from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/features/auth/login';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';
import { ProgressBarWrapper } from '@/shared/ui/ProgressBarWrapper';

import { useAvailableSlots, useCreateUserReservation } from '../queries';
import { SlotCalendarView } from './SlotCalendarView';

// localStorage 키 — 예약자 정보 기억하기
const LS_KEY = 'todam_reserver_info';
// sessionStorage 키 — 완료 화면(ReserveConfirmClient)으로 전달할 스냅샷
const RESULT_SS_KEY = 'todam_reservation_result';

interface SavedReserverInfo {
    name: string;
    phone: string;
}

function loadSavedReserverInfo(): SavedReserverInfo | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SavedReserverInfo;
    } catch {
        return null;
    }
}

function saveReserverInfo(info: SavedReserverInfo) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(info));
}

// ─── 에러 코드 → 사용자 메시지 ───────────────────────────────────────────────

function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.code) {
            case 'INSUFFICIENT_CAPACITY':
                return '잔여 정원이 부족합니다. 인원을 줄이거나 다른 슬롯을 선택해 주세요.';
            case 'SLOT_BLOCKED':
                return '선택하신 슬롯은 예약이 불가합니다. 다른 시간을 선택해 주세요.';
            case 'SELF_RESERVATION_NOT_ALLOWED':
                return '본인 공방 클래스는 예약할 수 없습니다.';
            case 'UNAUTHORIZED':
                return '로그인이 필요합니다.';
            case 'PROGRAM_NOT_FOUND':
                return '클래스를 찾을 수 없습니다.';
            default:
                return error.message || '예약 중 오류가 발생했습니다.';
        }
    }
    return '예약 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

// 체험 일시 요약 — KST 고정. "M월 d일 오전/오후 h시[ m분]".
function formatSlotSummary(startAt: string): string {
    const iso = toKSTOffsetISO(startAt); // 2026-04-18T15:00:00+09:00
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));
    const hour24 = Number(iso.slice(11, 13));
    const min = Number(iso.slice(14, 16));
    const ampm = hour24 < 12 ? '오전' : '오후';
    const h12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${month}월 ${day}일 ${ampm} ${h12}시${min > 0 ? ` ${min}분` : ''}`;
}

// ─── ReserveClient Props ──────────────────────────────────────────────────────

export interface ReserveClientProps {
    programId: string;
    programTitle: string;
    price: number;
    deliverable: boolean;
    initialParticipantCount: number;
}

type Step = 'date' | 'info';

// ─── ReserveClient ────────────────────────────────────────────────────────────

export function ReserveClient({
    programId,
    programTitle,
    price,
    deliverable,
    initialParticipantCount,
}: ReserveClientProps) {
    const router = useRouter();
    const authState = useAuthStore((s) => s.state);
    const { push } = useToast();

    // 마법사 단계
    const [step, setStep] = useState<Step>('date');

    // 인원은 클래스 상세 CTA에서 확정 — 이 화면에선 고정.
    const participantCount = initialParticipantCount;

    // 현재 연/월
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);

    // 선택된 슬롯
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlotItem | null>(null);

    // 예약자 정보
    const [reserverName, setReserverName] = useState('');
    const [reserverPhone, setReserverPhone] = useState('');

    // 예약자 정보 기억/불러오기 — 체크박스 UI는 spec out(주석). mount 자동 프리필 + 제출 저장만 유지.
    const [rememberInfo, setRememberInfo] = useState(false);

    // 수령 방법. 기본 PICKUP. deliverable=false 이면 PICKUP 고정(선택 비노출).
    const [deliveryMethod, setDeliveryMethod] = useState<ReservationDeliveryMethod>(
        ReservationDeliveryMethod.PICKUP,
    );

    // 저장된 예약자 정보 있으면 → 기본 체크 + 자동 입력("내 정보 불러오기").
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const saved = loadSavedReserverInfo();
            if (!saved) return;
            setReserverName(saved.name);
            setReserverPhone(saved.phone);
            setRememberInfo(true);
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    // 비인증 접근 시 로그인 유도
    useEffect(() => {
        if (authState === 'UNAUTHENTICATED') {
            router.replace('/login');
        }
    }, [authState, router]);

    // 헤더: "{클래스명} 예약하기" + 뒤로가기(2단계면 1단계로, 1단계면 이전 화면).
    useHeaderOverride({
        type: 'sub',
        title: `${programTitle} 예약하기`.trim(),
        hideRightAction: true,
        onBack: () => {
            if (step === 'info') setStep('date');
            else router.back();
        },
    });

    // [spec out] 예약자 정보 기억/불러오기 체크박스 토글. UI 복구 시 함께 살린다.
    // - 저장 정보 있음("내 정보 불러오기"): 체크 시 저장값 자동입력, 해제 시 입력 초기화.
    // - 저장 정보 없음("입력한 정보 기억하기"): 체크 상태만 기억 → 제출 시 저장.
    // const handleToggleRemember = (checked: boolean) => {
    //     setRememberInfo(checked);
    //     if (savedInfo) {
    //         if (checked) {
    //             setReserverName(savedInfo.name);
    //             setReserverPhone(savedInfo.phone);
    //         } else {
    //             setReserverName('');
    //             setReserverPhone('');
    //         }
    //     }
    // };

    // 슬롯 조회
    const {
        data: slotsData,
        isLoading: slotsLoading,
        error: slotsError,
    } = useAvailableSlots(programId, year, month);

    // 예약 생성 뮤테이션
    const { mutate: createReservation, isPending } = useCreateUserReservation();

    // 폼 유효성
    const nameValid = reserverName.trim().length >= 2 && reserverName.trim().length <= 20;
    const phoneValid = PHONE_REGEX.test(reserverPhone);
    const overCapacity = Boolean(selectedSlot && participantCount > selectedSlot.remainingCount);
    const canSubmit =
        Boolean(selectedSlot) && nameValid && phoneValid && !overCapacity && !isPending;

    const totalPrice = price * participantCount;

    const handlePhoneChange = (value: string) => {
        setReserverPhone(formatPhone(value));
    };

    const handleSubmit = () => {
        if (!selectedSlot || !canSubmit) return;

        if (rememberInfo) {
            saveReserverInfo({ name: reserverName.trim(), phone: reserverPhone });
        }

        createReservation(
            {
                programId,
                startAt: selectedSlot.startAt,
                reserverName: reserverName.trim(),
                reserverPhone,
                participantCount,
                deliveryMethod,
            },
            {
                onSuccess: (result) => {
                    // 완료 화면으로 전달. 응답에 없는 표시용 메타(클래스명/일시/금액/수령방법)를 함께 저장.
                    sessionStorage.setItem(
                        RESULT_SS_KEY,
                        JSON.stringify({
                            reservation: result.reservation,
                            meta: {
                                programTitle,
                                startAt: selectedSlot.startAt,
                                endAt: selectedSlot.endAt,
                                participantCount,
                                totalPrice,
                                deliveryMethod,
                            },
                        }),
                    );
                    router.push(`/classes/${programId}/reserve/confirm`);
                },
                onError: (error) => {
                    if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
                        router.replace('/login');
                        return;
                    }
                    push({ message: getErrorMessage(error) });
                },
            },
        );
    };

    if (authState === 'UNAUTHENTICATED') {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
                <p className="text-sm text-foreground-secondary">
                    예약을 위해 로그인이 필요합니다.
                </p>
                <Button onClick={() => router.replace('/login')}>로그인하기</Button>
            </div>
        );
    }

    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-16">
                <div className="py-2">
                    <ProgressBarWrapper
                        value={step === 'date' ? 50 : 100}
                        leftLabel={`${step === 'date' ? 1 : 2}/2 단계`}
                    />
                </div>

                {step === 'date' ? (
                    <div className="flex flex-col gap-2 py-2">
                        <SectionTitle size="md" title="체험을 진행할 날짜를 골라주세요" />
                        {slotsLoading && (
                            <p className="py-4 text-center text-sm text-foreground-tertiary">
                                슬롯을 불러오는 중...
                            </p>
                        )}
                        {slotsError && (
                            <p className="py-4 text-center text-sm text-danger">
                                슬롯을 불러오지 못했습니다. 다시 시도해 주세요.
                            </p>
                        )}
                        {!slotsLoading && !slotsError && (
                            <SlotCalendarView
                                year={year}
                                month={month}
                                slots={slotsData?.slots ?? []}
                                selectedSlotKey={selectedSlot?.slotKey ?? null}
                                onMonthChange={(y, m) => {
                                    setYear(y);
                                    setMonth(m);
                                    setSelectedSlot(null);
                                }}
                                onSlotSelect={(slot) => setSelectedSlot(slot)}
                            />
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* 예약자 정보 */}
                        <section className="flex flex-col gap-3 py-2">
                            <SectionTitle size="md" title="예약자 정보를 확인해 주세요" />

                            <TextInput
                                label="예약자 이름"
                                id="reserverName"
                                value={reserverName}
                                onChange={(e) => setReserverName(e.target.value)}
                                placeholder="예) 김토담 (2~20자)"
                                maxLength={20}
                                error={Boolean(reserverName) && !nameValid}
                                helperText={
                                    reserverName && !nameValid
                                        ? '이름은 2~20자로 입력해 주세요.'
                                        : undefined
                                }
                            />

                            <TextInput
                                label="연락처"
                                id="reserverPhone"
                                type="tel"
                                inputMode="numeric"
                                value={reserverPhone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="010-0000-0000"
                                error={Boolean(reserverPhone) && !phoneValid}
                                helperText={
                                    reserverPhone && !phoneValid
                                        ? '휴대폰 번호 11자리를 정확히 입력해 주세요.'
                                        : undefined
                                }
                            />

                            {/* <label className="flex items-center gap-1 self-start text-sm text-foreground-secondary font-semibold py-2">
                                <Checkbox
                                    checked={rememberInfo}
                                    onCheckedChange={handleToggleRemember}
                                />
                                {savedInfo ? '내 정보 불러오기' : '입력한 정보 기억하기'}
                            </label> */}
                        </section>

                        {/* 수령 방법 — 택배 미지원(deliverable=false)이면 PICKUP 고정이라 섹션 숨김 */}
                        {deliverable && (
                            <section className="flex flex-col gap-2 py-2">
                                <SectionTitle
                                    size="md"
                                    title="완성된 작품은 어떻게 전달해 드릴까요?"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <DeliveryCard
                                        icon={<DeliveryIcon size={16} />}
                                        title="택배로 받기"
                                        description="안전하게 집 앞으로 보내드려요"
                                        selected={
                                            deliveryMethod === ReservationDeliveryMethod.DELIVERY
                                        }
                                        onClick={() =>
                                            setDeliveryMethod(ReservationDeliveryMethod.DELIVERY)
                                        }
                                    />
                                    <DeliveryCard
                                        icon={<PinIcon size={16} />}
                                        title="직접 가져가기"
                                        description="완성된 작품을 공방에서 직접 만나요"
                                        selected={
                                            deliveryMethod === ReservationDeliveryMethod.PICKUP
                                        }
                                        onClick={() =>
                                            setDeliveryMethod(ReservationDeliveryMethod.PICKUP)
                                        }
                                    />
                                </div>
                                <div className="mt-2">
                                    <DescriptionBlock title="작품 수령 안내">
                                        택배를 선택하시면 별도의 배송비가 추가될 수 있어요. 직접
                                        방문을 선택하시면 작품이 완성되는 날 바로 알려드릴게요.
                                    </DescriptionBlock>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* 하단 CTA */}
            <BottomBar>
                {step === 'date' ? (
                    <Button
                        className="w-full"
                        disabled={!selectedSlot}
                        onClick={() => setStep('info')}
                    >
                        {selectedSlot ? '다음' : '체험 시간을 선택해 주세요'}
                    </Button>
                ) : (
                    <div className="flex w-full flex-col gap-3">
                        {selectedSlot && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-foreground-tertiary">체험일시</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {formatSlotSummary(selectedSlot.startAt)}・{participantCount}명
                                </span>
                            </div>
                        )}
                        {overCapacity && selectedSlot && (
                            <p className="text-center text-sm text-danger">
                                잔여 정원({selectedSlot.remainingCount}명)을 초과했어요.
                            </p>
                        )}
                        <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                            {isPending ? '예약 중...' : `${formatPrice(totalPrice)} 예약하기`}
                        </Button>
                    </div>
                )}
            </BottomBar>
        </>
    );
}

// 수령 방법 카드 — 아이콘 + 제목 + 설명. 선택 시 primary 보더 강조.
function DeliveryCard({
    icon,
    title,
    description,
    selected,
    onClick,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={[
                // 보더 굵기는 2로 고정하고 색만 바꿔야 선택 시 내부 요소가 안 밀린다.
                'flex flex-col gap-2 rounded-2xl border-2 bg-surface p-4 text-left transition-colors cursor-pointer',
                selected ? 'border-primary' : 'border-border-subtle hover:border-primary',
            ].join(' ')}
        >
            <span className={selected ? 'text-primary' : 'text-foreground-tertiary'}>{icon}</span>
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-xs leading-4 text-foreground-tertiary">{description}</span>
        </button>
    );
}
