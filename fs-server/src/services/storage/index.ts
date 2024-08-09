import { IStorage, StorageConfig } from "@services/storage/types";
import { collection, Firestore, getDocs, query, where } from "firebase/firestore";
import { FSFileTag } from "@app/types/fs/file";
import { firestore } from "@apps/firebase";

export class Storage implements IStorage {
    config: StorageConfig;
    db: Firestore;

    constructor(config: StorageConfig) {
        this.config = config;
        this.db = this.config.db ?? firestore;
    }

    async getAllTags(): Promise<FSFileTag[]> {
        return await getDocs(
            query(
                collection(this.db, "file_tags"),
                where("user_id", "==", this.config.userId)
            )
        ).then(_ =>
            _.docs.map(doc => doc.data() as FSFileTag)
        );
    }
}