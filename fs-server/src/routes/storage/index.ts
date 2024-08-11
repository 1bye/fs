import { Elysia, t } from "elysia";
import { jsonError } from "@app/server/response/error";
import serverConfig from "@config/server.config";
import { handleSession } from "@app/server/session";
import { GoogleStorage, TransferManager } from "@services/storage/google";
import userConfig from "@config/user.config";
import { json } from "@app/server/response";
import { collection, getDocs, where, query, getDoc, addDoc } from "firebase/firestore";
import { firestore } from "@apps/firebase";
import { FSFile, FSFileRaw, FSFileTag } from "@app/types/fs/file";
import fs from "fs/promises";
import { randomBytes } from "node:crypto";
import { buildStorageTree } from "@utils/storage/tree";
import { Storage } from "@services/storage";

export default new Elysia({ prefix: "/storage" })
    .derive(handleSession)
    .post("/upload", async ({ body, user }) => {
        const storage = new GoogleStorage({
            bucket: userConfig.tmpFileBucket
        });
        const data = body as {
            filepond?: ["{}", Blob];
        }

        const uniquePathID = `${user.id}-${Date.now()}`;
        const tr = new TransferManager(storage.bucket);

        if (data.filepond) {
            const [, file] = data.filepond;
            const uniqueID = randomBytes(12).toString("hex");
            const filePath = `${serverConfig.tmpFolder}/${uniquePathID}/${file.name}`;
            const fileToUpload = `${user.id}/${uniqueID}/${file.name}`;

            await Bun.write(filePath, file);

            const [res] = await Promise.all([
                tr.uploadFileInChunks(filePath, {
                    uploadName: fileToUpload,
                }),
                addDoc(collection(firestore, "file_upcoming_tasks"), {
                    user_id: user.id,
                    id: uniqueID,
                    tasks: ["autoMove", "autoRename", "autoTag"]
                })
            ])

            await fs.unlink(filePath);

            console.log(res);

            console.log("Successfully uploaded file")
        } else {
            console.log("Failed to upload")
            throw jsonError(new Error("Uploading not allowed"))
        }

        return json("Successfully uploaded file");
    }, {
        type: "formdata"
    })

    .get("/", async ({ user, query: q }) => {
        const storage = new Storage({
            userId: user.id
        });

        try {
            const filesRef = collection(firestore, "files");

            const [fileRefs, allTags] = await Promise.all([
                getDocs(
                    query(filesRef, where("user_id", "==", user.id))
                ),
                storage.getAllTags()
            ])

            const files = await Promise.all(
                fileRefs.docs.map(async _ => {
                    const { tags: rawTags, ...file } = _.data() as FSFileRaw;

                    const tags = await Promise.all(
                        rawTags.map(async _ => await getDoc(_))
                    )

                    return {
                        id: _.ref.id,
                        ...file,
                        tags: tags.map(_ => _.data() as FSFileTag)
                    } as FSFile;
                })
            )

            return json({
                tags: allTags,
                files: q.format === "tree" ? buildStorageTree(files) : files,
            });
        } catch (e) {
            throw jsonError(e as Error);
        }
    }, {
        query: t.Object({
            format: t.Optional(t.Literal("tree"))
        })
    })