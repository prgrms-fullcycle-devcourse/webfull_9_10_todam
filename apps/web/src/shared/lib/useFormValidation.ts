'use client';

import { useState } from 'react';

// 필드별 검증 함수 맵. 통과 시 undefined, 실패 시 에러 메시지.
export type Validators<T> = Partial<{
    [K in keyof T]: (value: T[K]) => string | undefined;
}>;

// 필드 validator 들을 실행해 errors 맵을 관리한다. 검증 규칙(validators)은 폼별로 주입.
export function useFormValidation<T extends object>(validators: Validators<T>) {
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

    // 전체 검증 후 errors 갱신 + 통과 여부 반환.
    const validate = (values: T): boolean => {
        const errs: Partial<Record<keyof T, string>> = {};
        (Object.keys(validators) as (keyof T)[]).forEach((key) => {
            const fn = validators[key];
            const err = fn?.(values[key]);
            if (err) errs[key] = err;
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    return { errors, validate, setErrors };
}
