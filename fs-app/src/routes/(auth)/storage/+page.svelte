<script lang="ts">
    import { StorageBaseView } from "$lib/components/storage";
    import { Chip } from "m3-svelte";
    import type { StorageFileTag, StorageTreeFolder } from "$lib/types/storage";
    import { writable, type Writable } from "svelte/store";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { goto, invalidate } from "$app/navigation";
    import { unwrapStorageTreeToFolders } from "$lib/utils/storage/tree";
    import { PUBLIC_WS_SERVER_URL } from "$env/static/public";
    import { WSReader } from "$lib/utils/ws/reader";
    import { type FileProcessLog, WSEventFileProcess } from "$lib/storage/ws/events/file-process";

    export let data;

    const processingFiles: Writable<Record<string, FileProcessLog>> = writable({});
    const path: Writable<StorageTreeFolder[]> = writable([]);
    const query = new URLSearchParams($page.url.searchParams.toString());

    let baseFiles = data.storage.files;
    let currentTags: StorageFileTag[] = [];

    function updatePath({ folder }: {
        folder: StorageTreeFolder
    }) {
        const pathFolder = $path.find(_ => _.path === folder.path);

        if (pathFolder) {
            path.set($path.filter(_ => _.path !== pathFolder.path));
        } else {
            path.set([
                ...$path,
                folder
            ]);
        }

        renderFiles();
    }

    function toStorage() {
        path.set([]);

        renderFiles();
    }

    function toPath(p: string) {
        const num = p.split("/").filter(Boolean);
        path.set($path.toSpliced(num.length));

        renderFiles();
    }

    function choseTag(tag: StorageFileTag) {
        const index = currentTags.findIndex(_ => _.name === tag.name);

        if (index !== -1) {
            currentTags.splice(index, 1);
        } else {
            currentTags.push(tag);
        }

        currentTags = currentTags;

        renderFiles();
    }

    function renderFiles() {
        const items = $path.at(-1)?.items ?? data.storage.files;

        baseFiles = items.filter(_ => {
            if (_.type === "folder") return true;

            const tags: StorageFileTag[] = _.data.tags;

            return currentTags.length > 0 ? tags.some(_ => currentTags.findIndex(t => t.name === _.name) !== -1) : true;
        });

        query.set("storage-path", $path.map(_ => _.name).join("/"))
        goto(`/storage?${query}`)
    }

    onMount(() => {
        const storagePath = query.get("storage-path");
        const folders = unwrapStorageTreeToFolders(baseFiles, false);

        if (storagePath) {
            const storagePaths = storagePath.split("/");
            let pathDir: string[] = [];

            for (const sp of storagePaths) {
                pathDir.push(sp);

                const folder = folders.find(_ => _.path === `/${pathDir.join("/")}`);

                path.set([...$path, {
                    path: folder?.path ?? `/${pathDir.join("/")}`,
                    items: folder?.items ?? [],
                    tagCount: folder?.tagCount ?? {},
                    name: folder?.name ?? sp,
                    size: folder?.size ?? 0,
                    tags: folder?.tags ?? [],
                    type: "folder"
                }])
            }

            renderFiles();
        }

        connect();
    })

    async function connect() {
        const ws = new WebSocket(`${PUBLIC_WS_SERVER_URL}/v1/file/processing`);

        const reader = new WSReader(ws, [
            new WSEventFileProcess(logs => {
                for (const log of Object.values(logs)) {
                    if (log.process !== "starting") {
                        processingFiles.update(value => {
                            value[log.fileId] = log;

                            return value;
                        })

                        console.log($processingFiles)

                        invalidate("storage:refresh");
                    }
                }
            })
        ]);

        reader.start({
            open() {
                console.log("Opened")
            },
            close() {
                console.log("Closed")
            }
        })
    }
</script>

<div class="w-full h-full flex">
    <div class="w-full h-full flex flex-col rounded-t-4xl bg-surface-container">
        <div class="px-2 pt-4">
            <h1 class="text-on-surface text-xl sm:text-2xl md:text-3xl lg:text-4xl flex items-center">
                <button on:click={toStorage} class="cursor-pointer hover:bg-surface px-4 py-1 rounded-xl">Storage</button>

                {#each $path as p}
                    <span class="w-1 flex z-10 -translate-x-1/2">/</span>
                    <button on:click={() => toPath(p.path)} class="cursor-pointer hover:bg-surface px-4 py-1 rounded-xl">{p.name}</button>
                {/each}
            </h1>
        </div>

        <div class="w-full px-6 py-4 flex gap-1">
            {#each data.storage.tags as tag}
                {@const selected = !!currentTags.find(_ => _.name === tag.name)}
                <Chip {selected} on:click={() => choseTag(tag)} type="general">
                    {tag.name}
                </Chip>
            {/each}
        </div>

        <div class="w-full h-full px-6">
            <StorageBaseView {processingFiles} on:updatePath={({ detail }) => updatePath(detail)} storage={{
            tags: data.storage.tags,
            files: baseFiles
        }} />
        </div>
    </div>

    <div class="w-1/3 h-full bg-surface pl-4">
        <div class="w-full h-full bg-surface-container rounded-t-4xl">

        </div>
    </div>
</div>