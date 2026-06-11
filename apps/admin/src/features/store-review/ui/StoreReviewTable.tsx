import { formatDate } from '@/shared/lib/format';

import type { AdminStoreListItem } from '../api';
import { StoreStatusBadge, VerificationBadge } from './StatusBadges';

export type StoreReviewTableProps = {
    stores: AdminStoreListItem[];
    onRowClick: (storeId: string) => void;
};

const headCellClass =
    'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary';
const bodyCellClass = 'px-4 py-3 align-middle text-sm text-foreground';

function region(item: AdminStoreListItem): string {
    const parts = [item.regionSido, item.regionSigungu].filter(Boolean);
    return parts.length ? parts.join(' ') : '-';
}

export function StoreReviewTable({ stores, onRowClick }: StoreReviewTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            <table className="w-full border-collapse">
                <thead className="border-b border-border-subtle bg-muted/40">
                    <tr>
                        <th className={headCellClass}>공방명</th>
                        <th className={headCellClass}>지역</th>
                        <th className={headCellClass}>사업자 정보</th>
                        <th className={headCellClass}>대표자 · 파트너</th>
                        <th className={headCellClass}>진위확인</th>
                        <th className={headCellClass}>신청일</th>
                        <th className={headCellClass}>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {stores.map((item) => (
                        <tr
                            key={item.storeId}
                            onClick={() => onRowClick(item.storeId)}
                            className="cursor-pointer border-b border-border-subtle transition-colors last:border-b-0 hover:bg-muted/40"
                        >
                            <td className={`${bodyCellClass} font-medium`}>{item.name}</td>
                            <td className={`${bodyCellClass} text-foreground-secondary`}>
                                {region(item)}
                            </td>
                            <td className={bodyCellClass}>
                                {item.businessDocument ? (
                                    <div className="flex flex-col">
                                        <span>{item.businessDocument.businessName}</span>
                                        <span className="text-xs text-foreground-tertiary">
                                            {item.businessDocument.businessNumber}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-foreground-tertiary">서류 미제출</span>
                                )}
                            </td>
                            <td className={bodyCellClass}>
                                <div className="flex flex-col">
                                    <span>{item.businessDocument?.ownerName ?? '-'}</span>
                                    <span className="text-xs text-foreground-tertiary">
                                        {item.partner.nickname}
                                    </span>
                                </div>
                            </td>
                            <td className={bodyCellClass}>
                                {item.businessDocument ? (
                                    <VerificationBadge
                                        status={item.businessDocument.verificationStatus}
                                    />
                                ) : (
                                    <span className="text-foreground-tertiary">-</span>
                                )}
                            </td>
                            <td
                                className={`${bodyCellClass} whitespace-nowrap text-foreground-secondary`}
                            >
                                {formatDate(item.createdAt)}
                            </td>
                            <td className={bodyCellClass}>
                                <StoreStatusBadge status={item.status} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
