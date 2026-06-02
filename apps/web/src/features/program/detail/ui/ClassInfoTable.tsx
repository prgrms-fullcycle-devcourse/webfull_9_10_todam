import { CalendarIcon, ClockIcon, FlagIcon, NametagIcon } from '@todam/ui';
import { formatDuration, formatPrice, type ProgramDetail } from '@todam/shared';

import { InfoTable, type InfoTableRow } from '../../../../shared/ui';

const ICON_SIZE = 16;

type Props = {
    program: Pick<ProgramDetail, 'price' | 'durationMinutes' | 'leadTimeDays' | 'deliverable'>;
};

// 클래스 상세 정보 테이블 (가격·소요시간·평균제작일·작품수령).
export function ClassInfoTable({ program }: Props) {
    const rows: InfoTableRow[] = [
        {
            label: '가격',
            value: formatPrice(program.price),
            icon: <NametagIcon size={ICON_SIZE} />,
        },
        {
            label: '소요 시간',
            value: formatDuration(program.durationMinutes),
            icon: <ClockIcon size={ICON_SIZE} />,
        },
        {
            label: '평균 제작일',
            value: `${program.leadTimeDays}일`,
            icon: <CalendarIcon size={ICON_SIZE} />,
        },
        {
            label: '작품 수령 방법',
            value: program.deliverable ? '택배·매장 수령' : '매장 수령',
            icon: <FlagIcon size={ICON_SIZE} />,
        },
    ];

    return <InfoTable rows={rows} />;
}
