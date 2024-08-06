import type { RequestEvent } from "@sveltejs/kit";
import { PUBLIC_SERVER_URL } from "$env/static/public";

export async function load({ fetch }: RequestEvent) {
    const res = await fetch(`${PUBLIC_SERVER_URL}/v1/user`);

    return {
        user: await res.json()
    };
}