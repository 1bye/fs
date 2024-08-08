import { AITaskExecutorConfig, AvailableTasks, IAITask, IAITaskExecutor } from "@services/ai/tasks/types";
import { AISuggestion } from "@services/ai/suggestion";

export class AITaskExecutor implements IAITaskExecutor {
    config: AITaskExecutorConfig;
    registeredTasks: IAITask[] = [];

    constructor(config: AITaskExecutorConfig) {
        this.config = config;
        this.registeredTasks = this.config.registeredTasks ?? [];
    }

    register(task: IAITask | IAITask[]) {
        this.registeredTasks.push(...Array.isArray(task) ? task : [task])
    }

    async execute(tasks: AvailableTasks[]): Promise<AISuggestion[]> {
        const suggestions: AISuggestion[] = [];

        for (const task of tasks) {
            const aiTask = this.registeredTasks.find(_ => _.name === task);

            if (!aiTask) {
                throw new Error(`Not found AI Task, please register following AI Task: ${task}`);
            }

            this.config.verbose && console.log(`Running AI Task ${task}`);

            suggestions.push(...await aiTask.run({
                mutateParam: async (param: string, value: any): Promise<void> => {
                    this.config?.onMutate?.({
                        param,
                        task,
                        value
                    })
                }
            }));

            await new Promise(resolve => setTimeout(resolve, this.config.delay ?? 10))
        }

        return suggestions;
    }
}