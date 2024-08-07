export function handleErrors({ error, code }: {
    code: string;
    error: Error;
}) {
    switch (code) {
        case "JsonError": {
            const data = (error as JsonError).toJson();
            return Response.json(data, {
                status: data.status
            })
        }
    }
    return error;
}

export function unauthorized(e?: Error | string) {
    return new JsonError({
        status: 401,
        error: e ?? "Unauthorized"
    })
}

type BaseResponse = {
    status: number;
    data?: unknown;
    error: Error | string;
};

export class JsonError<T extends BaseResponse = BaseResponse> extends Error {
    msg: T;

    constructor(message: T) {
        super(JSON.stringify(message));
        this.msg = message;
    }

    toJson() {
        return {
            status: this.msg.status,
            errors: this.msg.error instanceof Error ? this.msg.error.message : this.msg.error,
        };
    }
}


export function jsonError(e: Error | string, status: number = 400) {
    return new JsonError({
        status,
        error: e
    })
}

export const ERRORS = {
    JsonError: JsonError
};