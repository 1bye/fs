import { FSFile, StorageTreeFolder, StorageTreeRoot } from "@app/types/fs/file";

export function buildStorageTree(files: FSFile[]): StorageTreeRoot {
    const root: StorageTreeRoot = [];

    // Helper function to find or create a folder and accumulate size, tags, tagCount, and path
    function findOrCreateFolder(
        pathSegments: string[],
        currentRoot: StorageTreeRoot,
        currentPath: string
    ): StorageTreeFolder {
        const folderName = pathSegments[0];
        const folderPath = `${currentPath}/${folderName}`;
        let folder = currentRoot.find(
            (item) => item.type === "folder" && item.name === folderName
        ) as StorageTreeFolder | undefined;

        if (!folder) {
            folder = {
                type: "folder",
                name: folderName,
                path: folderPath,
                size: 0,
                tags: [],
                tagCount: {},
                items: []
            };
            currentRoot.push(folder);
        }

        if (pathSegments.length > 1) {
            const childFolder = findOrCreateFolder(pathSegments.slice(1), folder.items, folderPath);
            folder.size += childFolder.size;
            folder.tags.push(...childFolder.tags);
            // Merge tag counts
            for (const [tag, count] of Object.entries(childFolder.tagCount)) {
                folder.tagCount[tag] = (folder.tagCount[tag] || 0) + count;
            }
            return folder;
        } else {
            return folder;
        }
    }

    // Iterate over each file and place it in the appropriate folder
    for (const file of files) {
        const pathSegments = file.path.split("/").filter(Boolean); // Remove empty segments
        const fileName = pathSegments.pop()!;

        if (pathSegments.length === 0) {
            // File is at the root level
            root.push({
                type: "file",
                data: file
            });
        } else {
            // File is nested in folders
            const folder = findOrCreateFolder(pathSegments, root, "");
            folder.items.push({
                type: "file",
                data: file
            });

            // Update folder size and tags
            folder.size += file.size;
            folder.tags.push(...file.tags);
            // Update tag count
            for (const tag of file.tags) {
                folder.tagCount[tag.name] = (folder.tagCount[tag.name] || 0) + 1;
            }
        }
    }

    // Recursive function to aggregate folder sizes, tags, and tag counts
    function aggregateFolderSizesAndTags(folder: StorageTreeFolder) {
        folder.items.forEach((item) => {
            if (item.type === "folder") {
                aggregateFolderSizesAndTags(item);
                folder.size += item.size;
                folder.tags.push(...item.tags);
                // Merge tag counts
                for (const [tag, count] of Object.entries(item.tagCount)) {
                    folder.tagCount[tag] = (folder.tagCount[tag] || 0) + count;
                }
            }
        });
        // Remove duplicate tags
        folder.tags = Array.from(new Set(folder.tags.map(tag => JSON.stringify(tag)))).map(tag => JSON.parse(tag));
    }

    // Aggregate sizes, tags, and tag counts for all top-level folders
    root.forEach((item) => {
        if (item.type === "folder") {
            aggregateFolderSizesAndTags(item);
        }
    });

    return root;
}
