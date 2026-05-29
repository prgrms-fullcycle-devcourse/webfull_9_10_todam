import type { UserStatus } from '@prisma/client';

export interface RequestUser {
    id: string;
    status: UserStatus;
}
