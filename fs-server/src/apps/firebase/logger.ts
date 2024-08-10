import { db } from ".";
import { update, ref, remove } from "firebase/database";

export class DBLogger<T> {
    private path: string;
    private ref: any;
    private promises: Promise<void>[];

    constructor(path: string) {
        this.path = path;
        this.ref = ref(db, this.path);
        this.promises = [];
    }

    log(data: Partial<T>): void {
        const updatePromise = update(this.ref, data);
        this.promises.push(updatePromise);
    }

    async close(): Promise<void> {
        // Wait for all log promises to resolve
        await Promise.all(this.promises);

        // Remove the entry from the database
        await remove(this.ref);
    }
}