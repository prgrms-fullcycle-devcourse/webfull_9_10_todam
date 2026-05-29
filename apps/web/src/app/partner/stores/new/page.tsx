import { StoreRegistrationFlow } from '../../../../features/store/registration';

// 2번째+ 공방 등록. 첫 등록(/apply)과 완전히 동일한 플로우 — 공방별 사업자 검증 필요.
export default function PartnerStoreNewPage() {
    return <StoreRegistrationFlow />;
}
