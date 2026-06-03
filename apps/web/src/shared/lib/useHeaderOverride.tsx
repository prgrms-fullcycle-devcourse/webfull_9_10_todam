'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { useHeaderActionStore, type HeaderOverride } from '../model';
import { useLeaveGuard } from './useLeaveGuard';

// 우측 noti 기본값을 숨기기 위한 고정 노드. 식별자 안정화로 입력 중 불필요한 setAction 방지.
const HIDDEN_RIGHT_ACTION = <span aria-hidden />;

type HeaderOverrideOptions = {
    // 헤더 타입. 미지정 시 routeConfig 의 타입(없으면 'sub')을 따른다.
    type?: HeaderOverride['type'];
    // 타이틀. 미지정 시 routeConfig 의 타이틀을 따른다.
    title?: string;
    // 커스텀 뒤로가기(dirty 이탈 가드 등). 미지정 시 전역 Header 가 router.back().
    onBack?: () => void;
    // 우측 닫기(X) — 등록 플로우 / popup 타입.
    onClose?: () => void;
    // 우측 액션 슬롯에 넣을 노드(메뉴 등). 미지정 시 타입별 기본값(sub→noti) 유지.
    rightAction?: ReactNode;
    // 우측 기본 noti 버튼을 숨긴다(수정·상세 화면). rightAction 보다 우선.
    hideRightAction?: boolean;
    // 브라우저 새로고침/탭 닫기 가드(beforeunload). 앱 내 이탈은 onBack/onClose 모달로 처리.
    guardDirty?: boolean;
    // false 면 override/가드를 걸지 않는다(결과·완료 화면처럼 헤더 없는 단계). 기본 true.
    enabled?: boolean;
};

/**
 * 화면이 전역 Header(layout 에 1개)를 직접 제어하는 헬퍼.
 *
 * 전역 Header 는 route-driven 이라 페이지가 props 를 못 준다. 대신 이 훅이 mount 시
 * store(override + action)에 주입하고 unmount 시 해제한다. user/partner 구분 없이,
 * sub·popup 등 모든 헤더 형태에 사용한다.
 *
 * - 미지정 필드(type/title/onBack)는 store override 에서 빠져 routeConfig 값으로 폴백된다.
 * - onBack/onClose 는 ref 로 최신화해 override 객체 식별자를 안정화 → 폼 입력마다 헤더가
 *   리렌더되지 않도록 한다.
 * - rightAction 은 메뉴 등 우측 노드, hideRightAction 은 기본 noti 숨김.
 */
export function useHeaderOverride({
    type,
    title,
    onBack,
    onClose,
    rightAction,
    hideRightAction = false,
    guardDirty = false,
    enabled = true,
}: HeaderOverrideOptions) {
    const setOverride = useHeaderActionStore((s) => s.setOverride);
    const clearOverride = useHeaderActionStore((s) => s.clearOverride);
    const setAction = useHeaderActionStore((s) => s.setAction);
    const clearAction = useHeaderActionStore((s) => s.clearAction);

    const onBackRef = useRef(onBack);
    const onCloseRef = useRef(onClose);
    // 렌더 중 ref 직접 수정 금지 → 매 커밋마다 최신 콜백으로 갱신.
    useEffect(() => {
        onBackRef.current = onBack;
        onCloseRef.current = onClose;
    });

    const hasOnBack = !!onBack;
    const hasOnClose = !!onClose;

    // 새로고침/탭닫기 + 브라우저/제스처 뒤로가기(popstate) 가드.
    // popstate 시 onBack(=dirty 이탈 확인 모달)을 재사용한다.
    useLeaveGuard(enabled && guardDirty, () => onBackRef.current?.());

    useEffect(() => {
        if (!enabled) return;
        // 미지정 필드는 넣지 않아 routeConfig 폴백이 동작하도록 한다.
        const override: HeaderOverride = {};
        if (type !== undefined) override.type = type;
        if (title !== undefined) override.title = title;
        if (hasOnBack) override.onBack = () => onBackRef.current?.();
        if (hasOnClose) override.onClose = () => onCloseRef.current?.();
        setOverride(override);
        return () => clearOverride();
    }, [setOverride, clearOverride, type, title, hasOnBack, hasOnClose, enabled]);

    useEffect(() => {
        if (!enabled) return;
        if (hideRightAction) {
            setAction(HIDDEN_RIGHT_ACTION);
        } else if (rightAction !== undefined && rightAction !== null) {
            setAction(rightAction);
        } else {
            // 우측 노드 없음 → 타입별 기본값(noti 등) 노출되도록 비운다.
            clearAction();
            return;
        }
        return () => clearAction();
    }, [setAction, clearAction, rightAction, hideRightAction, enabled]);
}
