import { Storage, Bucket } from "@google-cloud/storage"
import { randomBytes } from "node:crypto"
import serverConfig from "@config/server.config";
import { FileInput } from "@services/file/input";
import { $ } from "bun";
import * as path from "node:path";
import googleConfig from "@config/google.config";
// import GoogleCredentials from "@credentials/credentials.json"

export { TransferManager } from "@google-cloud/storage"

export class GoogleStorage {
    storage: Storage;
    taskID: string;
    bucket: Bucket;

    prefix: string | undefined;

    constructor({ bucket, prefix }: {
        bucket: string;
        prefix?: string;
    }) {
        this.storage = new Storage({
            projectId: googleConfig.projectId,
            // credentials: GoogleCredentials
        });

        this.bucket = this.storage.bucket(bucket);
        this.taskID = randomBytes(8).toString("hex");

        this.prefix = prefix || "";
    }

    async downloadFile({ key }: {
        key: string;
    }) {
        const path = `${serverConfig.tmpFolder}/${this.taskID}`;
        const pathToFile = `${path}/${key}`;

        await $`mkdir -p ${path}`;

        // console.log(this.bucket, key, pathToFile)

        await Bun.write(pathToFile, await this.bucket.file(key).download({
            // destination: pathToFile
        }));

        return new FileInput({
            pathToFile
        })
    }

    async getMetadata({ key }: {
        key: string;
    }) {
        return await this.bucket.file(key).getMetadata();
    }

    async moveFile({ to, from }: {
        to: string;
        from: string;
    }) {
        const fileName = path.basename(from);

        console.log("Moving file", { to, from, fileName })

        await this.bucket.file(fileName).move(path.join(this.prefix ?? "", to), {
            preconditionOpts: {
                ifGenerationMatch: 0,
            },
        });
    }

    async copyFileToAnotherBucket({ currentKey, destinationKey, destinationBucket }: {
        currentKey: string;
        destinationKey: string;
        destinationBucket: string;
    }) {
        console.log("Copying file to another bucket", {
            destinationBucket,
            currentKey,
            destinationKey
        })

        await this.bucket
            .file(currentKey)
            .copy(this.storage.bucket(destinationBucket).file(destinationKey));
    }
}