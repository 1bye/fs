export interface AuthConfig {
    accessTokenCookieName: string;
    refreshTokenCookieName: string;

    refreshTokenExpiresAfter: number;

    jwtSecret: string;
}