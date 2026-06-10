import { DescriptionBlock } from '@todam/ui';

// 체험 정보 안내. user/partner 공용. 평균 제작일(leadTimeDays) 기반 카피.
export function ClassExperienceInfo({ leadTimeDays }: { leadTimeDays: number }) {
    return (
        <DescriptionBlock title="체험 정보">
            {`체험 후 완성된 작품을 전달받기까지 약 ${leadTimeDays}일 정도 소요돼요. 작품이 완성될 때까지 단계별 사진과 알림으로 작품 제작 과정을 보내드려요.`}
        </DescriptionBlock>
    );
}
