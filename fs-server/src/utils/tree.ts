export type FSTreeRoot = Record<string, FSTreeFile | FSTreeFolder>

export type FSTreeFile = {
    type: "file";
    data: unknown;
}

export type FSTreeFolder = {
    type: "folder";
    items: FSTreeRoot;
    data: unknown;
}

export interface TreeConfig {
    showFiles?: boolean;
    showFolders?: boolean;
}

export function generateTree(
    root: FSTreeRoot,
    config: TreeConfig = { showFiles: true, showFolders: true },
    depth: number = 0,
    prefix: string = ""
): string {
    const { showFiles, showFolders } = config;
    let tree = "";

    const entries = Object.entries(root);
    entries.forEach(([name, item], index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const subPrefix = isLast ? "    " : "│   ";

        if (item.type === "file" && showFiles) {
            tree += `${prefix}${connector}${name}\n`;
        } else if (item.type === "folder" && showFolders) {
            tree += `${prefix}${connector}${name}/\n`;
            tree += generateTree(item.items, config, depth + 1, prefix + subPrefix);
        }
    });

    return tree;
}