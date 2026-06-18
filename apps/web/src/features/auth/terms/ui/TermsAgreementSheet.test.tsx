import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TermsAgreementSheet } from './TermsAgreementSheet';
import { useLatestPolicies } from '../queries';

// @todam/ui는 빌드 없이 TSX 소스를 export하므로 단위 테스트에서는 경량 모킹으로 대체.
// 실제 컴포넌트의 계약(props)만 흉내내어 시트의 게이팅 로직에 집중한다.
jest.mock('@todam/ui', () => ({
    StandardBottomSheet: ({
        actionLabel,
        actionDisabled,
        onAction,
        subLabel,
        onSub,
        children,
    }: any) => (
        <div>
            {children}
            <button type="button" disabled={actionDisabled} onClick={onAction}>
                {actionLabel}
            </button>
            <button type="button" onClick={onSub}>
                {subLabel}
            </button>
        </div>
    ),
    CheckboxInput: ({ label, checked, onCheckedChange, action }: any) => (
        <div>
            <label>
                <input
                    type="checkbox"
                    aria-label={label}
                    checked={checked}
                    onChange={(e) => onCheckedChange?.(e.target.checked)}
                />
                {label}
            </label>
            {action}
        </div>
    ),
}));

jest.mock('../queries', () => ({
    useLatestPolicies: jest.fn(),
}));

const mockUseLatestPolicies = useLatestPolicies as jest.MockedFunction<typeof useLatestPolicies>;

function setUrlMap(urlMap: Record<string, string> = {}) {
    mockUseLatestPolicies.mockReturnValue({ urlMap } as ReturnType<typeof useLatestPolicies>);
}

const ACTION_LABEL = '동의하고 시작하기';
const ALL_REQUIRED = '필수 항목 모두 체크하기';

describe('TermsAgreementSheet', () => {
    beforeEach(() => setUrlMap());

    it('초기에는 필수 미동의로 "동의하고 시작하기"가 비활성이다', () => {
        render(<TermsAgreementSheet />);
        expect(screen.getByRole('button', { name: ACTION_LABEL })).toBeDisabled();
    });

    it('필수 약관을 모두 체크해야 확인 버튼이 활성화된다', async () => {
        const user = userEvent.setup();
        render(<TermsAgreementSheet />);

        await user.click(screen.getByLabelText('서비스 이용약관'));
        await user.click(screen.getByLabelText('개인정보 수집 · 이용 동의'));
        // 아직 위치 약관 미체크 → 비활성
        expect(screen.getByRole('button', { name: ACTION_LABEL })).toBeDisabled();

        await user.click(screen.getByLabelText('위치기반 서비스 이용약관'));
        expect(screen.getByRole('button', { name: ACTION_LABEL })).toBeEnabled();
    });

    it('"필수 항목 모두 체크하기"로 한 번에 활성화하고 onConfirm에 동의값을 전달한다', async () => {
        const user = userEvent.setup();
        const onConfirm = jest.fn();
        render(<TermsAgreementSheet onConfirm={onConfirm} />);

        await user.click(screen.getByLabelText(ALL_REQUIRED));
        await user.click(screen.getByRole('button', { name: ACTION_LABEL }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledWith({ service: true, privacy: true, location: true });
    });

    it('필수 미동의 상태에서는 onConfirm을 호출하지 않는다(가드)', async () => {
        const user = userEvent.setup();
        const onConfirm = jest.fn();
        render(<TermsAgreementSheet onConfirm={onConfirm} />);

        // 버튼이 disabled여도 핸들러 가드까지 이중으로 검증.
        await user.click(screen.getByRole('button', { name: ACTION_LABEL }));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('"닫기" 클릭 시 onClose를 호출한다', async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(<TermsAgreementSheet onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: '닫기' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('urlMap에 url이 있으면 약관별 "보기" 외부 링크를 노출한다', () => {
        setUrlMap({ service: 'https://t.example/service' });
        render(<TermsAgreementSheet />);

        const link = screen.getByRole('link', { name: '보기' });
        expect(link).toHaveAttribute('href', 'https://t.example/service');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('urlMap이 비어있으면(시드 없음/에러) "보기" 링크를 렌더하지 않는다', () => {
        setUrlMap({});
        render(<TermsAgreementSheet />);
        expect(screen.queryByRole('link', { name: '보기' })).not.toBeInTheDocument();
    });
});
