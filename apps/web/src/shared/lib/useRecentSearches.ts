'use client';

import { useCallback, useState } from 'react';

// 최근 검색어 localStorage 정책 (plan C):
//   - 최대 10건
//   - 중복 제거: 동일 키워드 재검색 시 최신이 맨 앞
//   - 초과 시 오래된 항목 제거 (배열 끝)
//   - 개별 / 전체 삭제
const STORAGE_KEY = 'todam_recent_searches';
const MAX_COUNT = 10;

function readStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
        return [];
    }
}

function writeStorage(items: string[]): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // localStorage 접근 불가 환경 — 무시
    }
}

export function useRecentSearches() {
    // useState 초기화 함수: 클라이언트 마운트 시 1회 localStorage에서 읽음.
    // SSR 에서는 빈 배열 반환(hydration mismatch 방지 위해 typeof window 체크).
    const [searches, setSearches] = useState<string[]>(() => readStorage());

    // 검색어 저장: 중복 제거 후 맨 앞 삽입, 최대 10건 유지
    const addSearch = useCallback((keyword: string) => {
        const trimmed = keyword.trim();
        if (!trimmed) return;
        setSearches((prev) => {
            const deduped = prev.filter((k) => k !== trimmed);
            const updated = [trimmed, ...deduped].slice(0, MAX_COUNT);
            writeStorage(updated);
            return updated;
        });
    }, []);

    // 개별 삭제
    const removeSearch = useCallback((keyword: string) => {
        setSearches((prev) => {
            const updated = prev.filter((k) => k !== keyword);
            writeStorage(updated);
            return updated;
        });
    }, []);

    // 전체 삭제
    const clearSearches = useCallback(() => {
        writeStorage([]);
        setSearches([]);
    }, []);

    return { searches, addSearch, removeSearch, clearSearches };
}
