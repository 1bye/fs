import { Elysia, t } from "elysia";
import { AvailableTasks } from "@services/ai/tasks/types";
import { FileAnalyzer } from "@services/file/analyzer";
import { GoogleStorage } from "@services/storage/google";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoCategoryTask } from "@services/ai/tasks/category";
import { AISuggestionExecutor } from "@services/ai/suggestion/executor";

const app = new Elysia()
    .get("/v1/health", () => "Everything is OK")
    .post("/v1/file/analyze", async ({ body }) => {
        const tasks: AvailableTasks[] = ["autoCategory"];
        const storage = new GoogleStorage(body.bucket);

        console.log("Downloading file...")
        const file = await storage.downloadFile({
            key: body.name
        })
        console.log(file)

        const analyzer = new FileAnalyzer({
            file
        });

        console.log("Analyzing file...")
        const analyzerOutput = await analyzer.analyze();
        console.log(analyzerOutput)

        const taskExecutor = new AITaskExecutor({
            registeredTasks: [
                new AIAutoCategoryTask({
                    file: analyzerOutput.getFile(),
                    fsTree: {}
                })
            ]
        });

        console.log("Executing tasks...")
        const taskExecutorOutput = await taskExecutor.execute(tasks);
        console.log(taskExecutorOutput)

        const suggestionExecutor = new AISuggestionExecutor({
            types: {
                storage
            }
        });

        console.log("Making suggestions...")
        return await suggestionExecutor.run(taskExecutorOutput);
    }, {
        body: t.Object({
            bucket: t.String(),
            name: t.String(),
            contentType: t.String(),
        })
    })
    .listen(3000);

console.log(
    `📁 FS server is running at ${app.server?.hostname}:${app.server?.port}`
);
