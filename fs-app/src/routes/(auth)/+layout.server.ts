import { type LoadEvent, redirect, type RequestEvent } from "@sveltejs/kit";
import authConfig from "$lib/config/auth.config";
import { refreshSession } from "$lib/server/session";

export async function load({ cookies, fetch }: LoadEvent & RequestEvent) {
    const accessToken = cookies.get(authConfig.accessTokenCookieName);
    const refreshToken = cookies.get(authConfig.refreshTokenCookieName);

    if (!accessToken && !refreshToken) {
        redirect(302, "/");
    }

    if (!accessToken) {
        await refreshSession({
            refreshToken: refreshToken as string,
            cookies,
            fetch
        })
    }
}