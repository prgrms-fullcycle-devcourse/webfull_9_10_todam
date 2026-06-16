'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectionTitle, TextInput, Button, BottomBar } from '@todam/ui';
import { nicknameSchema, PHONE_REGEX, formatPhone } from '@todam/shared';

import { useToast, useModal, useSheet } from '@/shared/model';
import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { loadSavedReserverInfo, saveReserverInfo } from '@/shared/lib/reserverInfo';
import { ResetRequestSheet } from '@/features/auth/reset-password';
import { useMyProfile, useUpdateMyProfile } from '../queries';
import { WithdrawModal } from './WithdrawModal';

export function ProfileEditScreen() {
    const router = useRouter();
    const toast = useToast();
    const { open: openModal } = useModal();
    const { open: openSheet } = useSheet();

    // sub 헤더 기본 우측 noti 숨김 (수정 화면).
    useHeaderOverride({ hideRightAction: true });

    const { data: profileData, isLoading } = useMyProfile();
    const updateProfile = useUpdateMyProfile();

    // 초기 닉네임: 프로필 로드 후 한 번만 세팅
    const currentNickname = profileData?.user.nickname ?? '';
    const email = profileData?.user.email ?? '';
    // 구버전 API 응답/캐시에 hasPassword가 없더라도 탈퇴 진입은 허용한다.
    // 이메일 계정의 body 없는 요청은 BE가 PASSWORD_MISMATCH로 차단한다.
    const hasPassword = profileData?.user.hasPassword ?? false;

    const [nickname, setNickname] = useState<string | null>(null);
    const [nicknameError, setNicknameError] = useState<string | null>(null);

    const displayNickname = nickname ?? currentNickname;

    // ─── 예약자 정보(이름/연락처) ─────────────────────────────────────────
    // 예약 생성 화면과 같은 localStorage('todam_reserver_info')를 공유한다.
    // 저장된 값이 있으면 출력, 없으면 빈값으로 시작.
    const [reserverName, setReserverName] = useState('');
    const [reserverPhone, setReserverPhone] = useState('');
    const [savedReserver, setSavedReserver] = useState({ name: '', phone: '' });

    // 저장된 예약자 정보 프리필 — 초기 렌더 후(타이머) 주입해 hydration 불일치/캐스케이드 방지.
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const saved = loadSavedReserverInfo();
            if (!saved) return;
            setReserverName(saved.name);
            setReserverPhone(saved.phone);
            setSavedReserver({ name: saved.name, phone: saved.phone });
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const handleNicknameChange = (value: string) => {
        setNickname(value);
        setNicknameError(null);
    };

    const handlePhoneChange = (value: string) => {
        setReserverPhone(formatPhone(value));
    };

    // ─── 변경 감지(isDirty) ───────────────────────────────────────────────
    const nicknameDirty = displayNickname.trim() !== currentNickname;
    const reserverDirty =
        reserverName !== savedReserver.name || reserverPhone !== savedReserver.phone;
    const isDirty = nicknameDirty || reserverDirty;

    // 예약자 정보 유효성 — 비우면 통과(선택), 입력 시에만 형식 검사.
    const nameValid =
        reserverName.trim() === '' ||
        (reserverName.trim().length >= 2 && reserverName.trim().length <= 20);
    const phoneValid = reserverPhone.trim() === '' || PHONE_REGEX.test(reserverPhone);

    // 변경사항이 있고, 진행 중/로딩이 아닐 때만 저장 활성화.
    const canSave = isDirty && !updateProfile.isPending && !isLoading;

    const persistReserver = () => {
        if (!reserverDirty) return;
        const next = { name: reserverName.trim(), phone: reserverPhone };
        saveReserverInfo(next);
        setSavedReserver(next);
    };

    const handleSave = () => {
        if (!nameValid || !phoneValid) {
            toast.push({ message: '예약자 정보를 형식에 맞게 입력해주세요.' });
            return;
        }

        // 닉네임 변경 시: 검증 후 API 저장. 성공 시 예약자 정보도 함께 저장.
        if (nicknameDirty) {
            const trimmed = displayNickname.trim();
            // D5 확정 SSOT: nicknameSchema (/^[가-힣a-zA-Z0-9]{2,10}$/)
            const parsed = nicknameSchema.safeParse(trimmed);
            if (!parsed.success) {
                setNicknameError(
                    parsed.error.issues[0]?.message ?? '닉네임은 한글·영문·숫자 2~10자여야 합니다.',
                );
                return;
            }

            updateProfile.mutate(
                { nickname: trimmed },
                {
                    onSuccess: () => {
                        persistReserver();
                        toast.push({ message: '저장되었습니다.' });
                        router.back();
                    },
                    onError: (err) => {
                        if (err instanceof ApiError) {
                            if (err.code === 'NICKNAME_ALREADY_EXISTS') {
                                setNicknameError(
                                    '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.',
                                );
                            } else if (err.code === 'INVALID_REQUEST') {
                                // contract D5 확정 문구
                                setNicknameError('닉네임은 한글·영문·숫자 2~10자여야 합니다.');
                            } else {
                                toast.push({
                                    message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
                                });
                            }
                        } else {
                            toast.push({
                                message: '저장 중 오류가 발생했습니다. 다시 시도해주세요.',
                            });
                        }
                    },
                },
            );
            return;
        }

        // 예약자 정보만 변경된 경우 — 로컬 저장 후 종료.
        persistReserver();
        toast.push({ message: '저장되었습니다.' });
        router.back();
    };

    const handleWithdraw = () => {
        openModal(<WithdrawModal hasPassword={hasPassword} />);
    };

    return (
        // 스크롤은 AppShell 단일 main 이 소유. BottomBar 는 sticky bottom-0 으로 하단 고정(#396).
        <>
            <div className="flex flex-col gap-5 px-4 pb-4 pt-2">
                {/* 계정 정보 */}
                <section className="flex flex-col gap-4">
                    <SectionTitle size="md" title="계정 정보" />

                    {/* 계정(이메일) — 읽기 전용 */}
                    <TextInput
                        id="profile-email"
                        label="계정"
                        type="email"
                        value={isLoading ? '' : email}
                        readOnly
                        disabled
                        placeholder="로딩 중..."
                    />

                    {/* 비밀번호 재설정 — 재설정 요청 시트 (파트너 설정과 동일 패턴) */}
                    <div className="-mt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => openSheet(<ResetRequestSheet initialEmail={email} />)}
                            className="text-xs font-semibold text-primary"
                        >
                            비밀번호 재설정
                        </button>
                    </div>

                    {/* 닉네임 */}
                    <TextInput
                        id="profile-nickname"
                        label="닉네임"
                        type="text"
                        value={displayNickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        placeholder="닉네임을 입력해주세요"
                        error={!!nicknameError}
                        helperText={nicknameError ?? '특수문자를 제외한 2~10자로 입력해주세요.'}
                        maxLength={10}
                    />
                </section>

                {/* 예약자 정보 */}
                <section className="flex flex-col gap-4">
                    <SectionTitle size="md" title="예약자 정보" />

                    <TextInput
                        id="profile-reserver-name"
                        label="이름"
                        type="text"
                        value={reserverName}
                        onChange={(e) => setReserverName(e.target.value)}
                        placeholder="방문하실 분 성함을 입력해 주세요"
                        maxLength={20}
                        error={!nameValid}
                        helperText={!nameValid ? '이름은 2~20자로 입력해 주세요.' : undefined}
                    />

                    <TextInput
                        id="profile-reserver-phone"
                        label="연락처"
                        type="tel"
                        inputMode="numeric"
                        value={reserverPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="연락받으실 번호를 입력해 주세요"
                        error={!phoneValid}
                        helperText={
                            !phoneValid ? '010-0000-0000 형식으로 입력해 주세요.' : undefined
                        }
                    />
                </section>

                {/* 회원탈퇴 진입 — 시안: 안내문 + 링크 가로 중앙 정렬 */}
                <div className="flex items-center justify-center gap-1 py-5">
                    <span className="text-xs text-foreground-tertiary">
                        혹시 토담을 떠나고 싶으신가요?
                    </span>
                    <button
                        type="button"
                        onClick={handleWithdraw}
                        className="cursor-pointer text-xs font-semibold text-foreground-tertiary underline underline-offset-2"
                    >
                        탈퇴하기
                    </button>
                </div>
            </div>

            <BottomBar>
                <Button
                    variant="filled"
                    size="lg"
                    className="w-full"
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    {updateProfile.isPending ? '저장 중...' : '저장'}
                </Button>
            </BottomBar>
        </>
    );
}
