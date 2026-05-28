import { LeafIcon, NotiIcon } from '@todam/ui';

export function Header() {
    return (
        <header className="shrink-0 border-b border-border-subtle bg-surface pt-safe">
            <div className="flex h-14 items-center justify-between px-4">
                <span className="inline-flex items-center gap-1 text-lg font-bold text-primary">
                    <LeafIcon size={24} />
                    토담
                </span>
                <button
                    type="button"
                    aria-label="알림"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground-secondary hover:bg-muted"
                >
                    <NotiIcon size={24} />
                </button>
            </div>
        </header>
    );
}
