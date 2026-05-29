import type { HTMLAttributes, ReactElement } from 'react';
import { StatusIcon, FilterDropdown, StatusFilterChip } from '@todam/ui';

export type ArtworkStatusFilter = {
    label: string;
    count: number;
    selected?: boolean;
};

export type ArtworkStatusFiltersProps = {
    groupLabel: string;
    groupIcon?: ReactElement<{ size?: number }>;
    filters: ArtworkStatusFilter[];
} & HTMLAttributes<HTMLDivElement>;

export function ArtworkStatusFilters({
    groupLabel,
    groupIcon = <StatusIcon />,
    filters,
    className,
    ...props
}: ArtworkStatusFiltersProps) {
    return (
        <div
            className={['flex items-center gap-2', className].filter(Boolean).join(' ')}
            {...props}
        >
            <FilterDropdown icon={groupIcon}>{groupLabel}</FilterDropdown>
            {filters.map((filter) => (
                <StatusFilterChip
                    key={filter.label}
                    selected={filter.selected}
                    count={filter.count}
                >
                    {filter.label}
                </StatusFilterChip>
            ))}
        </div>
    );
}
