import { AuthConfig } from "@config/types/auth";

export default {
    accessTokenCookieName: "nfs-access-token",
    refreshTokenCookieName: "nfs-refresh-token",

    /**
     * 30 Days
     */
    refreshTokenExpiresAfter: (3600 * 24) * 30
} as AuthConfig;