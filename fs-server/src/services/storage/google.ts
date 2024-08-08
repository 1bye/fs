import { Storage, Bucket, File } from "@google-cloud/storage"
import { randomBytes } from "node:crypto"
import serverConfig from "@config/server.config";
import { FileInput } from "@services/file/input";
import { $ } from "bun";
import * as path from "node:path";
import googleConfig from "@config/google.config";
import { FSTreeFolder, FSTreeRoot, TreeConfig } from "@utils/tree";
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

        console.log("Moving file", { to, from, fileName, to2: path.join(this.prefix ?? "", to) })

        await this.bucket.file(path.join(this.prefix ?? "", fileName))
            .move(path.join(this.prefix ?? "", to, fileName), {
                // preconditionOpts: {
                //     ifGenerationMatch: 0,
                // },
            });
    }

    async copyFileToAnotherBucket({ currentKey, destinationKey, destinationBucket, metadata }: {
        currentKey: string;
        destinationKey: string;
        destinationBucket: string;
        metadata?: Record<string, string | number | boolean | null> | undefined
    }) {
        console.log("Copying file to another bucket", {
            destinationBucket,
            currentKey,
            destinationKey
        })

        await this.bucket
            .file(currentKey)
            .copy(this.storage.bucket(destinationBucket).file(destinationKey), {
                metadata
            });
    }

    async moveFileToAnotherBucket({ currentKey, destinationKey, destinationBucket }: {
        currentKey: string;
        destinationKey: string;
        destinationBucket: string;
    }) {
        console.log("Moving file to another bucket", {
            destinationBucket,
            currentKey,
            destinationKey
        })

        await this.bucket
            .file(currentKey)
            .move(this.storage.bucket(destinationBucket).file(destinationKey));
    }

    async getTree(
        delimiter: string = "",
    ): Promise<FSTreeRoot> {
        const options = {
            prefix: this.prefix,
            delimiter: delimiter,
        };

        // Get files and directories under the prefix
        const [files] = await this.bucket.getFiles(options);

        let tree: FSTreeRoot = {};
        console.log(files.map(_ => _.name))

        function rec(paths: string[], tree: FSTreeRoot): FSTreeRoot {
            const currentPath = paths[0];
            const remainingPaths = paths.slice(1);

            if (!currentPath) return tree;

            if (remainingPaths.length === 0) {
                tree[currentPath] = {
                    type: "file",
                    data: {}
                };
            } else {
                tree[currentPath] = tree[currentPath] || {
                    type: "folder",
                    items: {}
                };

                // Recurse into the next level of the tree
                (tree[currentPath] as FSTreeFolder).items = rec(remainingPaths, (tree[currentPath] as FSTreeFolder).items);
            }

            return tree;
        }

        for (const file of files) {
            const baseName = this.prefix ? file.name.replace(`${this.prefix}/`, "") : file.name;

            const paths = baseName.split("/");

            // Build the tree structure iteratively
            tree = rec(paths, tree);
        }

        return tree;
    }
}