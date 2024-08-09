// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, DocumentSnapshot, DocumentReference, getDoc } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCe6X3ULofCpRwzVKvwcDNAIObrgT2T_wc",
    authDomain: "spending-money-762d0.firebaseapp.com",
    databaseURL: "https://spending-money-762d0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spending-money-762d0",
    storageBucket: "spending-money-762d0.appspot.com",
    messagingSenderId: "616872193290",
    appId: "1:616872193290:web:0ea7be3bea9bc54f351ef3",
    measurementId: "G-WKM6YHGR1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const db = getDatabase(app);

type FirestoreData = { [key: string]: any };

interface UnwrapOptions {
    unwrapNested?: boolean; // Whether to unwrap nested references, default is false
    maxDepth?: number;      // Maximum depth for unwrapping, default is -1 (infinite)
}

async function unwrapReferences<T extends FirestoreData>(
    docSnapshot: DocumentSnapshot<T>,
    options: UnwrapOptions = { unwrapNested: false, maxDepth: -1 }
): Promise<T> {
    const { unwrapNested, maxDepth } = options;

    const unwrap = async (data: any, depth: number): Promise<any> => {
        if (depth > maxDepth && maxDepth !== -1) {
            return data;
        }

        const promises = Object.entries(data).map(async ([key, value]) => {
            if (value instanceof DocumentReference) {
                const refDoc = await getDoc(value);
                const unwrappedValue = refDoc.exists() ? refDoc.data() : null;

                if (unwrapNested && unwrappedValue) {
                    return [key, await unwrap(unwrappedValue, depth + 1)];
                }

                return [key, unwrappedValue];
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                return [key, await unwrap(value, depth + 1)];
            } else if (Array.isArray(value)) {
                const unwrappedArray = await Promise.all(
                    value.map(async (item) => (item instanceof DocumentReference ? unwrap(item, depth + 1) : item))
                );
                return [key, unwrappedArray];
            }
            return [key, value];
        });

        const unwrappedData = await Promise.all(promises);
        return Object.fromEntries(unwrappedData);
    };

    const data = docSnapshot.data();
    if (!data) {
        throw new Error('Document has no data');
    }

    return unwrap(data, 0) as T;
}

export {
    app,
    firestore,
    db,
    unwrapReferences
}