import { StoreRegistrationFlow } from '../../../../features/store/registration';

// 2번째+ 공방 등록. 첫 등록(/apply)과 완전히 동일한 플로우 — 공방별 사업자 검증 필요.
// 닫기 시 공방 관리 리스트로 복귀 (첫 등록과 진입점이 다름).
export default function PartnerStoreNewPage() {
    return <StoreRegistrationFlow returnTo="/partner/stores" />;
}
