import { AISuggestionConfig, IAISuggestion, Suggestion } from "@services/ai/suggestion/types";

export class AISuggestion implements IAISuggestion {
    config: AISuggestionConfig;

    constructor(config: AISuggestionConfig) {
        this.config = config;
    }

    getSuggestion(): Suggestion {
        return this.config.suggestion;
    }
}