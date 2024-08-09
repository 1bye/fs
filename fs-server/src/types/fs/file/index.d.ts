export interface FSFile {
    name: string;
    size: number;
    content_type?: string | null;
    path: string;

    user_id: string;

    ai: {
        suggestions: {
            tasks: string[];
            lastSuggestedAt?: string;
        }
    };

    tags: string[];

    created_at: string;
    updated_at: string;
}

export interface FSFileTag {
    user_id: string;
    name: string;

    created_at: string;
    updated_at: string;
}