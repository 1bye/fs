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

        await Promise.all(tasks.map(async task => {
            const aiTask = this.registeredTasks.find(_ => _.name === task);

            if (!aiTask) {
                throw new Error(`Not found AI Task, please register following AI Task: ${task}`);
            }

            suggestions.push(...await aiTask.run());
        }))

        return suggestions;
    }
}