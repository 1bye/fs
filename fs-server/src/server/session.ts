import { AppContent } from "@app/types/app";
import authConfig from "@config/auth.config";
import { unauthorized } from "@app/server/response/error";
import { supabase } from "@apps/supabase";
import serverConfig from "@config/server.config";

export async function handleSession(ctx: AppContent) {
    const accessToken = ctx.cookie[authConfig.accessTokenCookieName];
    const refreshToken = ctx.cookie[authConfig.refreshTokenCookieName];

    if (!accessToken && !refreshToken) {
        throw unauthorized();
    }

    if (!accessToken.value) {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken.value as string,
        })

        if (!data.session || !data.user) {
            throw unauthorized(new Error("Failed to get user session"));
        }

        if (error) {
            throw unauthorized(new Error("Failed to refresh user session"));
        }

        ctx.cookie[authConfig.accessTokenCookieName].set({
            httpOnly: true,
            secure: serverConfig.production,
            value: data.session.access_token,
            maxAge: data.session?.expires_in ?? 3600,
        });

        ctx.cookie[authConfig.refreshTokenCookieName].set({
            httpOnly: true,
            secure: serverConfig.production,
            value: data.session.refresh_token,
            maxAge: authConfig.refreshTokenExpiresAfter
        });

        return {
            user: data.user
        }
    } else {
        const { data, error } = await supabase.auth.getUser(accessToken.value);

        if (!data.user) {
            throw unauthorized(new Error("Failed to get user"));
        }

        if (error) {
            throw unauthorized(new Error("Failed to get user from session"));
        }

        return {
            user: data.user
        }
    }
}