/// <reference types="jest" />
import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

type ControllerClass = new (...args: never[]) => unknown;

const REQUEST_METHOD_NAMES: Record<number, string> = {
    [RequestMethod.GET]: 'GET',
    [RequestMethod.POST]: 'POST',
    [RequestMethod.PUT]: 'PUT',
    [RequestMethod.DELETE]: 'DELETE',
    [RequestMethod.PATCH]: 'PATCH',
};

jest.mock('@todam/config', () => ({
    createApiEnv: () => ({
        AWS_REGION: 'ap-northeast-2',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        S3_BUCKET: 'test-bucket',
        CDN_BASE_URL: 'https://cdn.example.com',
    }),
}));

function controllers(): ControllerClass[] {
    const { AuthController } = jest.requireActual<
        typeof import('./auth/presentation/controllers/auth.controller')
    >('./auth/presentation/controllers/auth.controller');
    const { HealthController } = jest.requireActual<typeof import('./health/health.controller')>(
        './health/health.controller',
    );
    const { StoreController } = jest.requireActual<
        typeof import('./store/presentation/controllers/store.controller')
    >('./store/presentation/controllers/store.controller');
    const { ProgramController } = jest.requireActual<
        typeof import('./program/presentation/controllers/program.controller')
    >('./program/presentation/controllers/program.controller');
    const { TimeslotController } = jest.requireActual<
        typeof import('./timeslot/presentation/controllers/timeslot.controller')
    >('./timeslot/presentation/controllers/timeslot.controller');

    return [
        AuthController,
        HealthController,
        StoreController,
        ProgramController,
        TimeslotController,
    ];
}

function normalizePath(...parts: Array<string | string[] | undefined>): string {
    const path = parts
        .flatMap((part) => (Array.isArray(part) ? part : [part]))
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join('/');

    return `/${path}`.replace(/\/+/g, '/');
}

function guardNames(target: object): string[] {
    const guards = Reflect.getMetadata(GUARDS_METADATA, target) as
        | Array<{ name?: string }>
        | undefined;

    return (guards ?? []).map((guard) => guard.name ?? 'anonymous');
}

function collectRoutes() {
    return controllers().flatMap((controller) => {
        const controllerPath = Reflect.getMetadata(PATH_METADATA, controller) as
            | string
            | string[]
            | undefined;
        const controllerGuards = guardNames(controller);

        return Object.getOwnPropertyNames(controller.prototype)
            .filter((propertyName) => propertyName !== 'constructor')
            .flatMap((propertyName) => {
                const handler = controller.prototype[propertyName];
                const routePath = Reflect.getMetadata(PATH_METADATA, handler) as
                    | string
                    | string[]
                    | undefined;
                const method = Reflect.getMetadata(METHOD_METADATA, handler) as number | undefined;

                if (routePath === undefined || method === undefined) {
                    return [];
                }

                return {
                    controller: controller.name,
                    handler: propertyName,
                    method: REQUEST_METHOD_NAMES[method] ?? `UNKNOWN_${method}`,
                    path: normalizePath(controllerPath, routePath),
                    guards: [...controllerGuards, ...guardNames(handler)],
                };
            });
    });
}

