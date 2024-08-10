import { DocumentReference } from "firebase/firestore";
import { AvailableTasks } from "@services/ai/tasks/types";

export interface FSFile {
    id?: string;
    name: string;
    size: number;
    content_type?: string | null;
    path: string;

    user_id: string;

    ai: {
        suggestions: {
            tasks: AvailableTasks[];
            last_suggested_at?: string;
        }
    };

    tags: FSFileTag[];

    created_at: string;
    updated_at: string;
}

export interface FSFileRaw extends Omit<FSFile, "tags"> {
    tags: DocumentReference[];
}

export interface FSFileTag {
    user_id: string;
    name: string;

    created_at: string;
    updated_at: string;
}