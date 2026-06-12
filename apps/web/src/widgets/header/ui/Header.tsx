'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { Logo, Button } from '@todam/ui';
import { CloseIcon, LeftIcon, NotiIcon } from '@todam/ui';

import { useAuthStore } from '@/features/auth/login';
import { useUnreadNotificationCount } from '@/features/notification';
import { useHeaderActionStore } from '@/shared/model';
import { useHeader } from '../model/useHeader';

type HeaderType = 'home' | 'main' | 'mainText' | 'sub' | 'subText' | 'popup' | 'search';

type HeaderViewProps = {
    type: HeaderType;
    title?: string;
    actionLabel?: string;
    rightAction?: ReactNode;
    onNoti?: () => void;
    hasUnread?: boolean;
    onAction?: () => void;
    onBack?: () => void;
    onClose?: () => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchClear?: () => void;
};

function HeaderView({
    type,
    title,
    actionLabel = '선택',
    rightAction,
    onNoti,
    hasUnread,
    onAction,
    onBack,
    onClose,
    searchValue,
    onSearchChange,
    onSearchClear,
}: HeaderViewProps) {
    const bellIcon = (
        <span className="relative inline-flex">
            <NotiIcon />
            {hasUnread && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
            )}
        </span>
    );
    return (
        <header className="shrink-0 bg-transparent pt-safe">
            <div
                className={`flex h-15 items-center ${type === 'popup' ? 'justify-end' : type === 'search' ? 'gap-3 px-4' : ''}`}
            >
                {type === 'home' && (
                    <>
                        <div className="flex flex-1 items-center px-4">
                            <Logo color="brand" height={34} />
                        </div>
                        <Button
                            variant="ghost"
                            layout="onlyIcon"
                            size="lg"
                            icon={bellIcon}
                            aria-label="알림"
                            onClick={onNoti}
                            className="hover:!bg-transparent hover:!text-foreground"
                        />
                    </>
                )}

                {type === 'main' && (
                    <>
                        <div className="flex flex-1 items-center pl-[18px]">
                            <span className="truncate text-2xl font-semibold text-foreground">
                                {title}
                            </span>
                        </div>
                        {rightAction ?? (
                            <Button
                                variant="ghost"
                                layout="onlyIcon"
                                size="lg"
                                icon={bellIcon}
                                aria-label="알림"
                                onClick={onNoti}
                                className="hover:!bg-transparent hover:!text-foreground"
                            />
                        )}
                    </>
                )}

                {type === 'mainText' && (
                    <>
                        <div className="flex flex-1 items-center pl-[18px]">
                            <span className="truncate text-2xl font-semibold text-foreground">
                                {title}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            layout="onlyLabel"
                            size="lg"
                            onClick={onAction}
                            className="hover:!bg-transparent hover:!text-foreground"
                        >
                            {actionLabel}
                        </Button>
                    </>
                )}

                {type === 'sub' && (
                    <>
                        <Button
                            variant="ghost"
                            layout="onlyIcon"
                            size="lg"
                            icon={<LeftIcon />}
                            aria-label="뒤로가기"
                            onClick={onBack}
                            className="hover:!bg-transparent hover:!text-foreground"
                        />
                        <span className="flex-1 truncate text-lg font-medium leading-6 text-foreground">
                            {title}
                        </span>
                        {rightAction ??
                            (onClose ? (
                                <Button
                                    variant="ghost"
                                    layout="onlyIcon"
                                    size="lg"
                                    icon={<CloseIcon />}
                                    aria-label="닫기"
                                    onClick={onClose}
                                    className="hover:!bg-transparent hover:!text-foreground"
                                />
                            ) : (
                                <Button
                                    variant="ghost"
                                    layout="onlyIcon"
                                    size="lg"
                                    icon={bellIcon}
                                    aria-label="알림"
                                    onClick={onNoti}
                                    className="hover:!bg-transparent hover:!text-foreground"
                                />
                            ))}
                    </>
                )}

                {type === 'subText' && (
                    <>
                        <Button
                            variant="ghost"
                            layout="onlyIcon"
                            size="lg"
                            icon={<LeftIcon />}
                            aria-label="뒤로가기"
                            onClick={onBack}
                            className="hover:!bg-transparent hover:!text-foreground"
                        />
                        <span className="flex-1 truncate text-lg font-medium leading-6 text-foreground">
                            {title}
                        </span>
                        <Button
                            variant="ghost"
                            layout="onlyLabel"
                            size="lg"
                            onClick={onAction}
                            className="hover:!bg-transparent hover:!text-foreground"
                        >
                            {actionLabel}
                        </Button>
                    </>
                )}

                {type === 'popup' && (
                    <Button
                        variant="ghost"
                        layout="onlyIcon"
                        size="lg"
                        icon={<CloseIcon />}
                        aria-label="닫기"
                        onClick={onClose}
                        className="hover:!bg-transparent hover:!text-foreground"
                    />
                )}

                {type === 'search' && (
                    <>
                        <div className="flex h-10 flex-1 items-center gap-3 rounded-lg bg-surface px-3 py-2">
                            <input
                                type="search"
                                className="flex-1 bg-transparent text-base text-foreground placeholder:text-foreground-tertiary outline-none"
                                placeholder="검색어를 입력해주세요"
                                value={searchValue ?? ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted"
                                    onClick={onSearchClear}
                                    aria-label="검색어 지우기"
                                >
                                    <CloseIcon size={8} />
                                </button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            layout="onlyLabel"
                            size="lg"
                            onClick={onClose}
                            className="hover:!bg-transparent hover:!text-foreground"
                        >
                            닫기
                        </Button>
                    </>
                )}
            </div>
        </header>
    );
}

type WidgetHeaderProps = Omit<Partial<HeaderViewProps>, 'type'>;

export function Header(props: WidgetHeaderProps) {
    const header = useHeader();
    const router = useRouter();
    const rightAction = useHeaderActionStore((s) => s.action);
    const isAuthenticated = useAuthStore((s) => s.state === 'AUTHENTICATED');
    const { data: unreadCount } = useUnreadNotificationCount(isAuthenticated);

    if (!header.visible) return null;

    return (
        <HeaderView
            type={header.type}
            title={header.title}
            onBack={header.onBack}
            onClose={header.onClose}
            onNoti={() => router.push('/notifications')}
            hasUnread={(unreadCount ?? 0) > 0}
            rightAction={rightAction}
            {...props}
        />
    );
}
