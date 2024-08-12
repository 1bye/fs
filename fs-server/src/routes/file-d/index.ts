import { Elysia, t } from "elysia";
import { AITaskExecutorOnMutate, AvailableTasks } from "@services/ai/tasks/types";
import { FileAnalyzer } from "@services/file/analyzer";
import { FileAnalyzerTextType } from "@services/file/analyzer/types/text";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoMoveTask } from "@services/ai/tasks/auto-move";
import path from "node:path";
import { db, firestore } from "@apps/firebase";
import { ref, onValue } from "firebase/database";
import { collection, query, where, getDocs } from "firebase/firestore";
import { randomBytes } from "node:crypto";
import { JsonError, jsonError } from "@app/server/response/error";
import { MutateMap } from "@services/etc/mutate";
import { FileInput } from "@services/file/input";
import { AIAutoRenameTask } from "@services/ai/tasks/auto-rename";
import { FSFile } from "@app/types/fs/file";
import { AIAutoTagTask, AITaskFileTagConfig } from "@services/ai/tasks/auto-tag";
import { FileAnalyzerVideoType } from "@services/file/analyzer/types/video";
import mime from "mime-types";
import { DBLogger } from "@apps/firebase/logger";
import { FileAnalyzerAudioType } from "@services/file/analyzer/types/audio";
import { Doc } from "@apps/firebase/doc";
import { FileAnalyzerImageType } from "@services/file/analyzer/types/image";
import { sortArrayByObject } from "@utils/array";
import { FileAnalyzerDocumentType } from "@services/file/analyzer/types/docs";
import { FileAnalyzerSpreadsheetType } from "@services/file/analyzer/types/spreadsheet";
import serverConfig from "@config/server.config";
import { ip } from "elysia-ip";
import { FSTreeRoot } from "@utils/tree";
import { json } from "@app/server/response";

function parseIp(ip: string): string | undefined {
    return ip === " " || !ip ? undefined : ip;
}



