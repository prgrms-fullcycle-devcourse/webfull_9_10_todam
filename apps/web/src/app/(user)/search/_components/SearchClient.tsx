'use client';

import type { Suggestion } from '@todam/shared';
import { CloseIcon } from '@todam/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    AutocompleteDropdown,
    RecentSearches,
    StudioSearchCard,
    useAutocomplete,
    useStudioSearch,
} from '@/features/studio/search';
import { releaseMobileKeyboardPrimer } from '@/shared/lib/primeMobileKeyboard';
import { useRecentSearches } from '@/shared/lib/useRecentSearches';
import { EmptyState } from '@/shared/ui';

const DEBOUNCE_MS = 150;

// 마지막 글자가 미완성 자모(ㄱ, ㅏ 등 단독 / 조합 중)면 자동완성 보류.
// 디자인 spec #10: "받침(완성형) 포함 시에만 자동완성 결과 출력" (예: "성ㅅ"은 미노출).
function endsWithIncompleteJamo(value: string): boolean {
    if (!value) return false;
    const code = value.codePointAt(value.length - 1) ?? 0;
    // Hangul Compatibility Jamo(ㄱ–ㅣ) 또는 Hangul Jamo(초/중/종성 조합 영역)
    return (code >= 0x3131 && code <= 0x3163) || (code >= 0x1100 && code <= 0x11ff);
}

// 검색 화면 클라이언트.
// 상태 전이: IDLE(최근검색어) → TYPING(자동완성 드롭다운) → SUBMITTED(결과 목록)
// header는 전역 Header('search' type)를 덮어쓰지 않고 이 컴포넌트 내부에서 검색창을 직접 구현.
// (Header의 'search' type은 onSearchChange/onSearchClear props를 받으므로
//  현재 useHeader override 방식으로 연결하면 계층을 침범하게 됨 → 독립 구현)
export function SearchClient() {
    const router = useRouter();

    // 마운트 시 실 input으로 focus 이전 → BottomNav에서 띄워 둔 키보드를 이어받고 임시 input 제거.
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
        releaseMobileKeyboardPrimer();
    }, []);

    // ── 입력/제출 상태 ───────────────────────────────────────────
    const [inputValue, setInputValue] = useState('');
    const [submittedKeyword, setSubmittedKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    // ── 최근 검색어 ──────────────────────────────────────────────
    const { searches, addSearch, removeSearch, clearSearches } = useRecentSearches();

    // ── 위치 (성수동 기본 좌표 폴백) ────────────────────────────
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            () => {
                // 거부 → null 유지 → getStudios에서 DEFAULT_LAT/LNG 폴백
            },
        );
    }, []);

    // ── debounce ─────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedKeyword(inputValue);
        }, DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [inputValue]);

    // 자동완성 활성 조건: 입력 중이며 아직 제출 전, 또는 debounce 완료 후 keyword 존재
    const isTyping = inputValue.trim().length > 0 && inputValue !== submittedKeyword;

    // ── 자동완성 ─────────────────────────────────────────────────
    // 미완성 자모로 끝나면(예: "성ㅅ") 호출 보류 (spec #10).
    const { data: autocompleteData, isError: isAutocompleteError } = useAutocomplete({
        keyword: debouncedKeyword,
        enabled: isTyping && !endsWithIncompleteJamo(debouncedKeyword.trim()),
    });

    // ── 검색 결과 ─────────────────────────────────────────────────
    const {
        data: searchData,
        isLoading: isSearchLoading,
        isError: isSearchError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useStudioSearch({
        keyword: submittedKeyword,
        lat: coords?.lat,
        lng: coords?.lng,
        enabled: submittedKeyword.trim().length > 0,
    });

    // ── 무한 스크롤 sentinel ──────────────────────────────────────
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) void fetchNextPage();
            },
            { rootMargin: '120px 0px 0px 0px' },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ── 핸들러 ────────────────────────────────────────────────────
    const handleSubmit = useCallback(
        (keyword: string) => {
            const trimmed = keyword.trim();
            if (!trimmed) return;
            setInputValue(trimmed);
            setSubmittedKeyword(trimmed);
            addSearch(trimmed);
        },
        [addSearch],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSubmit(inputValue);
    };

    const handleClear = () => {
        setInputValue('');
        setSubmittedKeyword('');
        setDebouncedKeyword('');
    };

    const handleSuggestionSelect = (suggestion: Suggestion) => {
        // 모든 타입 → keyword 검색 제출 (결과 목록).
        // STORE 상세 직접 이동은 Suggestion에 slug 필요 → BE에 slug 추가 후 활성화.
        handleSubmit(suggestion.text);
    };

    const handleRecentSelect = (keyword: string) => {
        handleSubmit(keyword);
    };

    // ── 파생 상태 ─────────────────────────────────────────────────
    const suggestions = autocompleteData?.suggestions ?? [];
    const showAutocomplete = isTyping && suggestions.length > 0 && !isAutocompleteError;
    const showResults = submittedKeyword.trim().length > 0 && !isTyping;
    // 자동완성 미노출(미완성 자모/빈 결과)이면 최근검색어로 폴백 → 빈 화면 방지.
    const showRecent = !showResults && !showAutocomplete;

    const storePages = searchData?.pages ?? [];
    const stores = storePages.flatMap((p) => p.stores);
    const isEmpty = showResults && !isSearchLoading && !isSearchError && stores.length === 0;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* 검색창 (Header 'search' 타입 — 이 화면 전용). 흰 입력박스 + 우측 '닫기' */}
            <div className="flex shrink-0 items-center gap-3 px-4 py-2.5">
                <div className="flex h-10 flex-1 items-center gap-3 rounded-lg bg-surface px-3">
                    <input
                        ref={inputRef}
                        type="search"
                        autoFocus
                        className="flex-1 bg-transparent text-base text-foreground placeholder:text-foreground-tertiary outline-none"
                        placeholder="공방, 지역, 클래스 검색"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {inputValue && (
                        <button
                            type="button"
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-foreground-tertiary"
                            onClick={handleClear}
                            aria-label="검색어 지우기"
                        >
                            <CloseIcon size={10} />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    className="shrink-0 text-sm text-foreground active:text-foreground-secondary"
                    onClick={() => router.back()}
                >
                    닫기
                </button>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {/* 자동완성 드롭다운 */}
                {showAutocomplete && (
                    <AutocompleteDropdown
                        suggestions={suggestions}
                        onSelect={handleSuggestionSelect}
                    />
                )}

                {/* 최근 검색어 */}
                {showRecent && (
                    <RecentSearches
                        searches={searches}
                        onSelect={handleRecentSelect}
                        onRemove={removeSearch}
                        onClearAll={clearSearches}
                    />
                )}

                {/* 검색 결과 */}
                {showResults && (
                    <section className="flex flex-col px-4 py-4">
                        {isSearchLoading && (
                            <p className="py-10 text-center text-sm text-foreground-tertiary">
                                검색 중입니다.
                            </p>
                        )}

                        {isSearchError && !isSearchLoading && (
                            <p className="py-10 text-center text-sm text-foreground-tertiary">
                                검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                            </p>
                        )}

                        {isEmpty && <EmptyState message="일치하는 항목이 없습니다." />}

                        {stores.length > 0 && (
                            <ul className="flex flex-col gap-6">
                                {stores.map((store) => (
                                    <li key={store.id}>
                                        <StudioSearchCard store={store} />
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* 무한 스크롤 sentinel */}
                        <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                        {isFetchingNextPage && (
                            <p className="py-3 text-center text-xs text-foreground-tertiary">
                                불러오는 중입니다.
                            </p>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
