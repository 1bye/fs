import type { StorageFile, StorageTreeRoot, StorageTreeFolder } from "$lib/types/storage";

export function unwrapStorageTree(tree: StorageTreeRoot): StorageFile[] {
    const result: StorageFile[] = [];

    function traverseTree(root: StorageTreeRoot) {
        for (const node of root) {
            if (node.type === "file") {
                // If the node is a file, add it to the result list
                result.push(node.data);
            } else if (node.type === "folder") {
                // If the node is a folder, recursively traverse its items
                traverseTree(node.items);
            }
        }
    }

    // Start the traversal from the root
    traverseTree(tree);

    return result;
}

export function unwrapStorageTreeToFolders(
    tree: StorageTreeRoot,
    flatten: boolean = true
): StorageTreeFolder[] {
    const result: StorageTreeFolder[] = [];

    function traverseTree(root: StorageTreeRoot, parentFolder?: StorageTreeFolder) {
        for (const node of root) {
            if (node.type === "folder") {
                // Create a shallow copy of the folder without nested folders
                const folderCopy: StorageTreeFolder = {
                    ...node,
                    items: []
                };

                if (parentFolder) parentFolder.items.push(folderCopy);

                // Add the folder to the result array
                result.push(folderCopy);

                // Recursively process the items of the current folder
                if (flatten) {
                    // If flattening, add all child folders directly to the result array
                    traverseTree(node.items);
                } else {
                    // If not flattening, keep the structure and add the files and subfolders
                    traverseTree(node.items, folderCopy);
                }
            } else if (node.type === "file" && parentFolder) {
                // If it's a file, add it to the parent folder's items
                parentFolder.items.push(node);
            }
        }
    }

    // Start the traversal from the root
    traverseTree(tree);

    return result;
}