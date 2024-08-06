import { AuthConfig } from "@config/types/auth";
import { env } from "@utils/env";

export default {
    accessTokenCookieName: "nfs-access-token",
    refreshTokenCookieName: "nfs-refresh-token",

    /**
     * 30 Days
     */
    refreshTokenExpiresAfter: (3600 * 24) * 30,

    jwtSecret: env("JWT_SECRET"),
} as AuthConfig;