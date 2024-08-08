import { AISuggestionConfig, IAISuggestion, Suggestion, SuggestionArgs } from "@services/ai/suggestion/types";

export class AISuggestion<Args extends SuggestionArgs = SuggestionArgs> implements IAISuggestion {
    config: AISuggestionConfig;

    constructor(config: AISuggestionConfig<Args>) {
        this.config = config;
    }

    getSuggestion<Args extends SuggestionArgs = SuggestionArgs>(): Suggestion<Args> {
        return this.config.suggestion as Suggestion<Args>;
    }
}