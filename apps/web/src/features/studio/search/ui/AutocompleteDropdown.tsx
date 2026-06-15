import { ThreeDIcon, PinIcon, StoreIcon } from '@todam/ui';
import type { Suggestion, SuggestionType } from '@todam/shared';

type AutocompleteDropdownProps = {
    suggestions: Suggestion[];
    onSelect: (suggestion: Suggestion) => void;
};

// 타입별 아이콘 (디자인: REGION=pin, PROGRAM=3d, STORE=store).
function SuggestionIcon({ type }: { type: SuggestionType }) {
    if (type === 'REGION') return <PinIcon size={16} className="text-foreground-tertiary" />;
    if (type === 'STORE') return <StoreIcon size={16} className="text-foreground-tertiary" />;
    // PROGRAM
    return <ThreeDIcon size={16} className="text-foreground-tertiary" />;
}

// 자동완성 드롭다운.
// REGION ≤ 3 / STORE ≤ 5 / PROGRAM ≤ 5 (BE 제한, FE는 수신 그대로 표시).
// 디자인(SearchResultItem): 32px 원형 배경 아이콘 + text(16 SemiBold) + subtitle(지역).
export function AutocompleteDropdown({ suggestions, onSelect }: AutocompleteDropdownProps) {
    if (suggestions.length === 0) return null;

    return (
        <ul className="flex flex-col gap-4 px-4 py-4">
            {suggestions.map((suggestion) => (
                <li key={`${suggestion.type}-${suggestion.id}`}>
                    <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 text-left"
                        onClick={() => onSelect(suggestion)}
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                            <SuggestionIcon type={suggestion.type} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate text-base font-semibold leading-5 text-foreground">
                                {suggestion.text}
                            </span>
                            {suggestion.subtitle && (
                                <span className="truncate text-xs text-foreground-tertiary">
                                    {suggestion.subtitle}
                                </span>
                            )}
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    );
}
