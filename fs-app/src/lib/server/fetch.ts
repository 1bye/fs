import { type Cookies, redirect, type RequestEvent } from "@sveltejs/kit";
import { getSessionCookies, removeSession } from "$lib/server/session";
import type { ServerBaseResponse } from "$lib/types/server";
import { PUBLIC_DOMAIN } from "$env/static/public";

export type AuthedFetchParams = {
    cookies: Cookies;
    fetch: RequestEvent["fetch"];
    url: Parameters<RequestEvent["fetch"]>[0];
    options?: Parameters<RequestEvent["fetch"]>[1];
}

// Overloads for authedFetch to return the correct type based on parseTo
export async function authedFetch<T extends object = object>(params: AuthedFetchParams & {
    parseTo?: "json";
}): Promise<ServerBaseResponse<T>>;

export async function authedFetch(params: AuthedFetchParams & {
    parseTo: "text";
}): Promise<string>;

export async function authedFetch(params: AuthedFetchParams & {
    parseTo: "formdata";
}): Promise<FormData>;

export async function authedFetch(params: AuthedFetchParams & {
    parseTo: "stream";
}): Promise<ReadableStream<Uint8Array> | null>;

export async function authedFetch({ url, fetch, options, cookies, parseTo = "json" }: AuthedFetchParams & {
    parseTo?: "json" | "text" | "formdata" | "stream";
}) {
    // Step 1: Retrieve the session cookies
    const sessionCookies = await getSessionCookies({
        cookies,
        fetch,
    });

    const _options = options ?? {};

    // Step 2: Attach the session cookies to the request headers
    _options.headers = {
        ..._options.headers,
        "Cookie": sessionCookies,
        "Origin": PUBLIC_DOMAIN
    };

    // Step 3: Make the fetch request
    const response = await fetch(url, _options);

    if (!response.ok) {
        if (response.status === 419) {
            removeSession(cookies)
            redirect(302, "/?error-message=Session+is+expired")
        }
    }

    // Step 4: Parse the response based on the 'parseTo' parameter
    switch (parseTo) {
        case "json":
            return response.json(); // inferred type: Promise<any>
        case "text":
            return response.text(); // inferred type: Promise<string>
        case "formdata":
            return response.formData(); // inferred type: Promise<FormData>
        case "stream":
            return response.body; // inferred type: Promise<ReadableStream<Uint8Array> | null>
        default:
            return response.json(); // inferred type: Promise<any>
    }
}
