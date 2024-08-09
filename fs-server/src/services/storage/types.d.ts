import { Firestore } from "firebase/firestore";
import { FSFileTag } from "@app/types/fs/file";

export interface IStorage {
    config: StorageConfig;
    db: Firestore;

    getAllTags(): Promise<FSFileTag[]>;
}

export interface StorageConfig {
    db?: Firestore;
    userId: string;
}