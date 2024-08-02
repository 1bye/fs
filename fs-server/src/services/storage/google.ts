import { Storage } from "@google-cloud/storage"
import { randomBytes } from "node:crypto"
import serverConfig from "@config/server.config";
import { FileInput } from "@services/file/input";
import { $ } from "bun";
import * as path from "node:path";
import googleConfig from "@config/google.config";
import GoogleCredentials from "../../../credentials/credentials.json"

export class GoogleStorage {
    storage: Storage;
    taskID: string;
    bucket: string;

    constructor(bucket: string) {
        this.bucket = bucket;

        this.storage = new Storage({
            projectId: googleConfig.projectId,
            credentials: GoogleCredentials
        });
        this.taskID = randomBytes(8).toString("hex");
    }

    async downloadFile({ key }: {
        key: string;
    }) {
        const path = `${serverConfig.tmpFolder}/${this.taskID}`;
        const pathToFile = `${path}/${key}`;

        await $`mkdir -p ${path}`;

        // console.log(this.bucket, key, pathToFile)

        await Bun.write(pathToFile, await this.storage.bucket(this.bucket).file(key).download({
            // destination: pathToFile
        }));

        return new FileInput({
            pathToFile
        })
    }

    async getMetadata({ key }: {
        key: string;
    }) {
        return await this.storage.bucket(this.bucket).file(key).getMetadata();
    }

    async moveFile({ to, from }: {
        to: string;
        from: string;
    }) {
        const fileName = path.basename(from);

        console.log("Moving file", { to, from, fileName })

        await this.storage.bucket(this.bucket).file(fileName).move(to, {
            preconditionOpts: {
                ifGenerationMatch: 0,
            },
        });
    }

    async copyFileToAnotherBucket({ key, destinationBucket }: {
        key: string;
        destinationBucket: string;
    }) {
        console.log("Copying file to another bucket", {
            destinationBucket,
            key
        })

        await this.storage
            .bucket(this.bucket)
            .file(key)
            .copy(this.storage.bucket(destinationBucket).file(key));
    }
}