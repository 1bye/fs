import { Elysia, t } from "elysia";
import { AITaskExecutorOnMutate, AvailableTasks } from "@services/ai/tasks/types";
import { GoogleStorage } from "@services/storage/google";
import { FileAnalyzer } from "@services/file/analyzer";
import { FileAnalyzerTextType } from "@services/file/analyzer/types/text";
import { AITaskExecutor } from "@services/ai/tasks/executor";
import { AIAutoMoveTask } from "@services/ai/tasks/auto-move";
import { AISuggestionExecutor } from "@services/ai/suggestion/executor";
import userConfig from "@config/user.config";
import { handleSecretSession } from "@app/server/session";
import { IAISuggestion } from "@services/ai/suggestion/types";
import path from "node:path";
import { db, firestore } from "@apps/firebase";
import { set, ref, onValue, remove, update } from "firebase/database";
import { addDoc, updateDoc, collection, getDoc, query, where, getDocs } from "firebase/firestore";
import { randomBytes } from "node:crypto";
import { jsonError } from "@app/server/response/error";
import { MutateMap } from "@services/etc/mutate";
import { FileInput } from "@services/file/input";
import { AIAutoRenameTask } from "@services/ai/tasks/auto-rename";
import { FSFile } from "@app/types/fs/file";
import { StorageFile } from "@services/file/storage";
import { AIAutoTagTask, AITaskFileTagConfig } from "@services/ai/tasks/auto-tag";
import { FileAnalyzerVideoType } from "@services/file/analyzer/types/video";
import { AISuggestion } from "@services/ai/suggestion";
import { Storage } from "@services/storage"

const ws = new Elysia({ prefix: "/processing" })
    .derive(handleSecretSession)
    .state("connectedUsers", {} as Record<string, () => void>)
    .ws("/", {
        open: (ws) => {
            const userId = ws.data.user?.id as string;
            ws.data.store.connectedUsers[userId] = onValue(ref(db, `file_processing/${userId}`), (snapshot) => {
                const json = snapshot.toJSON();
                console.log(json)
                json && ws.send(json);
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
        if (body.size === 0) {
            throw jsonError("File size can't be 0");
        }

        const [userId, uniqueID, fileName] = body.name.split("/") as [
            string,
            string,
            string
        ];

        if (userId !== user.id) {
            throw new Error("Invalid user!");
        }

        const { tasks } = await getDocs(
            query(
                collection(firestore, "file_upcoming_tasks"),
                where("user_id", "==", user.id),
                where("id", "==", uniqueID),
            )
        ).then(_ => _.docs[0].data()) as {
            id: string;
            user_id: string;
            tasks: AvailableTasks[];
        }

        try {
            // const tasks: AvailableTasks[] = ["autoMove", "autoRename", "autoTag"];
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

            const pureKey = fileName.replace(`${user.id}/`, "");
            let currentKey = pureKey;

            const uniqueID = randomBytes(12).toString("hex");
            const fileProcessingPath = `file_processing/${user.id}/${uniqueID}`;

            console.log("Downloading file...")
            const [file, tree, fileRef, userFileTags] = await Promise.all([
                googleStorage.downloadFileAsChunk({
                    key: body.name,
                    chunkSize: 15 * 1024 * 1024 /* Max 15MB */
                }),
                googleStorage.getTree(),
                addDoc(collection(firestore, "files"), {
                    content_type: body.contentType ?? null,
                    created_at: new Date().toISOString(),
                    name: path.basename(currentKey),
                    path: path.dirname(currentKey),
                    size: body.size ?? 0,
                    updated_at: new Date().toISOString(),
                    user_id: user.id,
                    ai: {
                        suggestions: {
                            tasks
                        }
                    },
                    tags: []
                } as FSFile),
                storage.getAllTags()
            ])

            file.setSize(body.size ?? 0);

            await set(ref(db, fileProcessingPath), {
                file: currentKey,
                fileRef: fileRef.id,
                suggestions: {
                    tasks,
                },
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                process: "starting"
            })

            const [out] = await Promise.all([
                (async () => {
                    const analyzer = new FileAnalyzer({
                        file,
                    });

                    analyzer.registerType([
                        new FileAnalyzerTextType({ file }),
                        new FileAnalyzerVideoType({ file })
                    ])

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

                    const fileMut = new MutateMap({
                        file: new FileInput({
                            pathToFile: pureKey,
                            content: analyzerOutput.getFile().content
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

                    console.log(analyzerOutput)
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

                    console.log("Executing tasks...")
                    const taskExecutorOutput = await taskExecutor.execute(tasks);
                    console.log(JSON.stringify(taskExecutorOutput, null, 2))

                    console.log("Making suggestions...")
                    // const out = await suggestionExecutor.run(taskExecutorOutput);
                    const out = await ct.complete();
                    console.log(out)

                    await new Promise(resolve => setTimeout(resolve, 10));

                    return out;
                })(),
                update(ref(db, fileProcessingPath), {
                    updated_at: new Date().toISOString(),
                    process: "processing"
                })
            ])

            console.log(currentKey)

            await Promise.all([
                updateDoc(fileRef, {
                    name: path.basename(currentKey),
                    path: path.dirname(currentKey).replace(`${user.id}/`, ""),
                    size: body.size ?? 0,
                    updated_at: new Date().toISOString(),
                    ai: {
                        suggestions: {
                            tasks,
                            last_suggested_at: new Date().toISOString()
                        }
                    }
                } as Partial<FSFile>),
                update(ref(db, fileProcessingPath), {
                    updated_at: new Date().toISOString(),
                    process: "finished"
                })
            ])

            await Promise.all([
                remove(ref(db, fileProcessingPath)),
                file.delete({
                    removeWithDir: true
                })
            ])

            return Response.json(out, {
                status: out.success ? 200 : 400
            });
        } catch (e) {
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

