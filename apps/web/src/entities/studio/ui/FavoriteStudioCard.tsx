import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export type FavoriteStudioCardProps = {
    slug: string;
    name: string;
    category?: string;
    imageUrl: string;
    address: string;
    action?: ReactNode;
};

// Favorite list card. Detail route is slug-based: /studio/[slug].
export function FavoriteStudioCard({
    slug,
    name,
    category,
    imageUrl,
    address,
    action,
}: FavoriteStudioCardProps) {
    return (
        <div className="flex w-full items-center gap-3">
            <Link
                href={`/studio/${encodeURIComponent(slug)}`}
                className="flex min-w-0 flex-1 items-center gap-3"
            >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {category && (
                        <span className="w-fit rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-foreground-secondary">
                            {category}
                        </span>
                    )}
                    <p className="truncate text-base font-semibold leading-5 text-foreground">
                        {name}
                    </p>
                    <p className="truncate text-xs font-normal leading-4 text-foreground-tertiary">
                        {address}
                    </p>
                </div>
            </Link>
            {action}
        </div>
    );
}
