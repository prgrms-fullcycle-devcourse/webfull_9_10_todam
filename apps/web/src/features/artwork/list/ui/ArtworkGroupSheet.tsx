import { CheckIcon, StandardBottomSheet } from '@todam/ui';
import { ArtworkStatusGroup } from '@todam/shared';

import { GROUP_LABEL } from '../stepMap';

const GROUPS = [
    ArtworkStatusGroup.WAITING,
    ArtworkStatusGroup.IN_PROGRESS,
    ArtworkStatusGroup.RECEIVING,
    ArtworkStatusGroup.RECEIVED,
] as const;

export interface ArtworkGroupSheetProps {
    selectedGroup: ArtworkStatusGroup;
    onSelect: (group: ArtworkStatusGroup) => void;
    onClose: () => void;
}

function GroupRow({
    group,
    selected,
    onClick,
}: {
    group: ArtworkStatusGroup;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center bg-surface text-left transition-colors hover:bg-muted"
        >
            <span className="flex min-w-0 flex-1 items-center py-4">
                <span className="text-base font-medium text-foreground">
                    {GROUP_LABEL[group] ?? group}
                </span>
            </span>
            {selected && <CheckIcon size={16} className="shrink-0 text-primary" />}
        </button>
    );
}

export function ArtworkGroupSheet({ selectedGroup, onSelect, onClose }: ArtworkGroupSheetProps) {
    return (
        <StandardBottomSheet
            title="어떤 작품을 확인할까요?"
            subTitle="공정 단계별로 모아볼 수 있어요."
            actionLabel="닫기"
            actionVariant="ghost"
            onAction={onClose}
        >
            <div className="flex flex-col gap-2">
                {GROUPS.map((group) => (
                    <GroupRow
                        key={group}
                        group={group}
                        selected={group === selectedGroup}
                        onClick={() => {
                            onSelect(group);
                            onClose();
                        }}
                    />
                ))}
            </div>
        </StandardBottomSheet>
    );
}
