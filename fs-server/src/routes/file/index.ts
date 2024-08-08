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
import { IAISuggestion } from "@services/ai/suggestion/types";
import path from "node:path";
import { db } from "@apps/firebase";
import { addDoc, collection } from "firebase/firestore";
import { createHash } from "node:crypto";

export default new Elysia({ prefix: "/file" })
    .derive({ as: "local" }, handleSecretSession)

    // .onParse(async ({ contentType, request }) => {
    //     if (contentType === "application/json") {
    //         const data = await request.json();
    //         console.log(data)
    //         return data;
    //     }
    //
    //     console.log({ contentType, request });
    //     const d = await request.text();
    //     console.log(d)
    //     return d;
    // })
    
    .post("/analyze", async ({ body, user }) => {
        const tasks: AvailableTasks[] = ["autoCategory"];
        const storage = new GoogleStorage({
            bucket: body.bucket,
            prefix: user.id
        });
        const userStorage = new GoogleStorage({
            bucket: userConfig.fileBucket,
            prefix: user.id
        });

        const pureKey = body.name.replace(`${user.id}/`, "");
        let currentKey = pureKey;

        console.log("Downloading file...")
        const [file, tree] = await Promise.all([
            storage.downloadFile({
                key: body.name
            }),
            storage.getTree()
        ])

        console.log(tree)

        const analyzer = new FileAnalyzer({
            file
        });

        analyzer.registerType([
            new FileAnalyzerTextType({ file })
        ])

        console.log("Analyzing file... & Moving file from tmp bucket to user bucket...")
        const [analyzerOutput] = await Promise.all([
            analyzer.analyze(),
            // storage.moveFileToAnotherBucket({
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
                    fsTree: tree
                })
            ]
        });

        console.log("Executing tasks...")
        const taskExecutorOutput = await taskExecutor.execute(tasks);
        console.log(JSON.stringify(taskExecutorOutput, null, 2))

        const suggestionExecutor = new AISuggestionExecutor({
            types: {
                storage: userStorage
            },
            allowedTasks: {
                "storage": ["moveFile"]
            },
            callbacks: {
                async onSuccessfulSuggestionRun(suggestion: IAISuggestion): Promise<void> {
                    const { type, task, args } = suggestion.getSuggestion();

                    if (type === "storage" && task === "moveFile") {
                        const _args = args as {
                            from: string;
                            to: string;
                        }

                        const fileName = path.basename(_args.from);
                        currentKey = path.join(userStorage.prefix ?? "", _args.to, fileName);
                    }
                }
            }
        });

        console.log("Making suggestions...")
        const out = await suggestionExecutor.run(taskExecutorOutput);
        console.log(out)

        const hash = createHash("sha256");
        hash.update(currentKey);
        const hashedPayload = hash.digest("hex");

        console.log(currentKey, tree)

        await addDoc(collection(db, "file_data"), {
            content_type: body.contentType ?? null,
            created_at: new Date().toISOString(),
            name: path.basename(currentKey),
            path: path.dirname(currentKey),
            size: body.size ?? 0,
            updated_at: new Date().toISOString(),
            user_id: user.id,
            ai: {
                suggestions: {
                    tasks,
                    lastSuggestedAt: new Date().toISOString()
                }
            }
        });

        return Response.json(out, {
            status: out.success ? 200 : 400
        });
    }, {
        body: t.Object({
            bucket: t.String(),
            name: t.String(),
            contentType: t.Optional(t.String()),
            size: t.Optional(t.Number()),
        }),
    })