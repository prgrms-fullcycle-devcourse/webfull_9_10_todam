'use client';

import { useMemo, useState } from 'react';

import { FormBottomSheet, CheckboxInput } from '@todam/ui';

import { TERMS, TERMS_CONTENT } from '../model/termsContent';
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
    // "보기"로 본문을 열람 중인 약관. null이면 동의 목록 표시.
    const [viewingTerms, setViewingTerms] = useState<TermsKey | null>(null);

    const allChecked = useMemo(() => TERMS.every((term) => agreement[term.key]), [agreement]);

    // 필수 약관이 모두 동의돼야 확인 버튼 활성.
    const requiredAllChecked = useMemo(
        () => TERMS.filter((term) => term.required).every((term) => agreement[term.key]),
        [agreement],
    );

    // 전체 동의 토글: 모두 체크/모두 해제.
    const handleToggleAll = (checked: boolean) => {
        setAgreement(
            TERMS.reduce<TermsAgreement>((acc, term) => ({ ...acc, [term.key]: checked }), {
                ...INITIAL_AGREEMENT,
            }),
        );
    };

    // 개별 동의 토글. 모두 체크되면 전체 동의가 자동으로 체크되고,
    // 하나라도 해제되면 전체 동의도 자동 해제된다(allChecked 파생값).
    const handleToggle = (key: TermsKey, checked: boolean) => {
        setAgreement((prev) => ({ ...prev, [key]: checked }));
    };

    const handleConfirm = () => {
        if (!requiredAllChecked) return;
        onConfirm?.(agreement);
    };

    // 본문 열람 중 "동의하기": 해당 약관을 체크하고 목록으로 복귀.
    const handleAgreeViewing = () => {
        if (!viewingTerms) return;
        setAgreement((prev) => ({ ...prev, [viewingTerms]: true }));
        setViewingTerms(null);
    };

    // 약관 본문 뷰: 시트 콘텐츠를 본문으로 전환(체크 상태는 컴포넌트 상태로 유지됨).
    if (viewingTerms) {
        const document = TERMS_CONTENT[viewingTerms];

        return (
            <FormBottomSheet
                title={document.title}
                actionLabel="동의하기"
                onAction={handleAgreeViewing}
                subLabel="돌아가기"
                onSub={() => setViewingTerms(null)}
            >
                <div className="flex max-h-96 flex-col gap-5 overflow-y-auto pr-1">
                    {document.sections.map((section) => (
                        <section key={section.heading} className="flex flex-col gap-2">
                            <h3 className="text-base font-semibold text-foreground">
                                {section.heading}
                            </h3>
                            <div className="flex flex-col gap-1">
                                {section.paragraphs.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="text-sm leading-6 text-foreground-secondary"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </FormBottomSheet>
        );
    }

    return (
        <FormBottomSheet
            title="토담을 시작하기 전에 약관 동의가 필요해요"
            actionLabel="동의하고 시작하기"
            actionDisabled={!requiredAllChecked}
            onAction={handleConfirm}
            subLabel="닫기"
            onSub={onClose}
        >
            <div className="flex flex-col gap-2">
                <CheckboxInput
                    bordered
                    label="전체 동의 (선택 포함)"
                    checked={allChecked}
                    onCheckedChange={handleToggleAll}
                />

                <ul className="flex flex-col">
                    {TERMS.map((term) => (
                        <li key={term.key}>
                            <CheckboxInput
                                label={`${term.required ? '[필수]' : '[선택]'} ${term.label}`}
                                checked={agreement[term.key]}
                                onCheckedChange={(checked) => handleToggle(term.key, checked)}
                                action={
                                    <button
                                        type="button"
                                        onClick={() => setViewingTerms(term.key)}
                                        className="shrink-0 text-sm text-foreground-tertiary underline"
                                    >
                                        보기
                                    </button>
                                }
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </FormBottomSheet>
    );
}
