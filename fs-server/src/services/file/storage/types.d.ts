import { DocumentReference, Firestore } from "firebase/firestore";

export interface IStorageFile {
    config: StorageFilesConfig;
    db: Firestore;

    tagFile(params: {
        tags: string[];
        fileRef?: DocumentReference;
    }): Promise<void>;
}

export interface StorageFilesConfig {
    fileRef?: DocumentReference;
    db?: Firestore;
    userId: string;
}