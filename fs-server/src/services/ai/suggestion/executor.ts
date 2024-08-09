import {
    AISuggestionExecutorConfig,
    AISuggestionExecutorRunOutput,
    IAISuggestion,
    IAISuggestionExecutor,
    IAISuggestionExecutorContinuous
} from "@services/ai/suggestion/types";

type RunSuggestionOutput = {
    success: boolean;
    error: Error | undefined;
}

export class AISuggestionExecutor implements IAISuggestionExecutor {
    config: AISuggestionExecutorConfig;

    constructor(config: AISuggestionExecutorConfig) {
        this.config = config;
    }

    private async _runSuggestion(_suggestion: IAISuggestion): Promise<RunSuggestionOutput> {
        const suggestion = _suggestion.getSuggestion();
        const args = suggestion.args;

        let success: boolean = true;
        let error: Error | undefined;

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
            error = e as Error;
            success = false;
        }

        return {
            success,
            error
        }
    }

    async run(suggestions: IAISuggestion[]): Promise<AISuggestionExecutorRunOutput> {
        const errors: AISuggestionExecutorRunOutput["errors"] = {};
        let success: boolean = true;

        for (const _suggestion of suggestions) {
            const out = await this._runSuggestion(_suggestion);

            success = out.success;

            if (out.error) {
                errors[_suggestion.getSuggestion().type] = out.error;
            }

            await new Promise(resolve => setTimeout(resolve, this.config.delay ?? 10))
        }

        return {
            errors,
            success
        }
    }

    continuous(): IAISuggestionExecutorContinuous {
        const promises: Promise<RunSuggestionOutput>[] = [];
        const suggestions: IAISuggestion[] = [];

        return {
            run: (suggestion: IAISuggestion[]) => {
                promises.push(
                    ...suggestion.map(_ => this._runSuggestion(_))
                );
                suggestions.push(...suggestion);
            },
            complete: async (): Promise<AISuggestionExecutorRunOutput> => {
                const errors: AISuggestionExecutorRunOutput["errors"] = {};
                let success: boolean = true;

                let i = 0;

                for (const promise of promises) {
                    const out = await promise;

                    success = out.success;

                    if (out.error) {
                        errors[suggestions[i].getSuggestion().type] = out.error;
                    }

                    await new Promise(resolve => setTimeout(resolve, this.config.delay ?? 10));

                    i++;
                }

                return {
                    errors,
                    success
                }
            }
        }
    }
}