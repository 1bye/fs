import {
    AISuggestionExecutorConfig,
    AISuggestionExecutorRunOutput,
    IAISuggestion,
    IAISuggestionExecutor
} from "@services/ai/suggestion/types";

export class AISuggestionExecutor implements IAISuggestionExecutor {
    config: AISuggestionExecutorConfig;

    constructor(config: AISuggestionExecutorConfig) {
        this.config = config;
    }

    async run(suggestions: IAISuggestion[]): Promise<AISuggestionExecutorRunOutput> {
        const errors: AISuggestionExecutorRunOutput["errors"] = {};
        let success: boolean = true;

        await Promise.all(suggestions.map(async _suggestion => {
            const suggestion = _suggestion.getSuggestion();
            const args = suggestion.args;

            const exec = this.config?.types?.[suggestion?.type];
            console.log(exec)
            try {
                if (exec) {
                    const fn = (exec as any)?.[suggestion.task] as Function;

                    if (typeof fn === "function") {
                        if (Array.isArray(args)) {
                            await fn.bind(exec)(...args);
                        } else {
                            await fn.bind(exec)(args);
                        }
                    } else {
                        throw new Error(`Suggestion task is not function, in ${suggestion?.type} as ${suggestion?.task}`);
                    }
                } else {
                    throw new Error(`Failed to run suggestion executor, not found suggestion type ${suggestion?.type}`);
                }
            } catch (e) {
                errors[suggestion?.type] = e as Error;
                success = false;
            }
        }));

        return {
            errors,
            success
        }
    }
}