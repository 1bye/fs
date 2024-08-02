import { Elysia, t } from "elysia";
import { AvailableTasks } from "@services/ai/tasks/types";
import { FileAnalyzer } from "@services/file/analyzer";
import { GoogleStorage } from "@services/storage/google";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoCategoryTask } from "@services/ai/tasks/category";
import { AISuggestionExecutor } from "@services/ai/suggestion/executor";
import { FileAnalyzerTextType } from "@services/file/analyzer/types/text";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { SignDTOModel } from "@app/server/models/auth";
import { firebaseAuth } from "@apps/firebase";
import serverConfig from "@config/server.config";

const app = new Elysia()
    .get("/v1/health", () => "Everything is OK")

    .post("/v1/auth/login", async () => {

    })

    .post("/v1/auth/register", async ({ body, cookie }) => {
        try {
            const user = await firebaseAuth.createUser({
                email: body.email,
                password: body.password,
            });

            const idToken = await user.getIdToken();



            cookie.set({
                httpOnly: true,
                secure: serverConfig.production,
                sameSite: "lax",
                value: idToken
            });

            return {
                success: true,
                errors: {}
            }
        } catch (e) {
            return {
                success: false,
                errors: {
                    register: e
                }
            }
        }
    }, {
        body: SignDTOModel
    })

    .post("/v1/file/analyze", async ({ body }) => {
        const tasks: AvailableTasks[] = ["autoCategory"];
        const storage = new GoogleStorage(body.bucket);

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
        console.log(JSON.stringify(taskExecutorOutput, null, 2))

        const suggestionExecutor = new AISuggestionExecutor({
            types: {
                storage
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
        })
    })
    .listen(3000);

console.log(
    `📁 FS server is running at ${app.server?.hostname}:${app.server?.port}`
);
