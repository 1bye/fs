export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
    }
}

export function unauthorized() {
    throw new UnauthorizedError();
}