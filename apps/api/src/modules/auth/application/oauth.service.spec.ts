import { User } from '../domain/entities/user.entity';
import { UserRepository } from '../domain/repositories/user.repository';
import { OAuthService } from './oauth.service';

const now = new Date('2026-06-15T00:00:00.000Z');
const user = new User(
    'user-id',
    'oauth@example.com',
    'OAuth User',
    null,
    false,
    true,
    'ACTIVE',
    now,
    now,
);
const uniqueError = Object.assign(new Error('Unique constraint'), { code: 'P2002' });

function makeUsers(): jest.Mocked<UserRepository> {
    return {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findByOAuth: jest.fn(),
        create: jest.fn(),
        createWithConsents: jest.fn(),
        linkOAuth: jest.fn(),
        createWithOAuth: jest.fn(),
        updatePasswordAndRevokeTokens: jest.fn(),
    };
}

describe('OAuthService', () => {
    it('returns the concurrently created OAuth user when user creation hits P2002', async () => {
        const users = makeUsers();
        users.findByOAuth.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
        users.findByEmail.mockResolvedValue(null);
        users.createWithOAuth.mockRejectedValue(uniqueError);

        const result = await new OAuthService(users).findOrCreateUser(
            'kakao',
            'provider-id',
            user.email,
            user.nickname,
        );

        expect(result.userId).toBe(user.id);
        expect(users.findByOAuth).toHaveBeenCalledTimes(2);
    });

    it('returns the concurrently linked OAuth user when account linking hits P2002', async () => {
        const users = makeUsers();
        users.findByOAuth.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
        users.findByEmail.mockResolvedValue(user);
        users.linkOAuth.mockRejectedValue(uniqueError);

        const result = await new OAuthService(users).findOrCreateUser(
            'google',
            'provider-id',
            user.email,
            user.nickname,
        );

        expect(result.userId).toBe(user.id);
        expect(users.findByOAuth).toHaveBeenCalledTimes(2);
    });

    it('rethrows a P2002 when no matching OAuth account exists', async () => {
        const users = makeUsers();
        users.findByOAuth.mockResolvedValue(null);
        users.findByEmail.mockResolvedValue(null);
        users.createWithOAuth.mockRejectedValue(uniqueError);

        await expect(
            new OAuthService(users).findOrCreateUser(
                'google',
                'provider-id',
                user.email,
                user.nickname,
            ),
        ).rejects.toBe(uniqueError);
    });
});
