'use client';

import { useMemo, useState } from 'react';

import { StandardBottomSheet, CheckboxInput } from '@todam/ui';

import { useLatestPolicies } from '../queries';
import { TERMS } from '../model/termsContent';
import type { TermsAgreement, TermsKey } from '../model/termsContent';

const INITIAL_AGREEMENT: TermsAgreement = {
    service: false,
    location: false,
    privacy: false,
};

export type TermsAgreementSheetProps = {
    /** 필수 약관 모두 동의 후 "동의하고 시작하기" 클릭 시 동의값 전달. */
    onConfirm?: (agreement: TermsAgreement) => void;
    /** "닫기" 클릭 시. */
    onClose?: () => void;
};

export function TermsAgreementSheet({ onConfirm, onClose }: TermsAgreementSheetProps) {
    const [agreement, setAgreement] = useState<TermsAgreement>(INITIAL_AGREEMENT);

    // GET /policies/latest — 최신 약관 URL 조회. 빈 배열(시드 없음)·에러 시 urlMap이 빈 객체.
    const { urlMap } = useLatestPolicies();

    const requiredAllChecked = useMemo(
        () => TERMS.filter((term) => term.required).every((term) => agreement[term.key]),
        [agreement],
    );

    // required: true 약관만 한 번에 체크/해제
    const handleToggleRequired = (checked: boolean) => {
        setAgreement((prev) => {
            const next = { ...prev };
            TERMS.filter((term) => term.required).forEach((term) => {
                next[term.key] = checked;
            });
            return next;
        });
    };

    const handleToggle = (key: TermsKey, checked: boolean) => {
        setAgreement((prev) => ({ ...prev, [key]: checked }));
    };

    const handleConfirm = () => {
        if (!requiredAllChecked) return;
        onConfirm?.(agreement);
    };

    return (
        // 플로팅 카드(좌우·하단 여백+라운드+그림자)·dim·drag 는 StandardBottomSheet + AppSheet 담당.
        <StandardBottomSheet
            actionLabel="동의하고 시작하기"
            actionDisabled={!requiredAllChecked}
            onAction={handleConfirm}
            subLabel="닫기"
            onSub={onClose}
        >
            {/* 제목 두 줄 고정: title prop은 string이라 줄바꿈 불가 → children에 직접 렌더. */}
            <div className="flex flex-col gap-7">
                <h2 className="text-2xl font-bold leading-8 text-foreground">
                    토담을 시작하기 전에
                    <br />
                    약관 동의가 필요해요
                </h2>

                <div className="flex flex-col gap-2">
                    <CheckboxInput
                        label="필수 항목 모두 체크하기"
                        checked={requiredAllChecked}
                        onCheckedChange={handleToggleRequired}
                        className="!bg-muted"
                    />

                    <ul className="flex flex-col">
                        {TERMS.map((term) => (
                            <li key={term.key}>
                                <CheckboxInput
                                    label={term.label}
                                    checked={agreement[term.key]}
                                    onCheckedChange={(checked) => handleToggle(term.key, checked)}
                                    action={
                                        urlMap[term.key] ? (
                                            <a
                                                href={urlMap[term.key]}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 text-sm text-foreground-tertiary underline"
                                            >
                                                보기
                                            </a>
                                        ) : undefined
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </StandardBottomSheet>
    );
}
