export class EnvError extends Error {
    name: string;

    constructor(name: string) {
        super(`Env variable is required: ${name}`);
        this.name = name;
    }
}

export function env(name: string): string {
    const _var = process.env[name];

    if (!_var) {
        throw new EnvError(name);
    }

    return _var as string;
}
