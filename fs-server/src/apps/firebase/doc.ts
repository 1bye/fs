import { firestore } from ".";
import { setDoc, getDoc, deleteDoc, updateDoc, collection, DocumentReference, addDoc } from "firebase/firestore";


interface DocOptions {
    merge?: boolean; // Used to specify merge behavior when setting documents
}

export class Doc<T> {
    private collectionPath: string;
    private options: DocOptions;
    private ref: DocumentReference | null = null;

    constructor(collectionPath: string, options: DocOptions = {}) {
        this.collectionPath = collectionPath;
        this.options = options;
    }

    // Add a new document to the collection
    async add(data: T): Promise<DocumentReference> {
        const collectionRef = collection(firestore, this.collectionPath);
        const docRef = await addDoc(collectionRef, data);
        this.ref = docRef; // Save the reference to the newly added document
        return docRef;
    }

    // Set (add or update) a document
    async set(data: T, docRef?: DocumentReference): Promise<void> {
        const ref = docRef || this.ref;
        if (!ref) {
            throw new Error("Document reference is not set. Use the add method to create a document or pass a reference.");
        }
        if (this.options.merge) {
            await setDoc(ref, data, { merge: true });
        } else {
            await setDoc(ref, data);
        }
    }

    // Update specific fields in a document
    async update(data: Partial<T>, docRef?: DocumentReference): Promise<void> {
        const ref = docRef || this.ref;
        if (!ref) {
            throw new Error("Document reference is not set. Use the add method to create a document or pass a reference.");
        }
        await updateDoc(ref, data);
    }

    // Delete a document
    async delete(docRef?: DocumentReference): Promise<void> {
        const ref = docRef || this.ref;
        if (!ref) {
            throw new Error("Document reference is not set. Use the add method to create a document or pass a reference.");
        }
        await deleteDoc(ref);
    }

    // Get a document
    async get(docRef?: DocumentReference): Promise<T | undefined> {
        const ref = docRef || this.ref;
        if (!ref) {
            throw new Error("Document reference is not set. Use the add method to create a document or pass a reference.");
        }
        const docSnapshot = await getDoc(ref);
        if (docSnapshot.exists()) {
            return docSnapshot.data() as T;
        } else {
            return undefined;
        }
    }
}
