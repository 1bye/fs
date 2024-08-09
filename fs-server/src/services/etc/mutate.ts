export class MutateMap<T extends Record<string, any>> extends Map<keyof T, T[keyof T]> {
    constructor(data: T) {
        super(Object.entries(data) as [keyof T, T[keyof T]][]);
    }

    get<K extends keyof T>(key: K): T[K] {
        return super.get(key) as T[K];
    }

    set<K extends keyof T>(key: K | (string | number)[], value: any): this {
        if (Array.isArray(key)) {
            this.setDeep(key, value);
        } else {
            super.set(key, value);
        }
        return this;
    }

    private setDeep(path: (string | number)[], value: any) {
        let obj = this.get(path[0] as keyof T);
        if (typeof obj !== 'object' || obj === null) {
            throw new Error("Cannot set value on a non-object type");
        }

        let current: any = obj;
        for (let i = 1; i < path.length - 1; i++) {
            if (!(path[i] in current)) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }

        current[path[path.length - 1]] = value;
    }

    toObject(): T {
        const obj = {} as T;
        for (const [key, value] of this) {
            if (value instanceof MutateMap) {
                obj[key] = value.toObject();
            } else {
                obj[key] = value;
            }
        }
        return obj;
    }

    extend<U extends Record<string, any>>(newData: U): MutateMap<T & U> {
        // Merge the current data with the new data
        const mergedData = { ...this.toObject(), ...newData };
        // Return a new MutateMap with the merged data
        return new MutateMap<T & U>(mergedData);
    }
}

export type ToMutateMap<T extends Record<string, any>> = MutateMap<T>;
