import { Storage } from "@google-cloud/storage"
import { randomBytes } from "node:crypto"
import serverConfig from "@config/server.config";
import { FileInput } from "@services/file/input";
import { $ } from "bun";
import * as path from "node:path";

export class GoogleStorage {
    storage: Storage;
    taskID: string;
    bucket: string;

    constructor(bucket: string) {
        this.bucket = bucket;

        this.storage = new Storage();
        this.taskID = randomBytes(8).toString("hex");
    }

    async downloadFile({ key }: {
        key: string;
    }) {
        const path = `${serverConfig.tmpFolder}/${this.taskID}`;
        const pathToFile = `${path}/${key}`;

        await $`mkdir -p ${path}`;

        await this.storage.bucket(this.bucket).file(key).download({
            destination: pathToFile
        });

        return new FileInput({
            pathToFile
        })
    }

    async moveFile({ to, from }: {
        to: string;
        from: string;
    }) {
        const fileName = path.basename(from);

        await this.storage.bucket(this.bucket).file(fileName).move(to, {
            preconditionOpts: {
                ifGenerationMatch: 0,
            },
        });
    }
}