import { type Cookies, redirect, type RequestEvent } from "@sveltejs/kit";
import cookie from "cookie";
import authConfig from "$lib/config/auth.config";
import { PUBLIC_DOMAIN, PUBLIC_ENV, PUBLIC_SERVER_URL } from "$env/static/public";

export async function getSessionCookies({ cookies, fetch }: {
    cookies: Cookies;
    fetch: RequestEvent["fetch"]
}) {
    const refreshToken = cookies.get(authConfig.refreshTokenCookieName);
    let accessToken = cookies.get(authConfig.accessTokenCookieName);

    if (!accessToken && !refreshToken) {
        redirect(302, "/");
    }

    if (!accessToken) {
        const { newCookies } = await refreshSession({
            cookies,
            refreshToken: refreshToken as string,
            fetch
        })

        if (newCookies[authConfig.accessTokenCookieName]) {
            accessToken = newCookies[authConfig.accessTokenCookieName];
        }
    }

    if (!accessToken) {
        console.log("Failed to refresh session cookies, again");
        redirect(302, "/");
    }

    return [
        cookie.serialize(authConfig.refreshTokenCookieName, refreshToken as string, {
            path: "/",
            domain: PUBLIC_DOMAIN,
            httpOnly: true,
            secure: PUBLIC_ENV === "production"
        }),
        cookie.serialize(authConfig.accessTokenCookieName, accessToken as string, {
            path: "/",
            domain: PUBLIC_DOMAIN,
            httpOnly: true,
            secure: PUBLIC_ENV === "production"
        }),
    ].join("; ")
}

export function removeSession(cookies: Cookies) {
    cookies.delete(authConfig.accessTokenCookieName, {
        path: "/"
    })
    cookies.delete(authConfig.refreshTokenCookieName, {
        path: "/"
    })
}

export async function refreshSession({ cookies, refreshToken, fetch }: {
    cookies: Cookies;
    refreshToken: string;
    fetch: RequestEvent["fetch"]
}) {
    const newCookies: Record<string, string> = {};

    const res = await fetch(`${PUBLIC_SERVER_URL}/v1/auth/refresh-token`, {
        method: "GET",
        headers: {
            "Cookie": cookie.serialize(authConfig.refreshTokenCookieName, refreshToken as string, {
                path: "/",
                domain: PUBLIC_DOMAIN,
                httpOnly: true,
                secure: PUBLIC_ENV === "production"
            }),
            "Origin": PUBLIC_DOMAIN
        }
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
            const options: Record<string, unknown> = {};
            rest.forEach(option => {
                const [key, val] = option.trim().split("=");
                options[key.toLowerCase()] = val ? val.trim() : true;
            });

            newCookies[name] = value;

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            cookies.set(name, value, options);
        });
    }

    return {
        newCookies
    }
}