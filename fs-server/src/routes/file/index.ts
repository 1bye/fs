import { Elysia, t } from "elysia";
import { AvailableTasks } from "@services/ai/tasks/types";
import { GoogleStorage, TransferManager } from "@services/storage/google";
import { FileAnalyzer } from "@services/file/analyzer";
import { FileAnalyzerTextType } from "@services/file/analyzer/types/text";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoCategoryTask } from "@services/ai/tasks/category";
import { AISuggestionExecutor } from "@services/ai/suggestion/executor";
import userConfig from "@config/user.config";
import { handleSecretSession } from "@app/server/session";

export default new Elysia({ prefix: "/file" })
    .derive({ as: "local" }, handleSecretSession)
    .onParse((request, contentType) => {
        console.log(request, contentType)
    })
    .post("/analyze", async ({ body, user }) => {
        const tasks: AvailableTasks[] = ["autoCategory"];
        const storage = new GoogleStorage({
            bucket: body.bucket,
            prefix: user.id
        });

        const pureKey = body.name.replace(`${user.id}/`, "");

        console.log("Downloading file...")
        const file = await storage.downloadFile({
            key: body.name
        })

        const analyzer = new FileAnalyzer({
            file
        });

        analyzer.registerType([
            new FileAnalyzerTextType({ file })
        ])

        console.log("Analyzing file... & Moving file from tmp bucket to user bucket...")
        const [analyzerOutput] = await Promise.all([
            analyzer.analyze(),
            storage.moveFileToAnotherBucket({
                currentKey: body.name,
                destinationKey: `${user.id}/${pureKey}`,
                destinationBucket: userConfig.fileBucket,
            })
        ]);

        console.log(analyzerOutput)
        const taskExecutor = new AITaskExecutor({
            registeredTasks: [
                new AIAutoCategoryTask({
                    file: {
                        name: pureKey,
                        content: analyzerOutput.getFile().content
                    },
                    fsTree: {}
                })
            ]
        });

        console.log("Executing tasks...")
        const taskExecutorOutput = await taskExecutor.execute(tasks);
        console.log(JSON.stringify(taskExecutorOutput, null, 2))

        const suggestionExecutor = new AISuggestionExecutor({
            types: {
                storage: new GoogleStorage({
                    bucket: userConfig.fileBucket,
                    prefix: user.id
                })
            }
        });

        console.log("Making suggestions...")
        const out = await suggestionExecutor.run(taskExecutorOutput);
        console.log(out)

        return out;
    }, {
        body: t.Object({
            bucket: t.String(),
            name: t.String(),
            contentType: t.String(),
        }),
        type: "arrayBuffer"
    })