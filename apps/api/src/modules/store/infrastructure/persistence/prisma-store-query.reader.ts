import { Injectable } from '@nestjs/common';
import { StoreQueryReader } from '../../domain/repositories/store-query.reader';
import type { ListStoreReviewsQueryDto } from '../../presentation/dto/list-store-reviews.dto';
import type { ListStoresQueryDto } from '../../presentation/dto/list-stores.dto';
import { PrismaAutocompleteStoresReader } from './prisma-autocomplete-stores.reader';
import { PrismaPartnerOnboardingReader } from './prisma-partner-onboarding.reader';
import { PrismaPartnerStoreDetailReader } from './prisma-partner-store-detail.reader';
import { PrismaPartnerStoresReader } from './prisma-partner-stores.reader';
import { PrismaSlugAvailabilityReader } from './prisma-slug-availability.reader';
import { PrismaStoreDetailReader } from './prisma-store-detail.reader';
import { PrismaStoreProgramsReader } from './prisma-store-programs.reader';
import { PrismaStoreReviewsReader } from './prisma-store-reviews.reader';
import { PrismaStoresReader } from './prisma-stores.reader';

@Injectable()
export class PrismaStoreQueryReader extends StoreQueryReader {
    constructor(
        private readonly autocompleteReader: PrismaAutocompleteStoresReader,
        private readonly onboardingReader: PrismaPartnerOnboardingReader,
        private readonly partnerDetailReader: PrismaPartnerStoreDetailReader,
        private readonly partnerStoresReader: PrismaPartnerStoresReader,
        private readonly slugReader: PrismaSlugAvailabilityReader,
        private readonly detailReader: PrismaStoreDetailReader,
        private readonly programsReader: PrismaStoreProgramsReader,
        private readonly reviewsReader: PrismaStoreReviewsReader,
        private readonly storesReader: PrismaStoresReader,
    ) {
        super();
    }

    autocomplete(keyword: string | undefined) {
        return this.autocompleteReader.execute(keyword);
    }

    getPartnerOnboarding(userId: string) {
        return this.onboardingReader.execute(userId);
    }

    getPartnerStoreDetail(userId: string, storeId: string) {
        return this.partnerDetailReader.execute(userId, storeId);
    }

    getSlugAvailability(userId: string, slug: string | undefined, excludeStoreId?: string) {
        return this.slugReader.execute(userId, slug, excludeStoreId);
    }

    getStoreDetail(slug: string, userId?: string) {
        return this.detailReader.execute(slug, userId);
    }

    listPartnerStores(userId: string) {
        return this.partnerStoresReader.execute(userId);
    }

    listStorePrograms(slug: string) {
        return this.programsReader.execute(slug);
    }

    listStoreReviews(slug: string, query: ListStoreReviewsQueryDto) {
        return this.reviewsReader.execute(slug, query);
    }

    listStores(query: ListStoresQueryDto) {
        return this.storesReader.execute(query);
    }
}
