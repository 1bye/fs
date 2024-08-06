export function pureJson(statusMessage: string | object, status: number = 200, headers?: HeadersInit) {
    return new Response(JSON.stringify(statusMessage), {
        status,
        statusText: statusMessage.toString(),
        // @ts-ignore
        headers: {
            "Content-Type": "application/json",
            ...(headers ?? {})
        }
    })
}

export function json(statusMessage: string | object, status: number = 200, headers?: HeadersInit) {
    return new Response(JSON.stringify({
        status,
        data: statusMessage,
        errors: {}
    }), {
        status,
        statusText: statusMessage.toString(),
        // @ts-ignore
        headers: {
            "Content-Type": "application/json",
            ...(headers ?? {})
        }
    })
}

export function png(body: BodyInit) {
    return new Response(body, {
        headers: {
            "Content-Type": "image/png"
        }
    })
}

export function redirect(location: string, status: number = 302, headers: HeadersInit = {}) {
    // @ts-ignore
    return new Response(null, {
        status,
        statusText: "No Content",
        headers: {
            "Location": location,
            ...headers
        }
    })
}
