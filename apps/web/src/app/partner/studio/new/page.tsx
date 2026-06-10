import { StudioRegistrationFlow } from '@/features/studio/registration';

// 공방 추가 등록 / 첫 등록(/apply)과 동일한 플로우
// 차이점: 닫기 시 파트너홈 복귀
export default function PartnerStoreNewPage() {
    return <StudioRegistrationFlow returnTo="/partner" />;
}
