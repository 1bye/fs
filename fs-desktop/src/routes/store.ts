import type { Suggestion } from "$lib/types/server"
import { writable, type Writable } from "svelte/store";
import { FSWatcher } from "$lib/watch"
import type { FileProcessLog } from "$lib/storage/ws/events/file-process"

export interface FSStore {
    suggestions: Suggestion[];
    fsWatcher?: FSWatcher;
    fileProcessLogs: Record<string, FileProcessLog>;
    logs: FSLog[]
}

export type FSLog = {
    ts: number;
} & ({
    type: "storage";
    event: "move" | "rename" | "delete" | "add";
    paths: string[];
} | {
    type: "app";
    event: "error";
    error: Error;
})

export function createFSStore({ fsWatcher }: {
    fsWatcher?: FSWatcher;
}): Writable<FSStore> {
    return writable<FSStore>({
        suggestions: [],
        fsWatcher,
        fileProcessLogs: {},
        logs: []
    })
}