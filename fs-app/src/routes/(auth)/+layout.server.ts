import { type LoadEvent, redirect, type RequestEvent } from "@sveltejs/kit";
import authConfig from "$lib/config/auth.config";
import { PUBLIC_SERVER_URL } from "$env/static/public";

export async function load({ cookies, fetch, setHeaders }: LoadEvent & RequestEvent) {
    const accessToken = cookies.get(authConfig.accessTokenCookieName);
    const refreshToken = cookies.get(authConfig.refreshTokenCookieName);

    if (!accessToken && !refreshToken) {
        redirect(302, "/");
    }

    if (!accessToken) {
        const res = await fetch(`${PUBLIC_SERVER_URL}/v1/auth/refresh-token`, {
            method: "GET",
            credentials: "include"
        });

        if (!res.ok) {
            redirect(302, "/");
        }

        const setCookieHeader = res.headers.get("set-cookie");

        if (setCookieHeader) {
            const cookiesArray = setCookieHeader.split(",").map(cookie => cookie.trim());

            cookiesArray.forEach(cookieStr => {
                const [nameValue, ...rest] = cookieStr.split(";");
                const [name, value] = nameValue.split("=");

                // Collect options for the cookie
                const options: Record<string, any> = {};
                rest.forEach(option => {
                    const [key, val] = option.trim().split("=");
                    options[key.toLowerCase()] = val ? val.trim() : true;
                });

                cookies.set(name, value, options);
            });
        }
    }
}