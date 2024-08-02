import { AppContent } from "@app/types/app";
import authConfig from "@config/auth.config";
import { unauthorized } from "@app/server/response/error";

export async function handleSession(ctx: AppContent) {
    const authCookie = ctx.cookie[authConfig.sessionCookieName];

    if (!authCookie) {
        throw unauthorized();
    }

    
}