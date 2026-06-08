'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { PHONE_REGEX, ReservationDeliveryMethod, formatPhone, formatPrice } from '@todam/shared';
import type { AvailableSlotItem } from '@todam/shared';
import { BottomBar, Button, Checkbox, DescriptionBlock, ProgressBar, TextInput } from '@todam/ui';

import { ApiError } from '@/shared/api';
import { useAuthStore } from '@/features/auth/login';
import { useSheet } from '@/shared/model';

import { useAvailableSlots, useCreateUserReservation } from '../queries';
import { ParticipantSheet } from './ParticipantSheet';
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

function formatSlotRange(slot: AvailableSlotItem): string {
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    return `${format(start, 'M월 d일')} ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
}

// ─── ReserveClient Props ──────────────────────────────────────────────────────

export interface ReserveClientProps {
    programId: string;
    programTitle: string;
    price: number;
    /** Program.deliverable — false면 PICKUP 고정 */
    deliverable: boolean;
}

type Step = 'date' | 'info';

// ─── ReserveClient ────────────────────────────────────────────────────────────
//
// 디자인(클래스 - 예약 생성)에 따른 다단계 마법사:
//   인원 바텀시트(ParticipantSheet, mount 시 1회) → 1/2 날짜·시간 → 2/2 예약자 정보 → 완료 화면.

export function ReserveClient({ programId, programTitle, price, deliverable }: ReserveClientProps) {
    const router = useRouter();
    const authState = useAuthStore((s) => s.state);
    const user = useAuthStore((s) => s.user);
    const { open, close } = useSheet();

    // 마법사 단계
    const [step, setStep] = useState<Step>('date');

    // 현재 연/월
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);

    // 선택된 슬롯
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlotItem | null>(null);

    // 참가 인원 (인원 시트에서 선행 결정)
    const [participantCount, setParticipantCount] = useState(1);

    // 예약자 정보
    const [reserverName, setReserverName] = useState('');
    const [reserverPhone, setReserverPhone] = useState('');
    const [requestMemo, setRequestMemo] = useState('');

    // "내 정보 불러오기" / "입력한 정보 기억하기"
    const [usedProfile, setUsedProfile] = useState(false);
    const [rememberInfo, setRememberInfo] = useState(false);

    // 수령 방법. 기본 PICKUP. deliverable=false 이면 PICKUP 고정(선택 비노출).
    const [deliveryMethod, setDeliveryMethod] = useState<ReservationDeliveryMethod>(
        ReservationDeliveryMethod.PICKUP,
    );

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

    // mount(인증 상태 확정) 시 인원 바텀시트 1회 노출
    const sheetOpenedRef = useRef(false);
    useEffect(() => {
        if (authState === 'UNAUTHENTICATED' || sheetOpenedRef.current) return;
        sheetOpenedRef.current = true;
        open(
            <ParticipantSheet
                initial={participantCount}
                onConfirm={(count) => {
                    setParticipantCount(count);
                    close();
                }}
            />,
        );
    }, [authState, close, open, participantCount]);

    const reopenParticipantSheet = () => {
        open(
            <ParticipantSheet
                initial={participantCount}
                onConfirm={(count) => {
                    setParticipantCount(count);
                    close();
                }}
            />,
        );
    };

    // "내 정보 불러오기" — 프로필 prefill.
    // 현재 프로필/인증 스토어 user에는 nickname만 있고 예약자 이름·전화 필드는 미포함이다
    // (packages/shared user-me.ts: "예약자 필드는 D2 확정 전까지 미포함").
    // → 이름은 nickname으로 best-effort prefill, 전화 prefill은 D2 확정 후 추가.
    const handleToggleProfile = (checked: boolean) => {
        setUsedProfile(checked);
        if (checked && user?.nickname) {
            setReserverName(user.nickname);
        }
    };

    // 슬롯 조회
    const {
        data: slotsData,
        isLoading: slotsLoading,
        error: slotsError,
    } = useAvailableSlots(programId, year, month);

    // 예약 생성 뮤테이션
    const { mutate: createReservation, isPending, error: submitError } = useCreateUserReservation();

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
                slotId: selectedSlot.slotId,
                reserverName: reserverName.trim(),
                reserverPhone,
                participantCount,
                deliveryMethod,
                ...(requestMemo.trim() ? { requestMemo: requestMemo.trim() } : {}),
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
                    }
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
        <div className="flex min-h-screen flex-col">
            {/* 진행 표시 */}
            <div className="flex flex-col gap-3 px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                    {step === 'info' ? (
                        <button
                            type="button"
                            onClick={() => setStep('date')}
                            className="text-sm text-foreground-secondary"
                        >
                            ← 이전
                        </button>
                    ) : (
                        <span />
                    )}
                    <span className="text-sm font-medium text-foreground-tertiary">
                        {step === 'date' ? '1' : '2'}/2
                    </span>
                </div>
                <ProgressBar value={step === 'date' ? 50 : 100} />
            </div>

            <div className="flex flex-1 flex-col gap-6 px-4 pb-40 pt-3">
                {step === 'date' ? (
                    <>
                        {/* 클래스명 + 인원 요약 */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-foreground-tertiary">클래스</p>
                                <p className="mt-0.5 text-base font-semibold text-foreground">
                                    {programTitle}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={reopenParticipantSheet}
                                className="text-sm text-primary underline underline-offset-2"
                            >
                                {participantCount}명
                            </button>
                        </div>

                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                예약 날짜와 시간을 선택해 주세요
                            </h2>
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
                                    selectedSlotId={selectedSlot?.slotId ?? null}
                                    onMonthChange={(y, m) => {
                                        setYear(y);
                                        setMonth(m);
                                        setSelectedSlot(null);
                                    }}
                                    onSlotSelect={(slot) => setSelectedSlot(slot)}
                                />
                            )}
                        </section>
                    </>
                ) : (
                    <>
                        {/* 체험 일시 요약 */}
                        {selectedSlot && (
                            <section className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground-tertiary">클래스</span>
                                    <span className="text-foreground">{programTitle}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground-tertiary">체험 일시</span>
                                    <span className="text-foreground">
                                        {formatSlotRange(selectedSlot)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-foreground-tertiary">인원</span>
                                    <span className="text-foreground">{participantCount}명</span>
                                </div>
                            </section>
                        )}
                        {overCapacity && selectedSlot && (
                            <p className="text-sm text-danger">
                                선택한 시간의 잔여 정원({selectedSlot.remainingCount}명)을
                                초과했습니다. 인원을 줄이거나 다른 시간을 선택해 주세요.
                            </p>
                        )}

                        {/* 예약자 정보 */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground">
                                    예약자 정보
                                </h2>
                                {user && (
                                    <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                                        <Checkbox
                                            checked={usedProfile}
                                            onCheckedChange={handleToggleProfile}
                                        />
                                        내 정보 불러오기
                                    </label>
                                )}
                            </div>

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
                                        ? '010-0000-0000 형식으로 입력해 주세요.'
                                        : undefined
                                }
                            />

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="requestMemo"
                                    className="text-sm font-semibold text-foreground-tertiary"
                                >
                                    요청사항 <span className="font-normal">(선택)</span>
                                </label>
                                <textarea
                                    id="requestMemo"
                                    value={requestMemo}
                                    onChange={(e) => setRequestMemo(e.target.value)}
                                    placeholder="작가님께 전달할 내용을 입력해 주세요."
                                    maxLength={500}
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-border-subtle bg-surface px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground-tertiary focus:border-primary"
                                />
                            </div>

                            <label className="flex items-center gap-2 self-start text-sm text-foreground-secondary">
                                <Checkbox
                                    checked={rememberInfo}
                                    onCheckedChange={setRememberInfo}
                                />
                                입력한 정보 기억하기
                            </label>
                        </section>

                        {/* 수령 방법 */}
                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                작품 수령 방법
                            </h2>
                            {deliverable ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeliveryMethod(ReservationDeliveryMethod.PICKUP)
                                        }
                                        className={[
                                            'flex-1 rounded-xl border px-4 py-3 text-sm transition-colors',
                                            deliveryMethod === ReservationDeliveryMethod.PICKUP
                                                ? 'border-primary bg-primary-subtle font-semibold text-primary'
                                                : 'border-border-subtle bg-surface text-foreground hover:border-primary',
                                        ].join(' ')}
                                    >
                                        직접 가져가기
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDeliveryMethod(ReservationDeliveryMethod.DELIVERY)
                                        }
                                        className={[
                                            'flex-1 rounded-xl border px-4 py-3 text-sm transition-colors',
                                            deliveryMethod === ReservationDeliveryMethod.DELIVERY
                                                ? 'border-primary bg-primary-subtle font-semibold text-primary'
                                                : 'border-border-subtle bg-surface text-foreground hover:border-primary',
                                        ].join(' ')}
                                    >
                                        택배로 받기
                                    </button>
                                </div>
                            ) : (
                                <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground-secondary">
                                    직접 가져가기 (이 클래스는 택배 배송을 지원하지 않습니다)
                                </p>
                            )}
                            <DescriptionBlock type="info" title="작품 수령 안내">
                                체험 후 작품은 건조·소성 과정을 거쳐 약 2~3주 뒤 수령하실 수 있어요.
                                {deliverable ? ' 택배 수령 시 배송비가 추가될 수 있습니다.' : ''}
                            </DescriptionBlock>
                        </section>
                    </>
                )}
            </div>

            {/* 고정 하단 CTA */}
            <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2">
                <BottomBar>
                    {step === 'date' ? (
                        <Button
                            className="w-full"
                            disabled={!selectedSlot}
                            onClick={() => setStep('info')}
                        >
                            다음
                        </Button>
                    ) : (
                        <div className="flex w-full flex-col gap-2">
                            {submitError && (
                                <p className="text-center text-sm text-danger">
                                    {getErrorMessage(submitError)}
                                </p>
                            )}
                            <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                                {isPending ? '예약 중...' : `${formatPrice(totalPrice)} 예약하기`}
                            </Button>
                        </div>
                    )}
                </BottomBar>
            </div>
        </div>
    );
}
