import { doc, runTransaction, collection, getDocs, updateDoc, query, where, Firestore, DocumentReference } from "firebase/firestore";
import { StorageFilesConfig, IStorageFile } from "@services/file/storage/types";
import { firestore } from "@apps/firebase";
import { FSFileTag } from "@app/types/fs/file";

export class StorageFile implements IStorageFile {
    db: Firestore;
    config: StorageFilesConfig;

    constructor(config: StorageFilesConfig) {
        this.config = config;
        this.db = this.config?.db ?? firestore;
    }

    async tagFile({ tags, fileRef }: {
        tags: string[];
        fileRef?: DocumentReference;
    }): Promise<void> {
        const ref = fileRef ?? this.config.fileRef;

        if (!ref) {
            throw new Error("Not found ref to file!");
        }

        const date = new Date().toISOString();
        const docTags = await getDocs(
            query(collection(this.db, "file_tags"), where("user_id", "==", this.config.userId))
        ).then(_ =>
            Object.fromEntries(
                _.docs.map(doc => [doc.id, doc.data()])
            )
        ) as Record<string, FSFileTag>;

        const _tagRefs = await runTransaction(this.db, async tr => {
            const tagRefs: DocumentReference[] = [];

            for (const tag of tags) {
                const exists = Object.entries(docTags).find(([, val]) => val.name === tag);

                if (!exists) {
                    const tagRef = doc(collection(this.db, "file_tags"));

                    tr.set(tagRef, {
                        name: tag,
                        created_at: date,
                        updated_at: date,
                        user_id: this.config.userId
                    } as FSFileTag);
                    tagRefs.push(tagRef);
                } else {
                    const existingTagRef = doc(this.db, "file_tags", exists[0]);
                    tagRefs.push(existingTagRef);
                }
            }

            return tagRefs;
        })

        await updateDoc(ref, {
            // tags: _tagRefs.map(_ => _.id),
            tags: _tagRefs,
            updated_at: date
        })
    }
}
