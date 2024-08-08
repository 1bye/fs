import { Elysia, t } from "elysia";
import { jsonError } from "@app/server/response/error";
import serverConfig from "@config/server.config";
import { handleSession } from "@app/server/session";
import { GoogleStorage, TransferManager } from "@services/storage/google";
import userConfig from "@config/user.config";
import { json } from "@app/server/response";
import { collection, getDocs, where, query } from "firebase/firestore";
import { firestore } from "@apps/firebase";

export default new Elysia({ prefix: "/storage" })
    .derive(handleSession)
    .post("/upload", async ({ body, user }) => {
        const storage = new GoogleStorage({
            bucket: userConfig.tmpFileBucket
        });
        const data = body as {
            filepond?: ["{}", Blob];
        }

        const ID = `${user.id}-${Date.now()}`;
        const tr = new TransferManager(storage.bucket);

        if (data.filepond) {
            const [, file] = data.filepond;
            const filePath = `${serverConfig.tmpFolder}/${ID}/${file.name}`;

            await Bun.write(filePath, file);

            const res = await tr.uploadFileInChunks(filePath, {
                uploadName: `${user.id}/${file.name}`,
            })

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

    .get("/", async ({ user }) => {
        const filesRef = collection(firestore, "files");

        const files = await getDocs(
            query(filesRef, where("user_id", "==", user.id))
        )

        return json(files.docs.map(_ => _.data()))
    })