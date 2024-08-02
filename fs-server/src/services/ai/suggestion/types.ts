export interface IAISuggestion {
    config: AISuggestionConfig;

    getSuggestion(): Suggestion;
}

export type Suggestion = {
    type: string;
    task: string;
    args: Record<string, any> | any[];
}

export interface AISuggestionConfig {
    suggestion: Suggestion;
}

export interface IAISuggestionExecutor {
    config: AISuggestionExecutorConfig;

    run(suggestions: IAISuggestion[]): Promise<AISuggestionExecutorRunOutput>
}

export interface AISuggestionExecutorConfig {
    types: Record<string, unknown>;
}

export type AISuggestionExecutorRunOutput = {
    success: boolean;
    errors?: Record<string, Error>;
}