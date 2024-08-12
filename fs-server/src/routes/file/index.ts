import { Elysia, t } from "elysia";
import { AITaskExecutorOnMutate, AvailableTasks } from "@services/ai/tasks/types";
import { GoogleStorage } from "@services/storage/google";
import { FileAnalyzer } from "@services/file/analyzer";
import { FileAnalyzerTextType } from "@services/file/analyzer/types/text";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoMoveTask } from "@services/ai/tasks/auto-move";
import { AISuggestionExecutor } from "@services/ai/suggestion/executor";
import userConfig from "@config/user.config";
import { handleCombinedSession, handleSecretSession } from "@app/server/session";
import { IAISuggestion } from "@services/ai/suggestion/types";
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
import { StorageFile } from "@services/file/storage";
import { AIAutoTagTask, AITaskFileTagConfig } from "@services/ai/tasks/auto-tag";
import { FileAnalyzerVideoType } from "@services/file/analyzer/types/video";
import { AISuggestion } from "@services/ai/suggestion";
import { Storage } from "@services/storage"
import mime from "mime-types";
import { DBLogger } from "@apps/firebase/logger";
import { FileAnalyzerAudioType } from "@services/file/analyzer/types/audio";
import { Doc } from "@apps/firebase/doc";
import { FileAnalyzerImageType } from "@services/file/analyzer/types/image";
import { sortArrayByObject } from "@utils/array";
import { FileAnalyzerDocumentType } from "@services/file/analyzer/types/docs";
import { FileAnalyzerSpreadsheetType } from "@services/file/analyzer/types/spreadsheet";

const ws = new Elysia({ prefix: "/processing" })
    .derive(handleCombinedSession)
    .state("connectedUsers", {} as Record<string, () => void>)
    .ws("/", {
        open: (ws) => {
            const userId = ws.data.user?.id as string;
            ws.data.store.connectedUsers[userId] = onValue(ref(db, `file_processing/${userId}`), (snapshot) => {
                const json = snapshot.toJSON();
                console.log(json)
                json && ws.send({
                    event: "file:process",
                    data: json
                });
            });
        },

        close: (ws) => {
            const userId = ws.data.user?.id as string;
            const store = ws.data.store.connectedUsers;

            if (store) {
                store[userId]?.();

                delete ws.data?.store?.connectedUsers?.[userId];
            }
        }
    })

// TODO: Make new class UndoMap (Or the representation in some classes),
//  which allows to run undo of called functions. (Just specify undo function of function)
//  for ex:
//  ```
//  storage.uploadFile(filePath);
//  const step = storage.getSteps()[0];
//  step.undo(); // (this function just call another function storage.removeFile(filePath))
//  ```

