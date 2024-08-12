import { type LoadEvent, type RequestEvent } from "@sveltejs/kit";
import { authedFetch } from "$lib/server/fetch";
import { PUBLIC_SERVER_URL } from "$env/static/public";
import type { BaseTreeStorage } from "$lib/types/storage";

export async function load({ cookies, fetch, depends }: LoadEvent & RequestEvent) {
    const data = await authedFetch<BaseTreeStorage>({
        cookies: cookies,
        fetch,
        url: `${PUBLIC_SERVER_URL}/v1/storage?format=tree`,
    });

    depends("storage:refresh");

    return {
        storage: data.data
    }
}