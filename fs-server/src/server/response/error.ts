export function unauthorized(e?: Error | Record<string, Error>) {
    const _e = Object.getPrototypeOf(e).name === "Error" ? {
        default: e
    } : e;

    return new JsonError({
        status: 401,
        errors: _e ?? "Unauthorized"
    })
}

export class JsonError<T = {
    status: number;
    errors: Record<string, Error>;
}> extends Error {
    msg: T;

    constructor(message: T) {
        super(JSON.stringify(message));
        this.msg = message;
    }

    toJson() {
        return this.msg;
    }
}


export function jsonError(e: Error | Record<string, Error>, status: number = 400) {
    return new JsonError({
        status,
        errors: Object.getPrototypeOf(e).name === "Error" ? {
            default: e
        } : e
    })
}