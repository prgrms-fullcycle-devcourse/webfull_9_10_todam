import type { AutocompleteStoresResponseDto } from '../../presentation/dto/autocomplete-stores-response.dto';
import type { GetPartnerOnboardingResponseDto } from '../../presentation/dto/get-partner-onboarding.dto';
import type { GetPartnerStoreDetailResponseDto } from '../../presentation/dto/get-partner-store-detail.dto';
import type { GetStoreDetailResponseDto } from '../../presentation/dto/get-store-detail.dto';
import type { ListPartnerStoresResponseDto } from '../../presentation/dto/list-partner-stores.dto';
import type { ListStoreProgramsResponseDto } from '../../presentation/dto/list-store-programs.dto';
import type { ListStoreReviewsQueryDto } from '../../presentation/dto/list-store-reviews.dto';
import type { ListStoreReviewsResponseDto } from '../../presentation/dto/list-store-reviews-response.dto';
import type { ListStoresQueryDto } from '../../presentation/dto/list-stores.dto';
import type { ListStoresResponseDto } from '../../presentation/dto/list-stores-response.dto';
import type { SlugAvailabilityResponseDto } from '../../presentation/dto/slug-availability.dto';

export abstract class StoreQueryReader {
    abstract autocomplete(keyword: string | undefined): Promise<AutocompleteStoresResponseDto>;
    abstract getPartnerOnboarding(userId: string): Promise<GetPartnerOnboardingResponseDto>;
    abstract getPartnerStoreDetail(
        userId: string,
        storeId: string,
    ): Promise<GetPartnerStoreDetailResponseDto>;
    abstract getSlugAvailability(
        userId: string,
        slug: string | undefined,
        excludeStoreId?: string,
    ): Promise<SlugAvailabilityResponseDto>;
    abstract getStoreDetail(slug: string, userId?: string): Promise<GetStoreDetailResponseDto>;
    abstract listPartnerStores(userId: string): Promise<ListPartnerStoresResponseDto>;
    abstract listStorePrograms(slug: string): Promise<ListStoreProgramsResponseDto>;
    abstract listStoreReviews(
        slug: string,
        query: ListStoreReviewsQueryDto,
    ): Promise<ListStoreReviewsResponseDto>;
    abstract listStores(query: ListStoresQueryDto): Promise<ListStoresResponseDto>;
}
