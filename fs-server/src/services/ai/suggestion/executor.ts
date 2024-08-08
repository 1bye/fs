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

        for (const _suggestion of suggestions) {
            const suggestion = _suggestion.getSuggestion();
            const args = suggestion.args;

            if (this.config.allowedTasks && this.config.allowedTasks[suggestion?.type]) {
                const allowed = this.config.allowedTasks[suggestion?.type];
                if (!(allowed.includes(suggestion.task)))
                    throw new Error(`Following suggestion task is not allowed in type ${suggestion?.type}: ${suggestion?.task}`)
            }

            const exec = this.config?.types?.[suggestion?.type];

            try {
                if (exec) {
                    const fn = (exec as any)?.[suggestion.task] as Function;

                    if (typeof fn === "function") {
                        if (Array.isArray(args)) {
                            await fn.bind(exec)(...args);

                            await this.config?.callbacks?.onSuccessfulSuggestionRun?.(_suggestion);
                        } else {
                            await fn.bind(exec)(args);

                            await this.config?.callbacks?.onSuccessfulSuggestionRun?.(_suggestion);
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

            await new Promise(resolve => setTimeout(resolve, this.config.delay ?? 10))
        }

        return {
            errors,
            success
        }
    }
}