describe('API route baseline', () => {
    it('keeps the implemented route surface stable', () => {
        expect(collectRoutes()).toEqual([
            {
                controller: 'AuthController',
                handler: 'sendCode',
                method: 'POST',
                path: '/auth/email/send-code',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'verifyCode',
                method: 'POST',
                path: '/auth/email/verify-code',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'signup',
                method: 'POST',
                path: '/auth/signup',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'login',
                method: 'POST',
                path: '/auth/login',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'refresh',
                method: 'POST',
                path: '/auth/refresh',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'logout',
                method: 'POST',
                path: '/auth/logout',
                guards: ['AuthGuard'],
            },
            {
                controller: 'AuthController',
                handler: 'resetPasswordRequest',
                method: 'POST',
                path: '/auth/password/reset-request',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'resetPassword',
                method: 'POST',
                path: '/auth/password/reset',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'kakaoOAuth',
                method: 'POST',
                path: '/auth/oauth/kakao',
                guards: [],
            },
            {
                controller: 'AuthController',
                handler: 'googleOAuth',
                method: 'POST',
                path: '/auth/oauth/google',
                guards: [],
            },
            {
                controller: 'HealthController',
                handler: 'checkDatabase',
                method: 'GET',
                path: '/health/db',
                guards: [],
            },
            {
                controller: 'HealthController',
                handler: 'checkS3',
                method: 'GET',
                path: '/health/s3',
                guards: [],
            },
            {
                controller: 'StoreController',
                handler: 'listStores',
                method: 'GET',
                path: '/stores',
                guards: [],
            },
            {
                controller: 'StoreController',
                handler: 'autocompleteStores',
                method: 'GET',
                path: '/stores/search/autocomplete',
                guards: [],
            },
            {
                controller: 'StoreController',
                handler: 'getSlugAvailability',
                method: 'GET',
                path: '/stores/slug-availability',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'getStoreDetail',
                method: 'GET',
                path: '/stores/:slug',
                guards: ['OptionalAuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'listStorePrograms',
                method: 'GET',
                path: '/stores/:slug/programs',
                guards: [],
            },
            {
                controller: 'StoreController',
                handler: 'listStoreReviews',
                method: 'GET',
                path: '/stores/:slug/reviews',
                guards: [],
            },
            {
                controller: 'StoreController',
                handler: 'listPartnerStores',
                method: 'GET',
                path: '/partner/stores',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'getPartnerOnboarding',
                method: 'GET',
                path: '/partner/onboarding',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'getPartnerStoreDetail',
                method: 'GET',
                path: '/partner/stores/:storeId',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'updateStore',
                method: 'PATCH',
                path: '/partner/stores/:storeId',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'updateBusinessDocument',
                method: 'PATCH',
                path: '/partner/stores/:storeId/business-document',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'createStore',
                method: 'POST',
                path: '/stores',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'createBusinessDocumentImage',
                method: 'POST',
                path: '/partner/business-documents/images',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'createStoreImage',
                method: 'POST',
                path: '/partner/stores/:storeId/images',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'confirmStoreImage',
                method: 'PATCH',
                path: '/partner/stores/:storeId/images/:imageId/confirm',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'deleteStoreImage',
                method: 'DELETE',
                path: '/partner/stores/:storeId/images/:imageId',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'submitStore',
                method: 'POST',
                path: '/partner/stores/:storeId/submit',
                guards: ['AuthGuard'],
            },
            {
                controller: 'StoreController',
                handler: 'toggleFavoriteStore',
                method: 'POST',
                path: '/stores/:storeId/favorite',
                guards: ['AuthGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'createProgram',
                method: 'POST',
                path: '/partner/stores/:storeId/programs',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'listPartnerStorePrograms',
                method: 'GET',
                path: '/partner/stores/:storeId/programs',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'reorderPartnerStorePrograms',
                method: 'PATCH',
                path: '/partner/stores/:storeId/programs/order',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'getProgramDetail',
                method: 'GET',
                path: '/partner/stores/:storeId/programs/:programId',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'getPublicProgramDetail',
                method: 'GET',
                path: '/stores/:slug/programs/:programId',
                guards: [],
            },
            {
                controller: 'ProgramController',
                handler: 'updateProgram',
                method: 'PATCH',
                path: '/partner/stores/:storeId/programs/:programId',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'createProgramImage',
                method: 'POST',
                path: '/partner/stores/:storeId/programs/:programId/images',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'updateProgramStatus',
                method: 'PATCH',
                path: '/partner/stores/:storeId/programs/:programId/status',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'confirmProgramImage',
                method: 'PATCH',
                path: '/partner/stores/:storeId/programs/:programId/images/:imageId/confirm',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'ProgramController',
                handler: 'deleteProgramImage',
                method: 'DELETE',
                path: '/partner/stores/:storeId/programs/:programId/images/:imageId',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'generateTimeSlots',
                method: 'POST',
                path: '/partner/stores/:storeId/time-slots/generate',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'listTimeSlots',
                method: 'GET',
                path: '/partner/stores/:storeId/time-slots',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'updateTimeSlotStatus',
                method: 'PATCH',
                path: '/partner/stores/:storeId/time-slots/:timeSlotId/status',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'createReservationRestrictions',
                method: 'POST',
                path: '/partner/stores/:storeId/reservation-restrictions',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'deleteReservationRestrictions',
                method: 'DELETE',
                path: '/partner/stores/:storeId/reservation-restrictions',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'getProgramReservationCounts',
                method: 'GET',
                path: '/partner/stores/:storeId/programs/reservation-counts',
                guards: ['AuthGuard', 'PartnerGuard'],
            },
            {
                controller: 'TimeslotController',
                handler: 'getProgramAvailableSlots',
                method: 'GET',
                path: '/programs/:programId/available-slots',
                guards: ['AuthGuard'],
            },
        ]);
    });
});