const ws = new Elysia({ prefix: "/processing" })
    .state("connectedApps", {} as Record<string, () => void>)
    .use(ip())

    .ws("/", {
        open: (ws) => {
            let deviceId = parseIp(ws.data.ip);

            if (!deviceId && serverConfig.production) {
                ws.close();
            }

            deviceId = (deviceId ?? "localhost").replace(/[.#\$\[\]]/g, "");

            const path = `file_processing/${deviceId}`;
            console.log({deviceId, path})
            ws.data.store.connectedApps[deviceId] = onValue(ref(db, path), (snapshot) => {
                const json = snapshot.toJSON();
                console.log(json)
                json && ws.send({
                    event: "file:process",
                    data: json
                });
            });
        },

        close: (ws) => {
            const deviceId = (parseIp(ws.data.ip) ?? "localhost").replace(/[.#\$\[\]]/g, "");
            const store = ws.data.store.connectedApps;
            console.log({deviceId})

            if (store) {
                store[deviceId]?.();

                delete ws.data?.store?.connectedApps?.[deviceId];
            }
        }
    })

export default new Elysia({ prefix: "/file-d" })
    .use(ws)
    .use(ip())

    .post("/analyze", async ({ body, ip }) => {
        const bodyFile = body.file as File;

        let deviceId = parseIp(ip);

        if (!deviceId && serverConfig.production) {
            throw jsonError("Invalid device id!");
        }

        deviceId = (deviceId ?? "localhost").replace(/[.#\$\[\]]/g, "");
        console.log({ deviceId })
        const _tasks = body.tasks.split(", ") as AvailableTasks[];
        const tree: string | FSTreeRoot = body.tree;
        const fileId = Math.random().toString();

        const fileName = path.basename(bodyFile.name);
        const fileExtension = path.extname(bodyFile.name);
        const fileMimeType = (mime.lookup(fileExtension) || bodyFile.type) ?? "";
        const fileSize = bodyFile.size ?? 0;

        if (fileSize === 0) {
            throw jsonError("File size can't be 0");
        }

        if (!fileExtension) {
            throw jsonError("File should end with extension");
        }

        try {
            const tasks = sortArrayByObject<AvailableTasks>(_tasks, {
                "0": ["autoTag"],
                "1": ["autoMove", "autoRename"]
            })

            // const fileProcessingPath = ;
            const pureKey = fileName;
            let currentKey = pureKey;

            const logger = new DBLogger<{
                file: string;
                fileId: string;
                suggestions: {
                    tasks: AvailableTasks[];
                };
                started_at: string;
                updated_at: string;
                process: string;
                currentStep: string;
            }>(`file_processing/${deviceId}/${randomBytes(12).toString("hex")}`);

            const filesDoc = new Doc<FSFile>("files");

            logger.log({
                file: currentKey,
                suggestions: {
                    tasks,
                },
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                process: "starting",
                currentStep: "Uploading file..."
            })

            console.log("Uploading file...");

            await Bun.write(`${serverConfig.tmpFolder}/${deviceId}/${pureKey}`, await bodyFile.arrayBuffer())

            const file = new FileInput({
                pathToFile: `${serverConfig.tmpFolder}/${deviceId}/${pureKey}`
            })

            file.setSize(fileSize);
            file.setType(fileMimeType);

            try {
                const analyzer = new FileAnalyzer({
                    file,
                });

                analyzer.registerType([
                    new FileAnalyzerTextType({ file }),
                    new FileAnalyzerVideoType({ file }),
                    new FileAnalyzerAudioType({ file }),
                    new FileAnalyzerImageType({ file }),
                    new FileAnalyzerDocumentType({ file }),
                    new FileAnalyzerSpreadsheetType({ file })
                ])

                logger.log({
                    fileId: fileId,
                    updated_at: new Date().toISOString(),
                    currentStep: "Analyzing file...",
                    process: "processing"
                })

                console.log("Analyzing file... & Moving file from tmp bucket to user bucket...")
                const analyzerOutput = await analyzer.analyze()

                const fileContent = await analyzerOutput.getFile().getContent();
                // console.log({ fileContent })
                if (fileContent.length > 25000) {
                    throw new Error("File is too big")
                }

                const fileMut = new MutateMap({
                    file: new FileInput({
                        pathToFile: pureKey,
                        content: fileContent
                    }),
                    fsTree: tree
                });

                const taskExecutor = new AITaskExecutor({
                    registeredTasks: [
                        // @ts-ignore
                        new AIAutoMoveTask({
                            mutate: fileMut
                        }),
                        // @ts-ignore
                        new AIAutoRenameTask({
                            mutate: fileMut
                        }),
                        // @ts-ignore
                        new AIAutoTagTask({
                            mutate: fileMut.extend({
                                tags: [""],
                                maxToAssignTags: 1,
                                minToAssignTags: 3
                            }) as MutateMap<AITaskFileTagConfig>
                        })
                    ],
                    async onMutate({ param, value }: AITaskExecutorOnMutate) {4
                        // @ts-ignore
                        fileMut.set(param, value)
                    }
                });

                logger.log({
                    updated_at: new Date().toISOString(),
                    currentStep: "Executing tasks...",
                })

                console.log("Executing tasks...")
                const taskExecutorOutput = await taskExecutor.execute(tasks);
                console.log(JSON.stringify(taskExecutorOutput, null, 2))

                logger.log({
                    updated_at: new Date().toISOString(),
                    currentStep: "Finishing...",
                    process: "finishing"
                })

                await Promise.all([
                    logger.close(),
                    // deleteDoc(fileUpcomingTaskRef.ref),
                    file.delete({
                        removeWithDir: true
                    })
                ])

                return json({
                    suggestions: taskExecutorOutput.map(_ => _.getSuggestion())
                }, 200);
            } catch (e) {
                await Promise.all([
                    logger.close(),
                    // deleteDoc(fileUpcomingTaskRef.ref),
                    filesDoc.delete().catch(),
                    file.delete({
                        removeWithDir: true
                    })
                ])

                throw jsonError(e as Error);
            }
        } catch (e) {
            if (e instanceof JsonError)
                throw e;

            throw jsonError(e as Error);
        }
    }, {
        body: t.Object({
            file: t.File({
                maxSize: "25m"
            }),
            tree: t.String(),
            tasks: t.String()
        }),
    })

