import { BusinessValidationPipe } from '../../../../common/pipes/business-validation.pipe';

export class ListStoresQueryPipe extends BusinessValidationPipe {
    constructor() {
        super({
            errorCode: 'INVALID_QUERY_PARAMETERS',
            fallbackMessage: '잘못된 쿼리 파라미터입니다.',
        });
    }
}
