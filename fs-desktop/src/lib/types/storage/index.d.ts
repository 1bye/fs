import type { AIStorageFileTasks } from "$lib/types/storage/ai";

export interface BaseTreeStorage {
    files: StorageTreeRoot;
    tags: StorageFileTag[];
}

export interface StorageFile {
    id?: string;
    name: string;
    size: number;
    content_type?: string | null;
    path: string;

    user_id: string;

    ai: {
        suggestions: {
            tasks: AIStorageFileTasks[];
            last_suggested_at?: string;
        }
    };

    tags: StorageFileTag[];

    created_at: string;
    updated_at: string;
}

export interface StorageFileTag {
    user_id: string;
    name: string;

    created_at: string;
    updated_at: string;
}

export type StorageTreeRoot = (StorageTreeFile | StorageTreeFolder)[];

export interface StorageTreeFile {
    type: "file";
    data: StorageFile;
}

export interface StorageTreeFolder {
    type: "folder";

    path: string;
    name: string;
    /**
     * Sum of sizes of files/folders in it
     */
    size: number;

    /**
     * All tags of child files/folders
     */
    tags: StorageFileTag[];

    tagCount: Record<string, number>

    items: StorageTreeRoot
}