export function isJson(json: string) {
    try {
        return !!JSON.parse(json);
    } catch (e) {
        return false;
    }
}

export function safeParse<T = object>(str: string | undefined | null): T | null {
    try {
        return str ? JSON.parse(str) as T : null;
    } catch (e) {
        return null;
    }
}

export function asJson(code: string): string {
    if (isJson(code)) {
        return JSON.stringify(JSON.parse(code), null, 2);
    }
    return code;
}