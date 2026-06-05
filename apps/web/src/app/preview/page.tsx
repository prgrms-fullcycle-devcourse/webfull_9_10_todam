'use client';

import { TermsAgreementSheet } from '../../features/auth/terms';

export default function PreviewPage() {
    return (
        <div className="relative flex h-screen flex-col items-center justify-end bg-background">
            <TermsAgreementSheet />
        </div>
    );
}
