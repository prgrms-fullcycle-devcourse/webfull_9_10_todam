'use client';

import { FormBottomSheet } from '@todam/ui';

import { useSheet } from '@/shared/model';
import type { TermsSection } from '@/features/auth/terms/model/termsContent';

type TermsViewSheetProps = {
    title: string;
    sections: TermsSection[];
};

export function TermsViewSheet({ title, sections }: TermsViewSheetProps) {
    const { close } = useSheet();

    return (
        <FormBottomSheet
            title={title}
            actionLabel="확인"
            onAction={close}
            subLabel="닫기"
            onSub={close}
        >
            <div className="flex max-h-96 flex-col gap-5 overflow-y-auto pr-1">
                {sections.map((section) => (
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