export default new Elysia({ prefix: "/file" })
    .use(ws)

    .derive({ as: "local" }, handleSecretSession)

    .post("/analyze", async ({ body, user }) => {
        const fileExtension = path.extname(body.name);
        const fileMimeType = (mime.lookup(fileExtension) || body.contentType) ?? "";
        const fileSize = body.size ?? 0;

        if (fileSize === 0) {
            throw jsonError("File size can't be 0");
        }

        if (!fileExtension) {
            throw jsonError("File should end with extension");
        }

        const [userId, uniqueID, fileName] = body.name.split("/") as [
            string,
            string,
            string
        ];

        if (userId !== user.id) {
            throw new Error("Invalid user!");
        }

        try {
            const fileUpcomingTaskRef = await getDocs(
                query(
                    collection(firestore, "file_upcoming_tasks"),
                    where("user_id", "==", user.id),
                    where("id", "==", uniqueID),
                )
            ).then(_ => _.docs[0])

            const { tasks: _tasks } = fileUpcomingTaskRef.data() as {
                id: string;
                user_id: string;
                tasks: AvailableTasks[];
            }

            const tasks = sortArrayByObject<AvailableTasks>(_tasks, {
                "0": ["autoTag"],
                "1": ["autoMove", "autoRename"]
            })

            const googleStorage = new GoogleStorage({
                bucket: body.bucket,
                prefix: user.id
            });
            const userStorage = new GoogleStorage({
                bucket: userConfig.fileBucket,
                prefix: user.id
            });
            const storage = new Storage({
                userId: user.id
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
            }>(`file_processing/${user.id}/${randomBytes(12).toString("hex")}`);

            const filesDoc = new Doc<FSFile>("files");

            logger.log({
                file: currentKey,
                suggestions: {
                    tasks,
                },
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                process: "starting",
                currentStep: "Downloading file..."
            })

            console.log("Downloading file...")
            const [file, tree, fileRef, userFileTags] = await Promise.all([
                googleStorage.downloadFileAsChunk({
                    key: body.name,
                    chunkSize: 15 * 1024 * 1024 /* Max 15MB */
                }),

                userStorage.getTree(user.id),

                filesDoc.add({
                    content_type: fileMimeType,
                    name: path.basename(currentKey),
                    path: path.dirname(currentKey),
                    size: fileSize,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: user.id,
                    ai: {
                        suggestions: {
                            tasks
                        }
                    },
                    tags: []
                }),
                storage.getAllTags()
            ])

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
                    fileId: fileRef.id,
                    updated_at: new Date().toISOString(),
                    currentStep: "Analyzing file...",
                    process: "processing"
                })

                console.log("Analyzing file... & Moving file from tmp bucket to user bucket...")
                const [analyzerOutput] = await Promise.all([
                    analyzer.analyze(),
                    // storage.moveFileToAnotherBucket({
                    googleStorage.moveFileToAnotherBucket({
                        currentKey: body.name,
                        destinationKey: `${user.id}/${pureKey}`,
                        destinationBucket: userConfig.fileBucket,
                    })
                ]);

                const fileContent = await analyzerOutput.getFile().getContent();
                // console.log({ fileContent })
                if (fileContent.length > 15000) {
                    throw new Error("File is too big")
                }

                const fileMut = new MutateMap({
                    file: new FileInput({
                        pathToFile: pureKey,
                        content: fileContent
                    }),
                    fsTree: tree
                });

                const suggestionExecutor = new AISuggestionExecutor({
                    types: {
                        storage: userStorage,
                        file: new StorageFile({
                            fileRef,
                            userId: user.id
                        })
                    },
                    allowedTasks: {
                        "storage": ["moveFile", "renameFile"],
                        "file": ["tagFile"]
                    },
                    callbacks: {
                        async onSuccessfulSuggestionRun(suggestion: IAISuggestion): Promise<void> {
                            const { type, task, args } = suggestion.getSuggestion();

                            if (type === "storage" && (task === "moveFile" || task === "renameFile")) {
                                const _args = args as {
                                    from: string;
                                    to: string;
                                }

                                const ext = path.extname(_args.to);

                                const fileName = path.basename(_args.from);
                                currentKey = path.join(userStorage.prefix ?? "", ...(ext ? [_args.to] : [_args.to, fileName]));
                            }
                        }
                    }
                });
                const ct = suggestionExecutor.continuous();

                const taskExecutor = new AITaskExecutor({
                    registeredTasks: [
                        new AIAutoMoveTask({
                            mutate: fileMut
                        }),
                        new AIAutoRenameTask({
                            mutate: fileMut
                        }),
                        // @ts-ignore
                        new AIAutoTagTask({
                            mutate: fileMut.extend({
                                tags: userFileTags.map(_ => _.name),
                                maxToAssignTags: 1,
                                minToAssignTags: 3
                            }) as MutateMap<AITaskFileTagConfig>
                        })
                    ],
                    async onMutate({ param, value }: AITaskExecutorOnMutate) {4
                        // @ts-ignore
                        fileMut.set(param, value)
                    },
                    onSuccessfulTaskExecution(task: AvailableTasks, suggestions: AISuggestion[]): Promise<void> | void {
                        ct.run(suggestions);
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
                    currentStep: "Making suggestions...",
                })

                console.log("Making suggestions...")
                const out = await ct.complete();

                await new Promise(resolve => setTimeout(resolve, 10));

                logger.log({
                    updated_at: new Date().toISOString(),
                    currentStep: "Finishing...",
                    process: "finishing"
                })

                await Promise.all([
                    filesDoc.update({
                        name: path.basename(currentKey),
                        path: path.dirname(currentKey).replace(`${user.id}/`, ""),
                        updated_at: new Date().toISOString(),
                        ai: {
                            suggestions: {
                                tasks,
                                last_suggested_at: new Date().toISOString()
                            }
                        }
                    }),
                    logger.close(),
                    // deleteDoc(fileUpcomingTaskRef.ref),
                    file.delete({
                        removeWithDir: true
                    })
                ])

                return Response.json(out, {
                    status: out.success ? 200 : 400
                });
            } catch (e) {
                await Promise.all([
                    logger.close(),
                    // deleteDoc(fileUpcomingTaskRef.ref),
                    filesDoc.delete().catch(),
                    file.delete({
                        removeWithDir: true
                    }),
                    userStorage.deleteFile({
                        key: currentKey
                    }).catch()
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
            bucket: t.String(),
            name: t.String(),
            contentType: t.Optional(t.String()),
            size: t.Number(),
        }),
    })

