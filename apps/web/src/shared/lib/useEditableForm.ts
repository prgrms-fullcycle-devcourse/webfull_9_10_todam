'use client';

import { useCallback, useState } from 'react';

// 1-level(얕은) 값 비교.
function shallowEqual<T extends object>(a: T, b: T): boolean {
    const keys = Object.keys(a) as (keyof T)[];
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((k) => a[k] === b[k]);
}

// 서버 baseline 으로 폼을 1회 초기화하고, baseline 대비 변경 여부(isDirty)를 파생한다.
// baseline 은 매 렌더 새 객체여도 값이 안정적이면(예: key 리마운트된 서버 데이터) 안전.
export function useEditableForm<T extends object>(baseline: T) {
    const [form, setForm] = useState<T>(baseline);

    const patch = useCallback((p: Partial<T>) => {
        setForm((prev) => ({ ...prev, ...p }));
    }, []);

    const isDirty = !shallowEqual(form, baseline);

    return { form, setForm, patch, isDirty };
}
