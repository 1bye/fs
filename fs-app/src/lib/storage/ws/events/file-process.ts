import type { IReaderEvent } from "$lib/utils/ws/reader";
import type { BaseWebSocketEvent } from "$lib/types/server";
import type { AIStorageFileTasks } from "$lib/types/storage/ai";

export type FileProcessLog = {
    file: string;
    fileId: string;
    suggestions: {
        tasks: AIStorageFileTasks[];
    };
    started_at: string;
    updated_at: string;
    process: string;
    currentStep: string;
}

type WSEventFileProcessCallback = (data: Record<string, FileProcessLog>) => void;

export class WSEventFileProcess implements IReaderEvent {
    name: string = "file:process";
    cb: WSEventFileProcessCallback;

    constructor(cb: WSEventFileProcessCallback) {
        this.cb = cb;
    }

    run(data: BaseWebSocketEvent<"file:process", Record<string, FileProcessLog>>) {
        this.cb(data.data);
    }
}